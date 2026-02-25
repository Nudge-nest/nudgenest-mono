import { Link } from 'react-router';

const LandingPage = () => {
    return (
        <div className="w-1/2 mx-auto pt-16">
            <h3 className={`text-[color:var(--color-text)] font-bold text-xl text-balance`}>
                Welcome to Nudgenest’s Review Platform
            </h3>
            <p className={`text-[color:var(--color-text)] mt-4 font-normal text-base text-balance`}>
                Curious about what your customers really think? Start your 7-day free trial, then continue for just
                $7.99/month or $72/year.
            </p>
            <p className={`text-[color:var(--color-text)] mt-4 font-normal text-base text-balance`}>
                Currently available for Shopify merchants — support for other e-commerce platforms is on the way!
            </p>
            <Link
                to="/review/demo"
                className="bg-[color:var(--color-main)] text-white font-semibold mt-6 inline-block px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
                Try it out now!
            </Link>
        </div>
    );
};

export default LandingPage;
