import { FC } from 'react';
import { ReviewFormModalProps } from '../../types/review.ts';
import { useState } from 'react';
import { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import { REVIEW_FORM_BASE_URL } from '../../constants';
import Loading from '../Loading.tsx';

const ReviewFormModal: FC<ReviewFormModalProps> = ({ isOpen, onClose, merchantId }) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Accept messages from localhost (dev) or production
            const allowedOrigins = [
                'http://localhost:3001',
                'https://nudgenest-review-ui-1094805904049.europe-west1.run.app'
            ];

            if (!allowedOrigins.includes(event.origin)) return;

            switch (event.data.type) {
                case 'review_submitted':
                    onClose();
                    window.location.reload();
                    break;
                case 'form_closed':
                    onClose();
                    break;
                default:
                    break;
            }
        };

        if (isOpen) {
            window.addEventListener('message', handleMessage);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            window.removeEventListener('message', handleMessage);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] bg-[color:var(--color-dark)] bg-opacity-80 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-[color:var(--color-bg)] rounded-lg overflow-hidden"
                style={{ width: '90vw', height: '80vh', maxWidth: '80%', maxHeight: '600px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-[color:var(--color-text)] hover:text-[color:var(--color-text)] bg-[color:var(--color-white)] rounded-full p-2 shadow-lg"
                >
                    <IconX size={24} />
                </button>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--color-white)]">
                        <div className="flex flex-col items-center">
                            <Loading comment="Loading review form..." />
                        </div>
                    </div>
                )}

                <iframe
                    src={`${REVIEW_FORM_BASE_URL}${merchantId}`}
                    className="w-full h-full border-0"
                    title="Add New Review"
                    onLoad={() => setIsLoading(false)}
                    allow="camera; microphone"
                />
            </div>
        </div>
    );
};

export default ReviewFormModal;
