import { IconAlertCircle } from '@tabler/icons-react';

const ErrorComponent: React.FC<{ message?: string; statusCode?: string; Icon?: any }> = ({
    message,
    statusCode,
    Icon,
}) => {
    return (
        <div
            className="flex flex-col gap-4 items-center justify-center p-8 max-w-md mx-auto text-center"
            data-testid="error-component"
            role="alert"
            aria-live="polite"
        >
            {Icon ? <Icon /> : <IconAlertCircle size={64} className="text-red-500" stroke={1.5} />}

            {statusCode && (
                <p className="text-lg font-semibold text-[color:var(--color-text)] opacity-70">
                    Error {statusCode}
                </p>
            )}

            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-[color:var(--color-text)]">
                    Oops! Something went wrong
                </h2>
                <p className="text-[color:var(--color-text)] opacity-75">
                    {message || 'We encountered an unexpected error. Please try again later.'}
                </p>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[color:var(--color-main)] text-white rounded-lg
                hover:opacity-90 transition-all duration-200 font-medium shadow-sm"
                aria-label="Retry loading"
            >
                Try Again
            </button>
        </div>
    );
};

export default ErrorComponent;
