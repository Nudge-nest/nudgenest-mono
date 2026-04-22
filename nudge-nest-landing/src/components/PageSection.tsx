import React from 'react';

interface IPageSection {
    children: React.ReactNode;
    height?: 'full' | 'large' | 'medium';
    name?: string;
}

const PageSectionFull: React.FC<IPageSection> = ({ children, name }) => {
    return (
        <div id={name} className={`w-full h-screen max-h-screen px-4 grid grid-cols-12`} aria-label={`${name}-section`}>
            {children}
        </div>
    );
};

const PageSectionLarge: React.FC<IPageSection> = ({ children, name }) => {
    return (
        <div id={name} className={`w-full h-[40rem] max-h-[40rem] px-4 grid grid-cols-12`} aria-label={`${name}-section`}>
            {children}
        </div>
    );
};

const PageSectionMedium: React.FC<IPageSection> = ({ children, name }) => {
    return (
        <div id={name} className={`w-full h-96 max-h-96 px-4 grid grid-cols-12`} aria-label={`${name}-section`}>
            {children}
        </div>
    );
};

const PageSectionDefault: React.FC<IPageSection> = ({ children, name }) => {
    return (
        <div id={name} className={`w-full h-fit px-4 grid grid-cols-12`} aria-label={`${name}-section`}>
            {children}
        </div>
    );
};

// NOTE: if wrapping a section that already has a manual <div id="..."> in
// LandingPage.tsx (how-it-works, pricing, faq), do NOT pass the same name here —
// duplicate IDs break getElementById and are an HTML validity violation.
const PageSection: React.FC<IPageSection> = ({ children, height = 'default', name }) => {
    if (height === 'full') {
        return <PageSectionFull name={name}>{children}</PageSectionFull>;
    }
    if (height === 'large') {
        return <PageSectionLarge name={name}>{children}</PageSectionLarge>;
    }
    if (height === 'medium') {
        return <PageSectionMedium name={name}>{children}</PageSectionMedium>;
    }
    return <PageSectionDefault name={name}>{children}</PageSectionDefault>;
};

export default PageSection;
