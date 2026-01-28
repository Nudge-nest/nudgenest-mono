import React from "react";
import { useGetSubscriptionQuery, useGetPlansQuery } from "../../redux/nudgenest";
import { SubscriptionCard } from "../../components/billing/SubscriptionCard";
import { PlanCard } from "../../components/billing/PlanCard";
import { UsageChart } from "../../components/billing/UsageChart";

export const BillingPage: React.FC = () => {
    const { data: subscription, isLoading: subLoading } = useGetSubscriptionQuery({});
    const { data: plans, isLoading: plansLoading } = useGetPlansQuery({});

    if (subLoading || plansLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Billing & Usage</h1>
            
            <div className="grid gap-6 mb-8">
                <SubscriptionCard 
                    details={subscription} 
                    onUpgrade={() => {}} 
                    onCancel={() => {}} 
                />
            </div>

            <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {plans?.plans?.map((plan: any) => (
                    <PlanCard key={plan.id} plan={plan} onSelect={() => {}} />
                ))}
            </div>
        </div>
    );
};
