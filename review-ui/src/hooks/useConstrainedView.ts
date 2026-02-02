import { useState, useEffect } from 'react';

/**
 * Hook to detect if the widget is in a constrained environment (iframe)
 * Returns true if viewport is too small to show grid (likely Shopify iframe)
 */
export const useConstrainedView = (breakpoint: number = 600): boolean => {
    const [isConstrained, setIsConstrained] = useState(false);

    useEffect(() => {
        const checkConstraints = () => {
            // Check if we're in an iframe
            const isIframe = window.self !== window.top;

            // Check if viewport width is below breakpoint
            const isSmallViewport = window.innerWidth < breakpoint;

            // Constrained if in iframe AND small viewport
            setIsConstrained(isIframe && isSmallViewport);
        };

        // Initial check
        checkConstraints();

        // Listen for resize events
        window.addEventListener('resize', checkConstraints);

        return () => window.removeEventListener('resize', checkConstraints);
    }, [breakpoint]);

    return isConstrained;
};
