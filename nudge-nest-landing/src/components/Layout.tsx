import { Outlet } from 'react-router';
import Footer from './Footer';
import Header from './Header';

const Layout = () => {
    return (
        <div className="w-full 2xl:max-w-screen-xl 2xl:mx-auto bg-[color:var(--color-icons-bg)]">
            <Header />
            <div className="min-h-dvh">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
};

export default Layout;
