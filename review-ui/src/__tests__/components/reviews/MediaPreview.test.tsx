import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreviewComponent from "../../../components/review/MediaPreviewComponent";
import { vi, beforeEach } from 'vitest';


// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = vi.fn();

describe('PreviewComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        test('should render nothing when media is null', () => {
            const { container } = render(<PreviewComponent media={null as any} />);
            expect(container.firstChild).toBeNull();
        });

        test('should render image for image URLs', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} index={0} />);

            const image = screen.getByTestId('image-preview-0');
            expect(image).toBeInTheDocument();
            expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
            expect(image).toHaveAttribute('alt', 'Uploaded image 1');
        });

        test('should render video for video URLs', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/video.mp4'
            };

            render(<PreviewComponent media={media} index={0} />);

            const video = screen.getByTestId('video-preview-0');
            expect(video).toBeInTheDocument();
            expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
        });

        test('should detect various video formats', () => {
            const videoFormats = ['.mp4', '.mov', '.webm', '.ogg', '.avi', '.mkv'];

            videoFormats.forEach((format, index) => {
                const media = {
                    id: `video-${index}`,
                    mediaURL: `https://example.com/video${format}`
                };

                const { container } = render(<PreviewComponent media={media} index={index} />);
                const video = container.querySelector('video');
                expect(video).toBeInTheDocument();
            });
        });
    });

    describe('Delete Functionaltesty', () => {
        test('should render delete button when onDelete is provided', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };
            const onDelete = vi.fn();

            render(<PreviewComponent media={media} onDelete={onDelete} index={0} />);

            expect(screen.getByTestId('delete-button-0')).toBeInTheDocument();
        });

        test('should not render delete button when onDelete is not provided', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} index={0} />);

            expect(screen.queryByTestId('delete-button-0')).not.toBeInTheDocument();
        });

        test('should call onDelete when delete button is clicked', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };
            const onDelete = vi.fn();

            render(<PreviewComponent media={media} onDelete={onDelete} index={0} />);

            const deleteButton = screen.getByTestId('delete-button-0');
            fireEvent.click(deleteButton);

            expect(onDelete).toHaveBeenCalledTimes(1);
        });
    });

    describe('Image Handling', () => {
        test('should revoke blob URLs on image load', () => {
            const media = {
                id: '1',
                mediaURL: 'blob:https://example.com/12345'
            };

            render(<PreviewComponent media={media} index={0} />);

            const image = screen.getByTestId('image-preview-0');
            fireEvent.load(image);

            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:https://example.com/12345');
        });

        test('should not revoke regular URLs on image load', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} index={0} />);

            const image = screen.getByTestId('image-preview-0');
            fireEvent.load(image);

            expect(URL.revokeObjectURL).not.toHaveBeenCalled();
        });

        test('should have lazy loading attribute on images', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} index={0} />);

            const image = screen.getByTestId('image-preview-0');
            expect(image).toHaveAttribute('loading', 'lazy');
        });
    });

    describe('Video Handling', () => {
        test.skip('should have correct video attributes', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/video.mp4'
            };

            render(<PreviewComponent media={media} index={0} />);
            console.log('Video ', screen.getByTestId('video-preview-0'))
            const video = screen.getByTestId('video-preview-0');
            expect(video).toHaveAttribute('muted');
            expect(video).toHaveAttribute('playsInline');
            expect(video).not.toHaveAttribute('controls');
        });

        test('should handle uppercase video extensions', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/VIDEO.MP4'
            };

            render(<PreviewComponent media={media} index={0} />);

            expect(screen.getByTestId('video-preview-0')).toBeInTheDocument();
        });
    });

    describe('Index Prop', () => {
        test('should use default index of 0 when not provided', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} />);

            expect(screen.getByTestId('media-preview-0')).toBeInTheDocument();
            expect(screen.getByTestId('image-preview-0')).toBeInTheDocument();
        });

        test('should use provided index', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} index={5} />);

            expect(screen.getByTestId('media-preview-5')).toBeInTheDocument();
            expect(screen.getByTestId('image-preview-5')).toBeInTheDocument();
        });
    });

    describe('Accessibiltesty', () => {
        test('should have proper aria-label for image preview', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} index={2} />);

            const preview = screen.getByTestId('media-preview-2');
            expect(preview).toHaveAttribute('aria-label', 'image preview 3');
        });

        test('should have proper aria-label for video preview', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/video.mp4'
            };

            render(<PreviewComponent media={media} index={1} />);

            const preview = screen.getByTestId('media-preview-1');
            expect(preview).toHaveAttribute('aria-label', 'video preview 2');
        });

        test('should have proper aria-label for delete button', () => {
            const media = {
                id: '1',
                mediaURL: 'https://example.com/image.jpg'
            };

            render(<PreviewComponent media={media} onDelete={() => {}} index={0} />);

            const deleteButton = screen.getByTestId('delete-button-0');
            expect(deleteButton).toHaveAttribute('aria-label', 'Remove image 1');
        });
    });
});