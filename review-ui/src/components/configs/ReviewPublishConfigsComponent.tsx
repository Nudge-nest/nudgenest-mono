import ConfigRowComponent from './ConfigRowComponent.tsx';
import Loading from '../Loading.tsx';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import HeaderTextComponent from './HeaderTextComponent.tsx';
import ColumnHeaderComponent from './ColumnHeaderComponent.tsx';

const ReviewPublishConfigsComponent = () => {
    const { reviewConfigs, reviewConfigFormHoook } = useReviewConfig();

    return (
        <div>
            <HeaderTextComponent title="Publish Configuration" subTitle="Configure your review publishing defaults" />
            {/* Column Headers */}
            <ColumnHeaderComponent columns={['Setting', 'Value', 'Description']} />
            {/* Configuration Rows */}
            <div className="space-y-3">
                {reviewConfigs?.publish ? (
                    reviewConfigs.publish.map((field) => {
                        const fieldWithOptions = {
                            ...field,
                            options: [
                                { value: 'THREESTARS', label: 'Three stars' },
                                { value: 'FOURSTARS', label: 'Four stars' },
                                { value: 'FIVESTARS', label: 'Five stars' },
                            ],
                        };
                        return (
                            <ConfigRowComponent
                                key={field.key}
                                field={fieldWithOptions}
                                onFieldChange={reviewConfigFormHoook.handleFieldChange}
                                objPropName="publish"
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

export default ReviewPublishConfigsComponent;
