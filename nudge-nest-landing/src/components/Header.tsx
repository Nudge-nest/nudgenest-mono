import logo from '../assets/nudge-nest-icon2-v1.webp';
import { SmallBodyText, SmallBodyTextBold } from './Typography';

const homeUrl = `${import.meta.env.VITE_APP_HOST}`;
const contactUrl = `${import.meta.env.VITE_APP_CONTACT_URL}`;
const listBaseStyle = 'mx-4 cursor-pointer';

const Header = () => {
    return (
        <div className="w-full h-fit flex justify-between items-center px-4 pt-6 mx-auto" aria-label="header-component">
            <a href={homeUrl} className="w-1/2 h-fit flex items-center" target="_blank" rel="noopener noreferrer">
                <img src={logo} alt="logo" className="w-9 h-9 mr-1" />
                <SmallBodyTextBold>Nudge-nest</SmallBodyTextBold>
            </a>
            <ul className="w-1/2 hidden md:flex justify-center items-center">
                <li className={listBaseStyle}>
                    <a href="#how-it-works">
                        <SmallBodyText>How It Works</SmallBodyText>
                    </a>
                </li>
                <li className={listBaseStyle}>
                    <a href="#pricing">
                        <SmallBodyText>Pricing</SmallBodyText>
                    </a>
                </li>
                <li className={listBaseStyle}>
                    <a href="#faq">
                        <SmallBodyText>FAQ</SmallBodyText>
                    </a>
                </li>
                <li className={listBaseStyle}>
                    <a href={contactUrl} className="w-fit h-fit" target="_blank" rel="noopener noreferrer">
                        <SmallBodyText>Contact</SmallBodyText>
                    </a>
                </li>
            </ul>
        </div>
    );
};

export default Header;
