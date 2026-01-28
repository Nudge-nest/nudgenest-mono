import ConfigRowComponent from './ConfigRowComponent.tsx';
import Loading from '../Loading.tsx';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import HeaderTextComponent from './HeaderTextComponent.tsx';
import ColumnHeaderComponent from './ColumnHeaderComponent.tsx';

const ReviewEmailContentComponent = () => {
    const { reviewConfigs, reviewConfigFormHoook } = useReviewConfig();

    return (
        <div>
            <HeaderTextComponent title="Email Content" subTitle="Configure the content of your emails" />
            {/* Column Headers */}
            <ColumnHeaderComponent columns={['Setting', 'Value', 'Description']} />
            {/* Configuration Rows */}
            <div className="space-y-3">
                {reviewConfigs?.emailContent ? (
                    reviewConfigs.emailContent.map((field) => {
                        return (
                            <ConfigRowComponent
                                key={field.key}
                                field={field}
                                onFieldChange={reviewConfigFormHoook.handleFieldChange}
                                objPropName="emailContent"
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

export default ReviewEmailContentComponent;
