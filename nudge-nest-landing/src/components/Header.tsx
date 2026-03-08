import logo from '../assets/nudgenest_logo.svg?url';

const contactUrl = `${import.meta.env.VITE_APP_CONTACT_URL}`;
const signupUrl = `${import.meta.env.VITE_APP_SIGNUP_URL}`;

const navLinkStyle =
    'text-sm text-[color:var(--color-dark)] hover:text-[color:var(--color-main)] transition-colors duration-150 cursor-pointer';

const Header = () => {
    return (
        <header
            className="sticky top-0 z-50 w-full border-b border-[color:var(--color-icons-border)] bg-white/90 dark:bg-[#2e3235]/90 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]"
            aria-label="header-component"
        >
            <div className="w-full px-6 h-16 flex items-center justify-between gap-x-4">
                {/* Logo + brand name */}
                <a
                    href="/"
                    className="flex items-center"
                >
                    <img src={logo} alt="Nudgenest logo" className="h-16 w-auto dark:[filter:saturate(1.8)_brightness(1.1)_contrast(1.15)]" />
                </a>

                {/* Nav links — hidden on mobile */}
                <nav className="hidden md:flex items-center gap-x-8 flex-1 justify-center">
                    <a href="#how-it-works" className={navLinkStyle}>How It Works</a>
                    <a href="#pricing" className={navLinkStyle}>Pricing</a>
                    <a href="#faq" className={navLinkStyle}>FAQ</a>
                    <a href={contactUrl} className={navLinkStyle} target="_blank" rel="noopener noreferrer">
                        Contact
                    </a>
                </nav>

                {/* CTA */}
                <a
                    href={signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 bg-[color:var(--color-main)] text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                    Get Started
                </a>
            </div>
        </header>
    );
};

export default Header;
