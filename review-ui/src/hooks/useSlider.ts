import { useKeenSlider } from 'keen-slider/react';
import { useState } from 'react';

export const useSlider = (totalSlides: number) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loaded, setLoaded] = useState(false);

    const [sliderRef, instanceRef] = useKeenSlider({
        initial: 0,
        slides: {
            number: totalSlides,
            perView: 1,
            spacing: 0
        },
        slideChanged: (slider) => {
            setCurrentSlide(slider.track.details.rel);
        },
        created: () => setLoaded(true),
    });

    return {
        currentSlide,
        loaded,
        sliderRef,
        instanceRef: instanceRef as any, // Keep for now, but should be properly typed
        setCurrentSlide,
    };
};
