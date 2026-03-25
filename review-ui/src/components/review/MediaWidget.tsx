import { memo, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconPlus } from '@tabler/icons-react';

import { useReview } from '../../contexts/ReviewContext.tsx';
import { IUploadedMediaObject, UploadResult } from '../../types/review.ts';
import { useUploadReviewMediaMutation } from '../../redux/nudgenest.ts';
import PreviewComponent from './MediaPreviewComponent.tsx';

const MediaWidget = memo(() => {
    const { merchantId, reviewFormHook, review, reviewId, reviewStatus } = useReview();
    const [uploadReviewMedia] = useUploadReviewMediaMutation();
    const [rejectionError, setRejectionError] = useState<string | null>(null);

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

    const onDropRejected = useCallback((rejectedFiles: any[]) => {
        const isSizeError = rejectedFiles.some(f =>
            f.errors?.some((e: any) => e.code === 'file-too-large')
        );
        setRejectionError(isSizeError
            ? 'File exceeds 10MB limit. Please choose a smaller file.'
            : 'Only images and videos are accepted.'
        );
        setTimeout(() => setRejectionError(null), 3000);
    }, []);

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        onDropRejected,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.mov', '.webm', '.ogg', '.avi', '.mkv']
        },
        maxSize: 10 * 1024 * 1024,
        multiple: true,
        noClick: true,
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
                <p className="text-xs text-[color:var(--color-disabled)] mt-1">
                    Uploading is optional — tap Next to skip
                </p>
                <p className="text-xs text-[color:var(--color-disabled)]">
                    Max 12 files · 10MB per file
                </p>
            </header>

            <div
                {...(!isCompleted ? getRootProps() : {})}
                className="w-full h-fit grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 border border-[color:var(--color-text)] rounded-lg"
                role="region"
                aria-label="Media uploads"
                data-testid="media-container"
            >
                {!isCompleted && <input {...getInputProps()} aria-label="File input for media upload" data-testid="file-input" />}

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
                        onClick={open}
                        className="w-full aspect-square bg-[color:var(--color-main)] rounded-lg flex
                        items-center justify-center cursor-pointer hover:opacity-90 transition-all duration-200 shadow-sm"
                        role="button"
                        tabIndex={0}
                        aria-label="Upload media files. Click or drag and drop files here"
                        aria-describedby="upload-instructions"
                        data-testid="upload-button"
                    >
                        <IconPlus aria-hidden="true" className="text-white" stroke={2.5} size={32} />
                        <span id="upload-instructions" className="sr-only">
                            Click to select files or drag and drop images and videos here
                        </span>
                    </div>
                )}
            </div>

            {rejectionError && (
                <p
                    role="alert"
                    className="text-red-500 text-sm mt-2 text-center"
                    data-testid="media-rejection-error"
                >
                    {rejectionError}
                </p>
            )}
        </section>
    );
});

MediaWidget.displayName = 'MediaWidget';

export default MediaWidget;