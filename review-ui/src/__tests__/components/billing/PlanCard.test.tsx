import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanCard } from '../../../components/billing/PlanCard';

const mockPlan = {
    id: 'plan1',
    name: 'starter',
    displayName: 'Starter',
    description: 'For growing businesses',
    tier: 'STARTER' as const,
    price: 29,
    billingInterval: 'MONTHLY' as const,
    features: {
        emailReviewRequests: true,
        smsReviewRequests: false,
        autoReminders: true,
        customEmailTemplates: false,
        reviewIncentives: false,
        bulkImport: false,
        advancedAnalytics: false,
        apiAccess: false,
        whiteLabel: false,
        prioritySupport: false,
        dedicatedAccountManager: false,
    },
    limits: {
        reviewRequestsPerMonth: 500,
        emailsPerMonth: 500,
        smsPerMonth: 0,
        storageGB: 2,
        apiCallsPerDay: 1000,
        teamMembers: 2,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('PlanCard', () => {
    it('renders plan details correctly', () => {
        const onSelect = vi.fn();

        render(<PlanCard plan={mockPlan} onSelect={onSelect} />);

        expect(screen.getByText('Starter')).toBeInTheDocument();
        expect(screen.getByText('$29', { exact: false })).toBeInTheDocument();
    });

    it('calls onSelect when button is clicked', () => {
        const onSelect = vi.fn();

        render(<PlanCard plan={mockPlan} onSelect={onSelect} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(onSelect).toHaveBeenCalledWith(mockPlan.id);
    });
});
