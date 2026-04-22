import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Footer from './Footer';
import Header from './Header';

// Scrolls to the hash element after every route change.
// useEffect fires after React has painted, so the target element is in the DOM
// by the time getElementById runs. Falls back to scroll-to-top on non-hash routes
// to prevent stale scroll position leaking between pages.
const ScrollToHash = () => {
    const { hash, pathname } = useLocation();

    useEffect(() => {
        if (hash) {
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
