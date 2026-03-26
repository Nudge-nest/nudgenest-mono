import { IconAbc, IconCalendarBolt, IconCalendarTime, IconFileImport, IconMailCode, IconQrcode, IconUserScreen } from '@tabler/icons-react';
import Tabs from '../components/TabComponent';
import { lazy, Suspense, useMemo } from 'react';
import { useReviewConfig } from '../contexts/ReviewConfigContext.tsx';

const ReviewPublishConfigsComponent = lazy(() => import('../components/configs/ReviewPublishConfigsComponent.tsx'));
const ReviewEmailContentComponent = lazy(() => import('../components/configs/ReviewEmailContentComponent.tsx'));
const ReviewEmailReminderComponent = lazy(() => import('../components/configs/ReviewEmailReminderComponent.tsx'));
const ReviewEmailScheduleComponent = lazy(() => import('../components/configs/ReviewEmailScheduleComponent.tsx'));
const ReviewQrCodeComponent = lazy(() => import('../components/configs/ReviewQrCodeComponent.tsx'));
const ReviewGeneralSettingsComponent = lazy(() => import('../components/configs/ReviewGeneralSettingsComponent.tsx'));
const ReviewImportExportComponent = lazy(() => import('../components/configs/ReviewImportExportComponent.tsx'));

const TabFallback = () => <div className="p-6 text-sm text-[color:var(--color-disabled)]">Loading...</div>;

const ReviewConfigsPage = () => {
    const { reviewConfigFormHoook } = useReviewConfig();

    const _Tabs = useMemo(() => {
        return [
            {
                id: 'review',
                label: 'Review Publishing',
                icon: <IconUserScreen />, // optional
                disabled: false, // optional
                content: <Suspense fallback={<TabFallback />}><ReviewPublishConfigsComponent /></Suspense>,
            },
            {
                id: 'email',
                label: 'Email Content',
                icon: <IconMailCode />,
                disabled: false,
                content: <Suspense fallback={<TabFallback />}><ReviewEmailContentComponent /></Suspense>,
            },
            {
                id: 'schedule',
                label: 'Email Schedule',
                icon: <IconCalendarTime />,
                disabled: false,
                content: <Suspense fallback={<TabFallback />}><ReviewEmailScheduleComponent /></Suspense>,
            },
            {
                id: 'reminder',
                label: 'Reminder Settings',
                icon: <IconCalendarBolt />,
                disabled: false,
                content: <Suspense fallback={<TabFallback />}><ReviewEmailReminderComponent /></Suspense>,
            },
            {
                id: 'qr',
                label: 'QR Code',
                icon: <IconQrcode />,
                disabled: false,
                content: <Suspense fallback={<TabFallback />}><ReviewQrCodeComponent /></Suspense>,
            },
            {
                id: 'general',
                label: 'General Settings',
                icon: <IconAbc />,
                disabled: false,
                content: <Suspense fallback={<TabFallback />}><ReviewGeneralSettingsComponent /></Suspense>,
            },
            {
                id: 'import-export',
                label: 'Import / Export',
                icon: <IconFileImport />,
                disabled: false,
                content: <Suspense fallback={<TabFallback />}><ReviewImportExportComponent /></Suspense>,
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
