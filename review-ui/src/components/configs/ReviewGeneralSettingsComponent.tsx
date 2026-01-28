import ConfigRowComponent from './ConfigRowComponent.tsx';
import Loading from '../Loading.tsx';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import HeaderTextComponent from './HeaderTextComponent.tsx';
import ColumnHeaderComponent from './ColumnHeaderComponent.tsx';
import { IConfigField } from '../../types/reviewConfigs.ts';

const ReviewGeneralSettingsComponent = () => {
    const { reviewConfigs, reviewConfigFormHoook } = useReviewConfig();
    const shopReviewQuestions: any = reviewConfigs ? reviewConfigs?.general.shopReviewQuestions : [];

    return (
        <div>
            <HeaderTextComponent title="General Settings" subTitle="Configure other types of customization" />
            {/* Column Headers */}
            <ColumnHeaderComponent columns={['Setting', 'Value', 'Description']} />
            {/* Configuration Rows */}
            <div className="space-y-3">
                {reviewConfigs?.general ? (
                    shopReviewQuestions.map((field: IConfigField) => {
                        return (
                            <ConfigRowComponent
                                key={field.key}
                                field={field}
                                onFieldChange={reviewConfigFormHoook.handleFieldChange}
                                objPropName="general"
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

export default ReviewGeneralSettingsComponent;
