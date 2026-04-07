import { FC } from 'react';
import { IUploadedMediaObject } from '../../types/review.ts';
import { IconXboxXFilled } from '@tabler/icons-react';

interface PreviewComponentProps {
    media: IUploadedMediaObject;
    onDelete?: () => void;
    index?: number;
}

const PreviewComponent: FC<PreviewComponentProps> = ({ media, onDelete, index = 0 }) => {
    if (!media) return null;

    const isVideo = (url: string): boolean => {
        const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg', '.avi', '.mkv'];
        return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
    };

    const isVideoFile = isVideo(media.mediaURL);
    const mediaType = isVideoFile ? 'video' : 'image';
    const ariaLabel = `${mediaType} preview ${index + 1}`;

    return (
        <article
            className="relative w-full aspect-square rounded-lg overflow-hidden"
            role="img"
            aria-label={ariaLabel}
            data-testid={`media-preview-${index}`}
        >
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="absolute top-0 right-0 z-1000 bg-[color:var(--color-main)] rounded-full cursor-pointer hover:opacity-90 transition-opacity"
                    aria-label={`Remove ${mediaType} ${index + 1}`}
                    data-testid={`delete-button-${index}`}
                    type="button"
                >
                    <IconXboxXFilled size={20} fill="#fff" aria-hidden="true" />
                </button>
            )}

            {isVideoFile ? (
                <video
                    src={media.mediaURL}
                    className="w-full h-full object-cover"
                    controls={false}
                    aria-label={`Video preview ${index + 1}`}
                    data-testid={`video-preview-${index}`}
                    muted
                    playsInline
                >
                    <track kind="captions" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <img
                    src={media.mediaURL}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                        // Only revoke object URLs, not regular URLs
                        if (media.mediaURL.startsWith('blob:')) {
                            URL.revokeObjectURL(media.mediaURL);
                        }
                    }}
                    alt={`Uploaded image ${index + 1}`}
                    data-testid={`image-preview-${index}`}
                    loading="lazy"
                />
            )}
        </article>
    );
};

export default PreviewComponent;