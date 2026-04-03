import { useEffect, useState } from 'react';
import PageSection from './PageSection';
import { LargeHeaderTextBold, MediumBodyText } from './Typography';

const reviewWidgetUrl = `${import.meta.env.VITE_APP_REVIEW_UI_URL}`.replace(/\/$/, '');
const DEMO_MERCHANT_ID = `${import.meta.env.VITE_APP_DEMO_MERCHANT_ID}`;

const SocialProofSection = () => {
    const [iframeHeight, setIframeHeight] = useState(600);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'nudgenest_resize' && typeof event.data.height === 'number') {
                setIframeHeight(event.data.height);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <PageSection name="social-proof">
            {/* Heading constrained to reading width */}
            <div className="col-span-full md:w-4/5 mx-auto flex flex-col gap-y-4 pt-16 pb-8 items-center">
                <LargeHeaderTextBold>Real Reviews, From Real Stores</LargeHeaderTextBold>
                <MediumBodyText className="text-center max-w-xl">
                    These reviews were collected automatically by a live NudgeNest merchant — no manual effort.
                </MediumBodyText>
            </div>

            <div className="col-span-full md:w-4/5 mx-auto pb-16">
                <div
                    className="w-full rounded-2xl overflow-hidden border border-[color:var(--color-icons-border)] shadow-md"
                    style={{ height: `${iframeHeight}px` }}
                >
                    <iframe
                        src={`${reviewWidgetUrl}/reviews/${DEMO_MERCHANT_ID}`}
                        title="NudgeNest live review widget"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        loading="lazy"
                    />
                </div>
            </div>
        </PageSection>
    );
};

export default SocialProofSection;
