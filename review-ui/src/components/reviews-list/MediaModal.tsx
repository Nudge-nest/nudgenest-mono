import { FC } from 'react';
import { MediaModalProps } from '../../types/review.ts';
import { useState } from 'react';
import { useEffect } from 'react';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';

const MediaModal: FC<MediaModalProps> = ({ isOpen, onClose, mediaItems, startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !mediaItems || mediaItems.length === 0) return null;

    const currentMedia = mediaItems[currentIndex];
    const mediaURL = currentMedia.mediaURL;
    const isVideo =
        mediaURL &&
        (mediaURL.includes('.mp4') ||
            mediaURL.includes('.mov') ||
            mediaURL.includes('.webm') ||
            mediaURL.includes('video'));

    return (
        <div
            className="fixed inset-0 z-[99999] bg-[color:var(--color-dark)] bg-opacity-80 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-[color:var(--color-white)] bg-[color:var(--color-dark)] bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-80 transition-all"
                >
                    <IconX size={24} />
                </button>

                <div className="flex flex-col items-center">
                    {isVideo ? (
                        <video controls className="max-w-full max-h-[80vh] rounded-lg">
                            <source src={mediaURL} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <img
                            src={mediaURL}
                            alt="Review media"
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    )}

                    {mediaItems.length > 1 && (
                        <div className="flex items-center gap-5 mt-5 bg-[color:var(--color-dark)] bg-opacity-70 rounded-full px-5 py-2">
                            <button
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                className="text-white bg-[color:var(--color-white)] bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <IconChevronLeft size={20} />
                            </button>
                            <span className="text-[color:var(--color-white)] font-medium">
                                {currentIndex + 1} / {mediaItems.length}
                            </span>
                            <button
                                onClick={() => setCurrentIndex(Math.min(mediaItems.length - 1, currentIndex + 1))}
                                disabled={currentIndex === mediaItems.length - 1}
                                className="text-white bg-[color:var(--color-white)] bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <IconChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaModal;
