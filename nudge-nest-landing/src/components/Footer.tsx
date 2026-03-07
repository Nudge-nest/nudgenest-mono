import { useState } from 'react';
import { Link } from 'react-router';
import logo from '../assets/nudgenest_no_bg.svg?url';
import { FooterButton } from './Button';
import { SmallBodyText, SmallBodyTextBold } from './Typography';

const Footer = () => {
    const [year] = useState<string>(`${new Date().getFullYear()}`);

    return (
        <footer
            className="w-full h-fit bg-[color:var(--color-white)] border-t border-[color:var(--color-icons-border)]"
            aria-label="footer-component"
        >
            <div className="w-full px-6 md:w-4/5 mx-auto py-12 flex flex-col gap-y-8 items-center">

                {/* Brand */}
                <div className="flex flex-col items-center gap-y-2">
                    <div className="flex items-center gap-x-2">
                        <img src={logo} alt="Nudgenest logo" className="h-[56px] w-auto dark:[filter:saturate(1.8)_brightness(1.1)_contrast(1.15)]" />
                    </div>
                    <SmallBodyText className="text-[color:var(--color-icons)] text-center">
                        Collect more reviews. Grow faster.
                    </SmallBodyText>
                </div>

                {/* Newsletter */}
                <div className="flex flex-col items-center gap-y-3 w-full max-w-md">
                    <SmallBodyTextBold className="text-[color:var(--color-dark)]">
                        Subscribe to our newsletter
                    </SmallBodyTextBold>
                    <div className="flex w-full">
                        <input
                            className="flex-1 bg-[color:var(--color-bg)] px-4 py-3 rounded-s-3xl outline-none text-sm text-[color:var(--color-dark)] placeholder:text-[color:var(--color-icons)]"
                            placeholder="Enter your email"
                        />
                        <FooterButton>
                            <SmallBodyText className="!text-[color:var(--color-text)]">Subscribe</SmallBodyText>
                        </FooterButton>
                    </div>
                </div>

            </div>

            {/* Bottom bar */}
            <div className="border-t border-[color:var(--color-icons-border)]">
                <div className="w-full px-6 md:w-4/5 mx-auto py-4 flex flex-col md:flex-row items-center justify-between gap-y-2">
                    <SmallBodyText className="text-[color:var(--color-icons)]">
                        &copy; {year} Nudgenest
                    </SmallBodyText>
                    <div className="flex items-center gap-x-4 text-sm text-[color:var(--color-icons)]">
                        <Link
                            to="/privacy"
                            className="hover:text-[color:var(--color-dark)] transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <span aria-hidden="true">·</span>
                        <span className="cursor-default">Terms</span>
                        <span aria-hidden="true">·</span>
                        <span className="cursor-default">Sitemap</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
