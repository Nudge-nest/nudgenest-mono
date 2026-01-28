import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ConfigRowComponent from "../../../components/configs/ConfigRowComponent";

describe('ConfigRowComponent', () => {
    const mockOnFieldChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        test('should render text input by default', () => {
            const field = {
                key: 'testField',
                value: 'test value',
                description: 'Test description',
                placeholder: 'Enter text'
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            expect(screen.getByTestId('config-row-testField')).toBeInTheDocument();
            expect(screen.getByTestId('label-testField')).toHaveTextContent('Test Field');
            expect(screen.getByTestId('text-testField')).toHaveValue('test value');
            expect(screen.getByTestId('description-testField')).toHaveTextContent('Test description');
        });

        test('should render textarea when type is textarea', () => {
            const field = {
                key: 'notes',
                value: 'Some notes',
                description: 'Enter notes',
                type: 'textarea' as const
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const textarea = screen.getByTestId('textarea-notes');
            expect(textarea).toBeInTheDocument();
            expect(textarea).toHaveValue('Some notes');
        });

        test('should render number input when type is number', () => {
            const field = {
                key: 'count',
                value: 42,
                description: 'Enter count',
                type: 'number' as const
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const numberInput = screen.getByTestId('number-count');
            expect(numberInput).toBeInTheDocument();
            expect(numberInput).toHaveValue(42);
        });

        test('should render checkbox when type is checkbox', () => {
            const field = {
                key: 'isEnabled',
                value: true,
                description: 'Enable feature',
                type: 'checkbox' as const
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const checkbox = screen.getByTestId('checkbox-isEnabled');
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).toBeChecked();
            expect(screen.getByTestId('checkbox-label-isEnabled')).toHaveTextContent('Enabled');
        });

        test('should render select when type is select with options', () => {
            const field = {
                key: 'theme',
                value: 'dark',
                description: 'Choose theme',
                type: 'select' as const,
                options: [
                    { value: 'light', label: 'Light Theme' },
                    { value: 'dark', label: 'Dark Theme' }
                ]
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const select = screen.getByTestId('select-theme');
            expect(select).toBeInTheDocument();
            expect(select).toHaveValue('dark');
            expect(screen.getByText('Light Theme')).toBeInTheDocument();
            expect(screen.getByText('Dark Theme')).toBeInTheDocument();
        });
    });

    describe('Value Changes', () => {
        test('should call onFieldChange when text input changes', () => {
            const field = {
                key: 'username',
                value: 'initial',
                description: 'Enter username'
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const input = screen.getByTestId('text-username');
            fireEvent.change(input, { target: { value: 'new value' } });

            expect(mockOnFieldChange).toHaveBeenCalledWith('username', 'new value', 'testObj');
        });

        test('should call onFieldChange when checkbox is toggled', () => {
            const field = {
                key: 'isActive',
                value: false,
                description: 'Activate feature',
                type: 'checkbox' as const
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const checkbox = screen.getByTestId('checkbox-isActive');
            fireEvent.click(checkbox);

            expect(mockOnFieldChange).toHaveBeenCalledWith('isActive', true, 'testObj');
        });

        test('should call onFieldChange when select option changes', () => {
            const field = {
                key: 'language',
                value: 'en',
                description: 'Select language',
                type: 'select' as const,
                options: [
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' }
                ]
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const select = screen.getByTestId('select-language');
            fireEvent.change(select, { target: { value: 'es' } });

            expect(mockOnFieldChange).toHaveBeenCalledWith('language', 'es', 'testObj');
        });

        test('should call onFieldChange with number when number input changes', () => {
            const field = {
                key: 'maxItems',
                value: 10,
                description: 'Maximum items',
                type: 'number' as const
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const input = screen.getByTestId('number-maxItems');
            fireEvent.change(input, { target: { value: '25' } });

            expect(mockOnFieldChange).toHaveBeenCalledWith('maxItems', 25, 'testObj');
        });
    });

    describe('Field States', () => {
        test('should show asterisk for required fields', () => {
            const field = {
                key: 'email',
                value: '',
                description: 'Email address',
                type: 'email' as const,
                required: true
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const label = screen.getByTestId('label-email');
            expect(label.textContent).toContain('*');
        });

        test('should disable input when disabled is true', () => {
            const field = {
                key: 'readOnlyField',
                value: 'cannot edit',
                description: 'Read only',
                disabled: true
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            const input = screen.getByTestId('text-readOnlyField');
            expect(input).toBeDisabled();
        });
    });

    describe('Label Formatting', () => {
        test('should format camelCase labels correctly', () => {
            const field = {
                key: 'firstName',
                value: '',
                description: 'First name'
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            expect(screen.getByTestId('label-firstName')).toHaveTextContent('First Name');
        });

        test('should format snake_case labels correctly', () => {
            const field = {
                key: 'user_email',
                value: '',
                description: 'User email'
            };

            render(
                <ConfigRowComponent
                    field={field}
                    onFieldChange={mockOnFieldChange}
                    objPropName="testObj"
                />
            );

            expect(screen.getByTestId('label-user_email')).toHaveTextContent('User email');
        });
    });
});