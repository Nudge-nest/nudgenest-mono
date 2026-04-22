import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Footer from './Footer';
import Header from './Header';

// Scrolls to the hash element after every route change.
// Needed because React renders asynchronously — the browser's native
// scroll-to-hash fires before the DOM is ready in a SPA context.
const ScrollToHash = () => {
    const { hash, pathname } = useLocation();

    useEffect(() => {
        if (hash) {
            // Small delay to let the page finish rendering before scrolling
            const id = hash.replace('#', '');
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [hash, pathname]);

    return null;
};

const Layout = () => {
    return (
        <div className="w-full 2xl:max-w-screen-xl 2xl:mx-auto bg-[color:var(--color-icons-bg)]">
            <ScrollToHash />
            <Header />
            <div className="min-h-dvh">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
};

export default Layout;
