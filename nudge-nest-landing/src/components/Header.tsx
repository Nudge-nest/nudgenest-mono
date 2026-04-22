import { Link } from 'react-router';
import logo from '../assets/nudgenest_logo.svg?url';

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
                <nav className="hidden md:flex items-center gap-x-8 ml-auto">
                    <a href="#how-it-works" className={navLinkStyle}>How It Works</a>
                    <a href="#pricing" className={navLinkStyle}>Pricing</a>
                    <a href="#faq" className={navLinkStyle}>FAQ</a>
                    <Link to="/contact" className={navLinkStyle}>Contact</Link>
                </nav>

            </div>
        </header>
    );
};

export default Header;
