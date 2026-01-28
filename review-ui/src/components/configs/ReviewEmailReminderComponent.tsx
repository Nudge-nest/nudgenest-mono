import ConfigRowComponent from './ConfigRowComponent.tsx';
import Loading from '../Loading.tsx';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import HeaderTextComponent from './HeaderTextComponent.tsx';
import ColumnHeaderComponent from './ColumnHeaderComponent.tsx';

const ReviewEmailReminderComponent = () => {
    const { reviewConfigs, reviewConfigFormHoook } = useReviewConfig();

    return (
        <div>
            <HeaderTextComponent title="Email Reminders" subTitle="Configure reminders to send to your customers" />
            {/* Column Headers */}
            <ColumnHeaderComponent columns={['Setting', 'Value', 'Description']} />
            {/* Configuration Rows */}
            <div className="space-y-3">
                {reviewConfigs?.remindersFrequency ? (
                    reviewConfigs.remindersFrequency.map((field) => {
                        let fieldWithOptions;
                        if (field.key === 'remindersPeriod') {
                            fieldWithOptions = {
                                ...field,
                                options: [
                                    { value: 'BIWEEKLY', label: 'Two times in a week' },
                                    { value: 'WEEKLY', label: 'Once every week' },
                                    { value: 'BIMONTHLY', label: 'Twice in a month' },
                                    { value: 'MONTHLY', label: 'Once every month' },
                                ],
                            };
                        } else {
                            fieldWithOptions = { ...field };
                        }
                        return (
                            <ConfigRowComponent
                                key={field.key}
                                field={fieldWithOptions}
                                onFieldChange={reviewConfigFormHoook.handleFieldChange}
                                objPropName="remindersFrequency"
                            />
                        );
                    })
                ) : (
                    <Loading />
                )}
            </div>
            <div className="space-y-3">
                {reviewConfigs?.reminderEmailContent ? (
                    reviewConfigs.reminderEmailContent.map((field) => {
                        return (
                            <ConfigRowComponent
                                key={field.key}
                                field={field}
                                onFieldChange={reviewConfigFormHoook.handleFieldChange}
                                objPropName="reminderEmailContent"
                            />
                        );
                    })
                ) : (
                    <Loading />
                )}
            </div>
        </div>
    );
};

export default ReviewEmailReminderComponent;
