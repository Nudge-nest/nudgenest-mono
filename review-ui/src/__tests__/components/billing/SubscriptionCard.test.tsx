import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionCard } from '../../../components/billing/SubscriptionCard';

const mockSubscriptionDetails = {
    subscription: {
        id: '1',
        merchantId: 'merchant1',
        planId: 'plan1',
        status: 'ACTIVE' as const,
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        Plans: {
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
        },
    },
    usage: {
        REVIEW_REQUEST: 100,
        EMAIL_SENT: 200,
    },
    limits: {
        reviewRequestsPerMonth: 500,
        emailsPerMonth: 500,
        smsPerMonth: 0,
        storageGB: 2,
        apiCallsPerDay: 1000,
        teamMembers: 2,
    },
};

describe('SubscriptionCard', () => {
    it('renders subscription details correctly', () => {
        const onUpgrade = vi.fn();
        const onCancel = vi.fn();

        render(<SubscriptionCard details={mockSubscriptionDetails} onUpgrade={onUpgrade} onCancel={onCancel} />);

        expect(screen.getByText('Starter Plan')).toBeInTheDocument();
        expect(screen.getByText(/\$29\/monthly/i)).toBeInTheDocument();
    });

    it('shows no subscription message when details is null', () => {
        const onUpgrade = vi.fn();
        const onCancel = vi.fn();

        render(<SubscriptionCard details={null} onUpgrade={onUpgrade} onCancel={onCancel} />);

        expect(screen.getByText('No Active Subscription')).toBeInTheDocument();
        expect(screen.getByText('View Plans')).toBeInTheDocument();
    });
});
