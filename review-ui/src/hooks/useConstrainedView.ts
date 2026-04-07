import { useState, useEffect } from 'react';

/**
 * Hook to detect if the widget is embedded in an iframe (e.g., Shopify)
 * Returns true if running inside an iframe
 */
export const useConstrainedView = (): boolean => {
    const [isIframe, setIsIframe] = useState(false);

    useEffect(() => {
        // Check if we're in an iframe
        const inIframe = window.self !== window.top;
        setIsIframe(inIframe);
    }, []);

    return isIframe;
};
