import ConfigRowComponent from './ConfigRowComponent.tsx';
import Loading from '../Loading.tsx';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import HeaderTextComponent from './HeaderTextComponent.tsx';
import ColumnHeaderComponent from './ColumnHeaderComponent.tsx';

const ReviewEmailScheduleComponent = () => {
    const { reviewConfigs, reviewConfigFormHoook } = useReviewConfig();

    return (
        <div>
            <HeaderTextComponent
                title="Email Schedule"
                subTitle="Configure when the initial review request email is sent to your customers after an order"
            />
            {/* Column Headers */}
            <ColumnHeaderComponent columns={['Setting', 'Value', 'Description']} />
            {/* Configuration Rows */}
            <div className="space-y-3">
                {reviewConfigs?.emailSchedule ? (
                    reviewConfigs.emailSchedule.map((field) => (
                        <ConfigRowComponent
                            key={field.key}
                            field={field}
                            onFieldChange={reviewConfigFormHoook.handleFieldChange}
                            objPropName="emailSchedule"
                        />
                    ))
                ) : (
                    <Loading />
                )}
            </div>
        </div>
    );
};

export default ReviewEmailScheduleComponent;
