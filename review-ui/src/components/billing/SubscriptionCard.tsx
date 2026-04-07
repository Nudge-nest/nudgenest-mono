import React from 'react';
import { SubscriptionDetails } from '../../types/billing';

interface SubscriptionCardProps {
    details: SubscriptionDetails | null;
    onUpgrade: () => void;
    onCancel: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ details, onUpgrade, onCancel }) => {
    if (!details) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">No Active Subscription</h2>
                <p className="text-gray-600 mb-4">Subscribe to a plan to start using Nudge Nest</p>
                <button
                    onClick={onUpgrade}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    View Plans
                </button>
            </div>
        );
    }

    const { subscription, usage, limits } = details;
    const plan = subscription.Plans;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getUsagePercentage = (used: number, limit: number) => {
        if (limit === -1) return 0;
        return Math.min((used / limit) * 100, 100);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'TRIALING':
                return 'bg-blue-100 text-blue-800';
            case 'PAST_DUE':
                return 'bg-red-100 text-red-800';
            case 'CANCELED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold">{plan.displayName} Plan</h2>
                    <p className="text-gray-600">${plan.price}/{plan.billingInterval.toLowerCase()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                </span>
            </div>

            <div className="border-t border-b py-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Current Period</p>
                        <p className="font-medium">
                            {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                        </p>
                    </div>
                    {subscription.trialEnd && (
                        <div>
                            <p className="text-sm text-gray-600">Trial Ends</p>
                            <p className="font-medium">{formatDate(subscription.trialEnd)}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold mb-3">Usage This Period</h3>
                <div className="space-y-3">
                    {limits.reviewRequestsPerMonth !== -1 && (
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Review Requests</span>
                                <span>
                                    {usage.REVIEW_REQUEST || 0} / {limits.reviewRequestsPerMonth}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                        width: `${getUsagePercentage(usage.REVIEW_REQUEST || 0, limits.reviewRequestsPerMonth)}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {limits.emailsPerMonth !== -1 && (
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Emails Sent</span>
                                <span>
                                    {usage.EMAIL_SENT || 0} / {limits.emailsPerMonth}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{
                                        width: `${getUsagePercentage(usage.EMAIL_SENT || 0, limits.emailsPerMonth)}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {limits.smsPerMonth !== -1 && limits.smsPerMonth > 0 && (
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>SMS Sent</span>
                                <span>
                                    {usage.SMS_SENT || 0} / {limits.smsPerMonth}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{
                                        width: `${getUsagePercentage(usage.SMS_SENT || 0, limits.smsPerMonth)}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onUpgrade}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Upgrade Plan
                </button>
                {subscription.status !== 'CANCELED' && (
                    <button
                        onClick={onCancel}
                        className="flex-1 border border-red-600 text-red-600 px-4 py-2 rounded hover:bg-red-50"
                    >
                        Cancel Subscription
                    </button>
                )}
            </div>

            {subscription.cancelAt && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                        Your subscription will be canceled on {formatDate(subscription.cancelAt)}
                    </p>
                </div>
            )}
        </div>
    );
};
