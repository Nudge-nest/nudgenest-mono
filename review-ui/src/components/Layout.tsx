import useCurrentTheme from '../hooks/useCurrentTheme.tsx';
import { ReviewProvider } from '../contexts/ReviewContext.tsx';
import { Outlet } from 'react-router';
import { ReviewConfigProvider } from '../contexts/ReviewConfigContext.tsx';

export const Layout = () => {
    const { currentTheme } = useCurrentTheme();
    return (
        <ReviewProvider>
            <div
                className={`${currentTheme} w-full max-w-[480px] mx-auto h-[100vh] relative bg-[color:var(--color-lighter)] 
                text-[color:var(--color-text)] rounded-2xl`}
            >
                <Outlet />
            </div>
        </ReviewProvider>
    );
};

export const ConfigsLayout = () => {
    const { currentTheme } = useCurrentTheme();
    return (
        <ReviewConfigProvider>
            <div
                className={`${currentTheme} w-full mx-auto min-h-screen relative bg-[color:var(--color-bg)] text-[color:var(--color-text)]`}
                style={{
                    paddingTop: 'max(2rem, env(safe-area-inset-top))',
                    paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right))'
                }}
            >
                <Outlet />
            </div>
        </ReviewConfigProvider>
    );
};

export const ReviewsListLayout = () => {
    const { currentTheme } = useCurrentTheme();
    return (
        <div
            className={`${currentTheme} w-full mx-auto min-h-screen relative bg-[color:var(--color-bg)] text-[color:var(--color-text)]`}
        >
            <Outlet />
        </div>
    );
};
