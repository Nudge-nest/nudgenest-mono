import { FC } from 'react';

import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react';

const ThankYouComponent: FC<{ message?: string; Icon?: any }> = ({ Icon, message }) => {
    return (
        <div className="flex flex-col gap-2 items-center" data-testid="thank-you-component">
            {Icon ? <Icon /> : <IconRosetteDiscountCheckFilled size={70} fill="#00a63e" />}
            <p className={`text-[color:var(--color-text)]`}>{message ? message : 'Success!'}</p>
        </div>
    );
};

export default ThankYouComponent;
