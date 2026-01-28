import { IconStar } from '@tabler/icons-react';

interface IRatingStarProps {
    size?: number;
    fill?: string;
    defaultFill?: string;
    stroke?: number;
    title?: string;
    isFilled?: boolean;
    onClick?: () => void;
}

const RatingStar: React.FC<IRatingStarProps> = ({
    size = 45,
    fill = '#fcc800',
    defaultFill = '#f9f9f9',
    stroke = 0.1,
    title = 'Rating star',
    isFilled = false,
    onClick,
}) => {
    return (
        <IconStar
            size={size}
            fill={isFilled ? fill : defaultFill}
            stroke={stroke}
            title={title}
            className="cursor-pointer transition-all"
            aria-label="rating-star"
            aria-disabled={true}
            onClick={onClick}
            data-testid={`star-${title}`}
        />
    );
};

export default RatingStar;
