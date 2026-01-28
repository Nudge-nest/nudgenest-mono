import { ReactNode } from 'react';

interface TypographyProps {
    children: string | ReactNode;
    className?: string;
}

export const BodyText: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p className={`font-normal text-sm text-[color:var(--color-dark)] ${className ? className : ''}`} {...props}>
            {children}
        </p>
    );
};

export const MediumBodyText: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p className={`font-normal text-base text-[color:var(--color-dark)] ${className ? className : ''}`} {...props}>
            {children}
        </p>
    );
};

export const LargeBodyText: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p className={`font-normal text-lg text-[color:var(--color-dark)] ${className ? className : ''}`} {...props}>
            {children}
        </p>
    );
};

export const SmallBodyText: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p className={`font-normal text-sm text-[color:var(--color-dark)] ${className ? className : ''}`} {...props}>
            {children}
        </p>
    );
};

export const SmallBodyTextBold: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p className={`font-bold text-base text-[color:var(--color-dark)] ${className ? className : ''}`} {...props}>
            {children}
        </p>
    );
};

export const LargerHeaderTextBold: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p
            className={`font-bold text-5xl italic text-[color:var(--color-dark)] text-pretty ${className ? className : ''}`}
            {...props}
        >
            {children}
        </p>
    );
};

export const LargerHeaderTextBoldItalic: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p
            className={`font-black text-5xl md:text-7xl font-[Grotesk-it] text-[color:var(--color-dark)] text-pretty ${className ? className : ''}`}
            {...props}
        >
            {children}
        </p>
    );
};

export const LargeHeaderTextBold: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p
            className={`font-bold text-2xl text-[color:var(--color-dark)] text-pretty ${className ? className : ''}`}
            {...props}
        >
            {children}
        </p>
    );
};

export const MediumHeaderTextBold: React.FC<TypographyProps> = ({ children, className, ...props }) => {
    return (
        <p
            className={`font-semibold text-base text-[color:var(--color-dark)] ${className ? className : ''}`}
            {...props}
        >
            {children}
        </p>
    );
};
