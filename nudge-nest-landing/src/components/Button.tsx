import React from 'react';

interface IButton {
    children: string | React.ReactNode;
}

const primaryButtonBaseStyle = 'w-fit bg-[color:var(--color-dark)] px-6 py-3 border-none outline-none';

export const Button: React.FC<IButton> = ({ children }) => {
    return <button className={`${primaryButtonBaseStyle} rounded-3xl`}>{children}</button>;
};

export const LinkButton: React.FC<IButton> = ({ children }) => {
    return <button className="w-fit bg-none">{children}</button>;
};

export const FooterButton: React.FC<IButton> = ({ children }) => {
    return <button className={`${primaryButtonBaseStyle} rounded-e-3xl`}>{children}</button>;
};
