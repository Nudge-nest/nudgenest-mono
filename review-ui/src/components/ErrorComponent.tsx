import { IconBugFilled } from '@tabler/icons-react';

const ErrorComponent: React.FC<{ message?: string; statusCode?: string; Icon?: any }> = ({
    message,
    statusCode,
    Icon,
}) => {
    return (
        <div className="flex flex-col gap-2 items-center">
            {Icon ? <Icon /> : <IconBugFilled size={70} fill="#ef4444" />}
            <p className={`text-[color:var(--color-text)]`}>{statusCode ? statusCode : null}</p>
            <p className={`text-[color:var(--color-text)]`}>{message ? message : 'Unknown error occured'}</p>
        </div>
    );
};

export default ErrorComponent;
