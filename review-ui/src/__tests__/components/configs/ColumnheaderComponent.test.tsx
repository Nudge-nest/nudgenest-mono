import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';
import ColumnHeaderComponent from "../../../components/configs/ColumnHeaderComponent";

describe('ColumnHeaderComponent', () => {
    describe('Rendering', () => {
        test('should render the component', () => {
            const columns = ['Name', 'Email', 'Status'];
            render(<ColumnHeaderComponent columns={columns} />);

            expect(screen.getByTestId('column-header')).toBeInTheDocument();
        });

        test('should render all column headers', () => {
            const columns = ['Name', 'Email', 'Status'];
            render(<ColumnHeaderComponent columns={columns} />);

            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Email')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
        });

        test('should render correct number of columns', () => {
            const columns = ['Product', 'Price', 'Quantity'];
            render(<ColumnHeaderComponent columns={columns} />);

            expect(screen.getByTestId('column-0')).toBeInTheDocument();
            expect(screen.getByTestId('column-1')).toBeInTheDocument();
            expect(screen.getByTestId('column-2')).toBeInTheDocument();
        });
    });

    describe('Different Column Counts', () => {
        test('should handle single column', () => {
            const columns = ['Title'];
            render(<ColumnHeaderComponent columns={columns} />);

            expect(screen.getByText('Title')).toBeInTheDocument();
            expect(screen.getByTestId('column-0')).toBeInTheDocument();
        });

        test('should handle multiple columns', () => {
            const columns = ['ID', 'Name', 'Date', 'Amount', 'Status'];
            render(<ColumnHeaderComponent columns={columns} />);

            expect(screen.getByTestId('column-0')).toHaveTextContent('ID');
            expect(screen.getByTestId('column-1')).toHaveTextContent('Name');
            expect(screen.getByTestId('column-2')).toHaveTextContent('Date');
            expect(screen.getByTestId('column-3')).toHaveTextContent('Amount');
            expect(screen.getByTestId('column-4')).toHaveTextContent('Status');
        });

        test('should handle empty columns array', () => {
            render(<ColumnHeaderComponent columns={[]} />);

            const header = screen.getByTestId('column-header');
            expect(header).toBeInTheDocument();
            expect(header.children).toHaveLength(0);
        });
    });

    describe('Styling', () => {
        test('should apply correct CSS classes', () => {
            const columns = ['Column 1', 'Column 2', 'Column 3'];
            render(<ColumnHeaderComponent columns={columns} />);

            const header = screen.getByTestId('column-header');
            expect(header).toHaveClass('grid', 'grid-cols-3', 'gap-6', 'py-3', 'px-6', 'mb-4');

            const firstColumn = screen.getByTestId('column-0');
            expect(firstColumn).toHaveClass('text-sm', 'font-semibold', 'uppercase', 'tracking-wide');
        });
    });
});