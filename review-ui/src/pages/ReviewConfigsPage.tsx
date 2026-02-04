import { IconAbc, IconCalendarBolt, IconMailCode, IconQrcode, IconUserScreen } from '@tabler/icons-react';
import Tabs from '../components/TabComponent';
import { useMemo } from 'react';
import { useReviewConfig } from '../contexts/ReviewConfigContext.tsx';
import ReviewPublishConfigsComponent from '../components/configs/ReviewPublishConfigsComponent.tsx';
import ReviewEmailContentComponent from '../components/configs/ReviewEmailContentComponent.tsx';
import ReviewEmailReminderComponent from '../components/configs/ReviewEmailReminderComponent.tsx';
import ReviewQrCodeComponent from '../components/configs/ReviewQrCodeComponent.tsx';
import ReviewGeneralSettingsComponent from '../components/configs/ReviewGeneralSettingsComponent.tsx';

const ReviewConfigsPage = () => {
    const { reviewConfigFormHoook } = useReviewConfig();

    const _Tabs = useMemo(() => {
        return [
            {
                id: 'review',
                label: 'Review Publishing',
                icon: <IconUserScreen />, // optional
                disabled: false, // optional
                content: <ReviewPublishConfigsComponent />,
            },
            {
                id: 'email',
                label: 'Email Content',
                icon: <IconMailCode />, // optional
                disabled: false, // optional
                content: <ReviewEmailContentComponent />,
            },
            {
                id: 'reminder',
                label: 'Reminder Settings',
                icon: <IconCalendarBolt />, // optional
                disabled: false, // optional
                content: <ReviewEmailReminderComponent />,
            },
            {
                id: 'qr',
                label: 'QR Code',
                icon: <IconQrcode />, // optional
                disabled: false, // optional
                content: <ReviewQrCodeComponent />,
            },
            {
                id: 'general',
                label: 'General Settings',
                icon: <IconAbc />, // optional
                disabled: false, // optional
                content: <ReviewGeneralSettingsComponent />,
            },
        ];
    }, [reviewConfigFormHoook.reviewConfigs]);

    return (
        <div className="w-full max-w-7xl mx-auto">
            <Tabs
                tabs={_Tabs}
                variant="minimal"
                size="sm"
                onTabChange={() => {}}
                defaultTab="review"
            />
        </div>
    );
};

export default ReviewConfigsPage;
