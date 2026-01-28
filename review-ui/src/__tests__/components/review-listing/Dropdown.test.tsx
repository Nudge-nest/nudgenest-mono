import { fireEvent, render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';
import Dropdown from '../../../components/reviews-list/Dropdown';
import { IconCaretDown } from '@tabler/icons-react';

const TestDropdown = ({ position, width }: { position?: 'left' | 'right'; width?: string }) => {
    return (
        <Dropdown position={position} width={width} trigger={
            <button data-testid="test-button">
                <IconCaretDown size={24} data-testid="test-caret" />
            </button>
        }>
            Hello Test dropdown
        </Dropdown>
    );
};

describe('Dropdown', () => {
    describe('Initial State', () => {
        test('should render trigger but not content initially', () => {
            render(<TestDropdown />);

            expect(screen.getByTestId('dropdown-wrapper')).toBeInTheDocument();
            expect(screen.getByTestId('test-button')).toBeInTheDocument();
            expect(screen.queryByTestId('dropdown-container')).not.toBeInTheDocument();
        });
    });

    describe('Toggle Behavior', () => {
        test('should open dropdown when trigger is clicked', () => {
            render(<TestDropdown />);

            fireEvent.click(screen.getByTestId('test-button'));

            expect(screen.getByTestId('dropdown-container')).toBeInTheDocument();
            expect(screen.getByText('Hello Test dropdown')).toBeInTheDocument();
        });

        test('should close dropdown when trigger is clicked again', () => {
            render(<TestDropdown />);

            const trigger = screen.getByTestId('test-button');

            // Open
            fireEvent.click(trigger);
            expect(screen.getByTestId('dropdown-container')).toBeInTheDocument();

            // Close
            fireEvent.click(trigger);
            expect(screen.queryByTestId('dropdown-container')).not.toBeInTheDocument();
        });

        test('should close dropdown when clicking outside', () => {
            render(
                <div>
                    <TestDropdown />
                    <button data-testid="outside-button">Outside</button>
                </div>
            );

            // Open dropdown
            fireEvent.click(screen.getByTestId('test-button'));
            expect(screen.getByTestId('dropdown-container')).toBeInTheDocument();

            // Click outside
            fireEvent.click(screen.getByTestId('outside-button'));
            expect(screen.queryByTestId('dropdown-container')).not.toBeInTheDocument();
        });

        test('should not close when clicking inside dropdown content', () => {
            render(<TestDropdown />);

            fireEvent.click(screen.getByTestId('test-button'));
            const dropdownContent = screen.getByText('Hello Test dropdown');

            fireEvent.click(dropdownContent);

            expect(screen.getByTestId('dropdown-container')).toBeInTheDocument();
        });
    });

    describe('Position Prop', () => {
        test('should position dropdown on the left by default', () => {
            render(<TestDropdown />);

            fireEvent.click(screen.getByTestId('test-button'));
            const dropdown = screen.getByTestId('dropdown-container');

            expect(dropdown.className).toContain('left-0');
            expect(dropdown.className).not.toContain('right-0');
        });

        test('should position dropdown on the right when specified', () => {
            render(<TestDropdown position="right" />);

            fireEvent.click(screen.getByTestId('test-button'));
            const dropdown = screen.getByTestId('dropdown-container');

            expect(dropdown.className).toContain('right-0');
            expect(dropdown.className).not.toContain('left-0');
        });
    });

    describe('Width Prop', () => {
        test('should apply default width of 200px', () => {
            render(<TestDropdown />);

            fireEvent.click(screen.getByTestId('test-button'));
            const dropdown = screen.getByTestId('dropdown-container');

            expect(dropdown).toHaveStyle({ width: '200px' });
        });

        test('should apply custom width when provided', () => {
            render(<TestDropdown width="300px" />);

            fireEvent.click(screen.getByTestId('test-button'));
            const dropdown = screen.getByTestId('dropdown-container');

            expect(dropdown).toHaveStyle({ width: '300px' });
        });
    });

    describe('Keyboard Accessibility', () => {
        test('should close dropdown when Escape key is pressed', () => {
            render(<TestDropdown />);

            fireEvent.click(screen.getByTestId('test-button'));
            expect(screen.getByTestId('dropdown-container')).toBeInTheDocument();

            fireEvent.keyDown(document, { key: 'Escape' });
            expect(screen.queryByTestId('dropdown-container')).not.toBeInTheDocument();
        });

        test('should toggle dropdown with Enter key on trigger', () => {
            render(<TestDropdown />);

            const trigger = screen.getByTestId('dropdown-trigger-wrapper');

            // Open with Enter
            fireEvent.keyDown(trigger, { key: 'Enter' });
            expect(screen.getByTestId('dropdown-container')).toBeInTheDocument();

            // Close with Enter
            fireEvent.keyDown(trigger, { key: 'Enter' });
            expect(screen.queryByTestId('dropdown-container')).not.toBeInTheDocument();
        });

        test('should toggle dropdown with Space key on trigger', () => {
            render(<TestDropdown />);

            const trigger = screen.getByTestId('dropdown-trigger-wrapper');

            fireEvent.keyDown(trigger, { key: ' ' });
            expect(screen.getByTestId('dropdown-container')).toBeInTheDocument();
        });
    });

});