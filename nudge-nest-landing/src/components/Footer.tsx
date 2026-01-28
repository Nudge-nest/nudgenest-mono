import { useState } from 'react';
import { SmallBodyText, SmallBodyTextBold } from './Typography';
import { FooterButton } from './Button';

const Footer = () => {
    const [year] = useState<string>(`${new Date().getFullYear()}`);
    return (
        <div
            className="w-full h-80 max-h-80 px-4 grid grid-cols-12 bg-[color:var(--color-white)]"
            aria-label="footer-component"
        >
            <div className="col-span-full md:w-4/5 mx-auto flex flex-col gap-y-2 justify-center items-center pb-4">
                <SmallBodyTextBold className="text-[color:var(--color-dark)]">
                    Subscribe to our newsletter
                </SmallBodyTextBold>
                <div>
                    <input
                        className="bg-[color:var(--color-bg)] px-4 py-3 rounded-s-3xl outline-none"
                        placeholder="Enter your email"
                    />
                    <FooterButton>
                        <SmallBodyText className={`!text-[color:var(--color-text)]`}>Subscribe</SmallBodyText>
                    </FooterButton>
                </div>
            </div>
            <div className="col-span-full md:w-4/5 mx-auto flex gap-x-3 justify-center items-end pb-4">
                <SmallBodyText className="text-[color:var(--color-main)]">&copy; {year} Nudge-nest</SmallBodyText>
                <SmallBodyText className="text-[color:var(--color-main)]">. Privacy</SmallBodyText>
                <SmallBodyText className="text-[color:var(--color-main)]">. Terms</SmallBodyText>
                <SmallBodyText className="text-[color:var(--color-main)]">. Sitemap</SmallBodyText>
            </div>
        </div>
    );
};

export default Footer;
