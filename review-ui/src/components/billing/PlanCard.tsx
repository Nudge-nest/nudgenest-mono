import React from "react";
import { Plan } from "../../types/billing";

export const PlanCard: React.FC<any> = ({ plan, onSelect }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold">{plan.displayName}</h3>
            <p className="text-2xl">${plan.price}/mo</p>
            <button onClick={() => onSelect(plan.id)} className="bg-blue-600 text-white px-4 py-2 rounded">
                Select
            </button>
        </div>
    );
};
