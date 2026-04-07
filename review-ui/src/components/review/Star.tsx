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
    defaultFill = '#e5e7eb',
    stroke = 1.5,
    title = 'Rating star',
    isFilled = false,
    onClick,
}) => {
    return (
        <IconStar
            size={size}
            fill={isFilled ? fill : defaultFill}
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            title={title}
            className="cursor-pointer transition-all duration-200 ease-in-out hover:scale-110 active:scale-95"
            style={{
                filter: isFilled ? 'drop-shadow(0 2px 4px rgba(252, 200, 0, 0.3))' : 'none',
                color: isFilled ? fill : '#9ca3af'
            }}
            aria-label="rating-star"
            aria-disabled={true}
            onClick={onClick}
            data-testid={`star-${title}`}
        />
    );
};

export default RatingStar;
