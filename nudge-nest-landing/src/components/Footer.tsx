import { Link } from 'react-router';
import logo from '../assets/nudgenest_logo.svg?url';
import { SmallBodyText } from './Typography';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer
            className="w-full h-fit bg-[color:var(--color-white)] border-t border-[color:var(--color-icons-border)]"
            aria-label="footer-component"
        >
            <div className="w-full px-6 md:w-4/5 mx-auto py-12 flex flex-col gap-y-8 items-center">

                {/* Brand */}
                <div className="flex flex-col items-center gap-y-2">
                    <div className="flex items-center">
                        <img src={logo} alt="Nudgenest logo" className="h-20 w-auto dark:[filter:saturate(1.8)_brightness(1.1)_contrast(1.15)]" />
                    </div>
                    <SmallBodyText className="text-[color:var(--color-icons)] text-center">
                        Collect more reviews. Grow faster.
                    </SmallBodyText>
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
                        <Link
                            to="/terms"
                            className="hover:text-[color:var(--color-dark)] transition-colors"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
