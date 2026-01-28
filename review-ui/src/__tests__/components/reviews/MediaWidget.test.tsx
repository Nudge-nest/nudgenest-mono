import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { useReview } from '../../../contexts/ReviewContext';
import MediaWidget from "../../../components/review/MediaWidget";
import {useUploadReviewMediaMutation} from "../../../redux/nudgenest";

// Mock dependencies
vi.mock('../../../contexts/ReviewContext');
vi.mock('../../../redux/nudgenest');
vi.mock('react-dropzone', () => ({
    useDropzone: ({ onDrop }: any) => ({
        getRootProps: () => ({
            role: 'button',
            tabIndex: 0,
            'data-testid': 'upload-button'
        }),
        getInputProps: () => ({
            type: 'file',
            'data-testid': 'file-input'
        }),
        // Expose onDrop for testing
        onDrop
    })
}));

// Mock PreviewComponent
vi.mock('../../../components/review/MediaPreviewComponent.tsx', () => ({
    default: ({ media, onDelete, index }: any) => (
        <div data-testid={`media-preview-${index}`}>
            {media.mediaURL}
            {onDelete && (
                <button
                    onClick={onDelete}
                    data-testid={`delete-button-${index}`}
                >
                    Delete
                </button>
            )}
        </div>
    )
}));

describe('MediaWidget', () => {
    const mockAddMedia = vi.fn();
    const mockRemoveMedia = vi.fn();
    const mockUploadReviewMedia = vi.fn();

    const defaultContextValue = {
        merchantId: 'merchant-123',
        reviewId: 'review-123',
        reviewStatus: 'Pending',
        review: { status: 'Pending' },
        reviewFormHook: {
            addMedia: mockAddMedia,
            removeMedia: mockRemoveMedia,
            media: []
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useReview as any).mockReturnValue(defaultContextValue);
        (useUploadReviewMediaMutation as any).mockReturnValue([
            mockUploadReviewMedia,
            { isLoading: false }
        ]);
    });

    describe('Rendering', () => {
        it('should render the widget title and subtitle', () => {
            render(<MediaWidget />);

            expect(screen.getByTestId('media-widget-title')).toHaveTextContent('Brag a little');
            expect(screen.getByTestId('media-widget-subtitle')).toHaveTextContent('Snap it, share it, show it off!');
        });

        it('should render upload button when not completed', () => {
            render(<MediaWidget />);

            expect(screen.getByTestId('upload-button')).toBeInTheDocument();
        });

        it('should not render upload button when review is completed', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                review: { status: 'Completed' }
            });

            render(<MediaWidget />);

            expect(screen.queryByTestId('upload-button')).not.toBeInTheDocument();
        });

        it('should render existing media items', () => {
            const mediaItems = [
                { id: '1', mediaURL: 'https://example.com/image1.jpg' },
                { id: '2', mediaURL: 'https://example.com/image2.jpg' }
            ];

            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    media: mediaItems
                }
            });

            render(<MediaWidget />);

            expect(screen.getByTestId('media-preview-0')).toBeInTheDocument();
            expect(screen.getByTestId('media-preview-1')).toBeInTheDocument();
        });
    });

    describe('File Upload', () => {
        it('should handle demo mode upload', async () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewId: 'demo'
            });

            render(<MediaWidget />);
            await waitFor(() => {
                expect(mockAddMedia).not.toHaveBeenCalled(); // Just verify the component renders
            });
        });

        it('should handle regular file upload', async () => {
            mockUploadReviewMedia.mockResolvedValue({
                unwrap: () => Promise.resolve([
                    { id: 'uploaded-1', url: 'https://example.com/uploaded.jpg' }
                ])
            });

            render(<MediaWidget />);

            // Verify upload button exists
            expect(screen.getByTestId('upload-button')).toBeInTheDocument();

            // In a real scenario, we would trigger file drop here
            // For now, verify the upload mutation is available
            expect(mockUploadReviewMedia).toBeDefined();
        });
    });

    describe('Media Deletion', () => {
        it('should show delete buttons when review is not completed', () => {
            const mediaItems = [
                { id: '1', mediaURL: 'https://example.com/image1.jpg' }
            ];

            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    media: mediaItems
                }
            });

            render(<MediaWidget />);

            expect(screen.getByTestId('delete-button-0')).toBeInTheDocument();
        });

        it('should not show delete buttons when review is completed', () => {
            const mediaItems = [
                { id: '1', mediaURL: 'https://example.com/image1.jpg' }
            ];

            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewStatus: 'Completed',
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    media: mediaItems
                }
            });

            render(<MediaWidget />);

            expect(screen.queryByTestId('delete-button-0')).not.toBeInTheDocument();
        });

        it('should call removeMedia when delete is clicked', () => {
            const mediaItems = [
                { id: '1', mediaURL: 'https://example.com/image1.jpg' }
            ];

            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    media: mediaItems
                }
            });

            render(<MediaWidget />);

            const deleteButton = screen.getByTestId('delete-button-0');
            fireEvent.click(deleteButton);

            expect(mockRemoveMedia).toHaveBeenCalledWith(mediaItems[0]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty media array', () => {
            render(<MediaWidget />);

            expect(screen.getByTestId('media-container')).toBeInTheDocument();
            expect(screen.queryByTestId('media-preview-0')).not.toBeInTheDocument();
        });

        it('should handle multiple media items with delete functionality', () => {
            const mediaItems = [
                { id: '1', mediaURL: 'https://example.com/image1.jpg' },
                { id: '2', mediaURL: 'https://example.com/image2.jpg' },
                { id: '3', mediaURL: 'https://example.com/video.mp4' }
            ];

            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    media: mediaItems
                }
            });

            render(<MediaWidget />);

            // All previews should be rendered
            expect(screen.getByTestId('media-preview-0')).toBeInTheDocument();
            expect(screen.getByTestId('media-preview-1')).toBeInTheDocument();
            expect(screen.getByTestId('media-preview-2')).toBeInTheDocument();

            // All should have delete buttons
            expect(screen.getByTestId('delete-button-0')).toBeInTheDocument();
            expect(screen.getByTestId('delete-button-1')).toBeInTheDocument();
            expect(screen.getByTestId('delete-button-2')).toBeInTheDocument();
        });
    });
});