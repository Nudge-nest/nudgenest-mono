import { memo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconPlus } from '@tabler/icons-react';

import { useReview } from '../../contexts/ReviewContext.tsx';
import { IUploadedMediaObject, UploadResult } from '../../types/review.ts';
import { useUploadReviewMediaMutation } from '../../redux/nudgenest.ts';
import PreviewComponent from './MediaPreviewComponent.tsx';

const MediaWidget = memo(() => {
    const { merchantId, reviewFormHook, review, reviewId, reviewStatus } = useReview();
    const [uploadReviewMedia] = useUploadReviewMediaMutation();

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (reviewId === 'demo') {
                reviewFormHook.addMedia([
                    {
                        id: 'demo',
                        mediaURL: 'https://nudge-nest-media.s3.eu-north-1.amazonaws.com/2/1752851327463_da08ab6e_0.jpg',
                    },
                ]);
            } else {
                const formdata = new FormData();
                formdata.append('reviewId', reviewId);
                formdata.append('merchantId', merchantId);
                acceptedFiles.map((file: File) => {
                    return formdata.append('files', file);
                });
                const uploadResult = (await uploadReviewMedia(formdata).unwrap()) as UploadResult;
                const reformedUploadResult = uploadResult.map((result) => {
                    return { id: result.id, mediaURL: result.url };
                });
                reviewFormHook.addMedia(reformedUploadResult);
            }
        },
        [reviewFormHook, reviewId, merchantId, uploadReviewMedia]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.mov', '.webm', '.ogg', '.avi', '.mkv']
        },
        multiple: true
    });

    const isCompleted = review?.status === 'Completed' || reviewStatus === 'Completed';

    return (
        <section
            className="w-full h-fit h-min-25 text-[color:var(--color-text)]"
            aria-labelledby="media-widget-title"
            data-testid="media-widget"
        >
            <header className="w-full mb-8 text-center text-[color:var(--color-text)]">
                <h3
                    id="media-widget-title"
                    className="font-bold text-xl"
                    data-testid="media-widget-title"
                >
                    Brag a little
                </h3>
                <p className="font-normal text-base" data-testid="media-widget-subtitle">
                    Snap it, share it, show it off!
                </p>
            </header>

            <div
                className="w-full h-fit grid grid-cols-5 gap-1.5 p-2 border-1 border-[color:var(--color-text)] rounded-lg"
                role="region"
                aria-label="Media uploads"
                data-testid="media-container"
            >
                {reviewFormHook.media.map((media: IUploadedMediaObject, idx: number) => (
                    <PreviewComponent
                        media={media}
                        key={media.id || idx}
                        onDelete={isCompleted ? undefined : () => reviewFormHook.removeMedia(media)}
                        index={idx}
                    />
                ))}

                {!isCompleted && (
                    <div
                        {...getRootProps()}
                        className="h-20 max-w-20 w-20 border-2 border-[color:var(--color-text)] rounded-lg flex
                        items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                        role="button"
                        tabIndex={0}
                        aria-label="Upload media files. Click or drag and drop files here"
                        aria-describedby="upload-instructions"
                        data-testid="upload-button"
                    >
                        <input
                            {...getInputProps()}
                            aria-label="File input for media upload"
                            data-testid="file-input"
                        />
                        <IconPlus aria-hidden="true" />
                        <span id="upload-instructions" className="sr-only">
                            Click to select files or drag and drop images and videos here
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
});

MediaWidget.displayName = 'MediaWidget';

export default MediaWidget;