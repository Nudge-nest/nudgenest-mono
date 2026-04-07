import { FC } from 'react';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';

interface IHeaderTextComponentProps {
    title?: string;
    subTitle?: string;
    hideSaveButton?: boolean;
}

const disabledStyle = `px-6 py-3 cursor-wait bg-[color:var(--color-disabled)] hover:bg-[color:var(--color-disabled)]
                    text-[color:var(--color-white)] font-medium rounded-lg transition-colors focus:outline-none focus:none`;
const activeStyle = `px-6 py-3 cursor-pointer bg-[color:var(--color-main)] hover:bg-[color:var(--color-main)]
                    text-[color:var(--color-white)] font-medium rounded-lg transition-colors focus:outline-none focus:none`;

export const HeaderTextComponent: FC<IHeaderTextComponentProps> = ({ title, subTitle, hideSaveButton = false }) => {
    const { reviewConfigFormHoook } = useReviewConfig();

    return (
        <section
            className="w-full"
            aria-labelledby={title ? "header-title" : undefined}
            data-testid="header-text-component"
        >
            <header>
                {title && (
                    <h3
                        id="header-title"
                        className="font-bold pb-2 text-2xl text-[color:var(--color-text)]"
                        data-testid="header-title"
                    >
                        {title}
                    </h3>
                )}
                {subTitle && (
                    <p
                        className="font-normal pb-2 text-base text-[color:var(--color-text)]"
                        data-testid="header-subtitle"
                    >
                        {subTitle}
                    </p>
                )}
            </header>

            {/* Save Button + feedback */}
            {!hideSaveButton && <div className="mt-8 flex flex-col items-end gap-2">
                <button
                    onClick={reviewConfigFormHoook.handleUpdateReviewConfig}
                    className={reviewConfigFormHoook.isEditing && !reviewConfigFormHoook.isSubmitting ? activeStyle : disabledStyle}
                    disabled={!reviewConfigFormHoook.isEditing || !!reviewConfigFormHoook.isSubmitting}
                    aria-label={reviewConfigFormHoook.isEditing ? "Save configuration changes" : "Save configuration (disabled - no changes)"}
                    data-testid="save-config-button"
                    type="button"
                >
                    {reviewConfigFormHoook.isSubmitting ? 'Saving…' : 'Save Configuration'}
                </button>

                {reviewConfigFormHoook.saveSuccess && (
                    <p
                        className="text-sm text-green-600 font-medium"
                        role="status"
                        aria-live="polite"
                        data-testid="save-success-message"
                    >
                        ✓ Configuration saved successfully
                    </p>
                )}

                {reviewConfigFormHoook.error && (
                    <p
                        className="text-sm text-red-500 font-medium"
                        role="alert"
                        data-testid="save-error-message"
                    >
                        {reviewConfigFormHoook.error}
                    </p>
                )}
            </div>}

            {/* Screen reader announcement for save state */}
            <div
                className="sr-only"
                role="status"
                aria-live="polite"
                data-testid="save-status"
            >
                {reviewConfigFormHoook.isEditing
                    ? "Configuration has unsaved changes"
                    : "No configuration changes to save"}
            </div>
        </section>
    );
};

export default HeaderTextComponent;