import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import ReviewPublishConfigsComponent from '../../../components/configs/ReviewPublishConfigsComponent';

const mockHandleFieldChange = vi.fn();

vi.mock('../../../contexts/ReviewConfigContext', () => ({
    useReviewConfig: () => ({
        reviewConfigs: {
            publish: [
                { key: 'autoPublish', value: 'true', type: 'checkbox', description: 'Auto-publish' },
                { key: 'minRatingToPublish', value: 'FOURSTARS', type: 'select', description: 'Min rating' },
            ],
        },
        reviewConfigFormHoook: { handleFieldChange: mockHandleFieldChange },
    }),
}));
vi.mock('../../../components/configs/ConfigRowComponent', () => ({
    default: ({ field, objPropName }: any) => (
        <div data-testid={`config-row-${field.key}`} data-obj={objPropName}>
            {field.options?.map((o: any) => (
                <span key={o.value} data-testid={`option-${o.value}`}>{o.label}</span>
            ))}
        </div>
    ),
}));
vi.mock('../../../components/configs/HeaderTextComponent', () => ({ default: () => <div /> }));
vi.mock('../../../components/configs/ColumnHeaderComponent', () => ({ default: () => <div /> }));

describe('ReviewPublishConfigsComponent', () => {
    test('renders one row per publish config field', () => {
        render(<ReviewPublishConfigsComponent />);
        expect(screen.getByTestId('config-row-autoPublish')).toBeInTheDocument();
        expect(screen.getByTestId('config-row-minRatingToPublish')).toBeInTheDocument();
    });

    test('passes THREESTARS/FOURSTARS/FIVESTARS options and objPropName="publish" to each row', () => {
        render(<ReviewPublishConfigsComponent />);
        // Options are enriched by the component (not in the raw config)
        expect(screen.getAllByTestId('option-THREESTARS')).toHaveLength(2);
        expect(screen.getAllByTestId('option-FOURSTARS')).toHaveLength(2);
        expect(screen.getAllByTestId('option-FIVESTARS')).toHaveLength(2);
        // Both rows carry objPropName="publish"
        expect(screen.getByTestId('config-row-autoPublish')).toHaveAttribute('data-obj', 'publish');
    });
});
