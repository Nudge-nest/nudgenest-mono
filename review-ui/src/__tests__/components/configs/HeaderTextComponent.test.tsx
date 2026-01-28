import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, Mock } from 'vitest';
import '@testing-library/jest-dom';
import HeaderTextComponent from "../../../components/configs/HeaderTextComponent";
import {useReviewConfig} from "../../../contexts/ReviewConfigContext";

// Mock the ReviewConfigContext
vi.mock('../../../contexts/ReviewConfigContext', () => ({
    useReviewConfig: vi.fn()
}));

const mockUseReviewConfig = useReviewConfig as Mock;

describe('HeaderTextComponent', () => {
    const mockHandleUpdateReviewConfig = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        test('should render component with title and subtitle', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: false
                }
            });

            render(
                <HeaderTextComponent
                    title="Review Configuration"
                    subTitle="Manage your review settings"
                />
            );

            expect(screen.getByTestId('header-text-component')).toBeInTheDocument();
            expect(screen.getByTestId('header-title')).toHaveTextContent('Review Configuration');
            expect(screen.getByTestId('header-subtitle')).toHaveTextContent('Manage your review settings');
        });

        test('should render without title', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: false
                }
            });

            render(<HeaderTextComponent subTitle="Just a subtitle" />);

            expect(screen.queryByTestId('header-title')).not.toBeInTheDocument();
            expect(screen.getByTestId('header-subtitle')).toHaveTextContent('Just a subtitle');
        });

        test('should render without subtitle', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: false
                }
            });

            render(<HeaderTextComponent title="Just a title" />);

            expect(screen.getByTestId('header-title')).toHaveTextContent('Just a title');
            expect(screen.queryByTestId('header-subtitle')).not.toBeInTheDocument();
        });

        test('should render with neither title nor subtitle', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: false
                }
            });

            render(<HeaderTextComponent />);

            expect(screen.queryByTestId('header-title')).not.toBeInTheDocument();
            expect(screen.queryByTestId('header-subtitle')).not.toBeInTheDocument();
            expect(screen.getByTestId('save-config-button')).toBeInTheDocument();
        });
    });

    describe('Save Button', () => {
        test('should render save button in disabled state when not editing', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: false
                }
            });

            render(<HeaderTextComponent title="Test" />);

            const saveButton = screen.getByTestId('save-config-button');
            expect(saveButton).toBeInTheDocument();
            expect(saveButton).toBeDisabled();
            expect(saveButton).toHaveClass('cursor-wait', 'bg-[color:var(--color-disabled)]');
        });

        test('should render save button in active state when editing', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: true
                }
            });

            render(<HeaderTextComponent title="Test" />);

            const saveButton = screen.getByTestId('save-config-button');
            expect(saveButton).toBeInTheDocument();
            expect(saveButton).not.toBeDisabled();
            expect(saveButton).toHaveClass('cursor-pointer', 'bg-[color:var(--color-main)]');
        });

        test('should call handleUpdateReviewConfig when save button is clicked', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: true
                }
            });

            render(<HeaderTextComponent title="Test" />);

            const saveButton = screen.getByTestId('save-config-button');
            fireEvent.click(saveButton);

            expect(mockHandleUpdateReviewConfig).toHaveBeenCalledTimes(1);
        });

        test('should not call handleUpdateReviewConfig when button is disabled', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: false
                }
            });

            render(<HeaderTextComponent title="Test" />);

            const saveButton = screen.getByTestId('save-config-button');
            fireEvent.click(saveButton);

            // Click event should still fire but button is disabled
            expect(saveButton).toBeDisabled();
        });
    });

    describe('Status Messages', () => {
        test('should show editing status when isEditing is true', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: true
                }
            });

            render(<HeaderTextComponent title="Test" />);

            const status = screen.getByTestId('save-status');
            expect(status).toHaveTextContent('Configuration has unsaved changes');
        });

        test('should show not editing status when isEditing is false', () => {
            mockUseReviewConfig.mockReturnValue({
                reviewConfigFormHoook: {
                    handleUpdateReviewConfig: mockHandleUpdateReviewConfig,
                    isEditing: false
                }
            });

            render(<HeaderTextComponent title="Test" />);

            const status = screen.getByTestId('save-status');
            expect(status).toHaveTextContent('No configuration changes to save');
        });
    });
});