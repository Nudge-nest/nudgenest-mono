import React from "react";

export const UsageChart: React.FC<any> = ({ usage, limits }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Usage Stats</h3>
            <div className="space-y-3">
                <div>
                    <p>Reviews: {usage?.REVIEW_REQUEST || 0} / {limits?.reviewRequestsPerMonth}</p>
                </div>
                <div>
                    <p>Emails: {usage?.EMAIL_SENT || 0} / {limits?.emailsPerMonth}</p>
                </div>
            </div>
        </div>
    );
};
