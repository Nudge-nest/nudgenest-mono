import { FC } from 'react';
import { IconLoader } from '@tabler/icons-react';

interface IloadingComponentProps {
    comment?: string;
}

const Loading: FC<IloadingComponentProps> = ({ comment }) => {
    return (
        <div className="flex justify-center items-center h-full">
            <IconLoader className="animate-spin text-[color:var(--color-main)]" size={48} stroke={2} />
            {comment ? <p className="text-[color:var(--color-text)]">{comment}</p> : null}
        </div>
    );
};

export default Loading;
