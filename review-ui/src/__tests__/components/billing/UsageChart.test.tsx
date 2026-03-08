import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';
import { UsageChart } from '../../../components/billing/UsageChart';

describe('UsageChart', () => {
    test('renders usage and limit numbers from props', () => {
        render(
            <UsageChart
                usage={{ REVIEW_REQUEST: 12, EMAIL_SENT: 47 }}
                limits={{ reviewRequestsPerMonth: 100, emailsPerMonth: 500 }}
            />
        );
        expect(screen.getByText(/Reviews: 12 \/ 100/)).toBeInTheDocument();
        expect(screen.getByText(/Emails: 47 \/ 500/)).toBeInTheDocument();
    });

    test('renders 0 when usage is undefined', () => {
        render(
            <UsageChart
                usage={undefined}
                limits={{ reviewRequestsPerMonth: 100, emailsPerMonth: 500 }}
            />
        );
        expect(screen.getByText(/Reviews: 0/)).toBeInTheDocument();
        expect(screen.getByText(/Emails: 0/)).toBeInTheDocument();
    });
});
