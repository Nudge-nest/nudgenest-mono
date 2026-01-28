import { useEffect, useState } from 'react';

const useCurrentTheme = () => {
    const [currentTheme, setCurrentTheme] = useState(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    const mqListener = (event: MediaQueryListEvent) => {
        setCurrentTheme(event.matches ? 'dark' : 'light');
    };

    useEffect(() => {
        const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
        darkThemeMq.addEventListener('change', mqListener);
        return () => darkThemeMq.removeEventListener('change', mqListener);
    }, [currentTheme]);

    return { currentTheme, setCurrentTheme };
};

export default useCurrentTheme;
