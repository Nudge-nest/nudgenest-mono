import productScreenshotStars from '../assets/product-screenshot-stars.png';
import productScreenshotUpload from '../assets/product-screenshot-upload.png';
import productScreenshotComment from '../assets/product-screenshot-comment.png';
import { Button, LinkButton } from '../components/Button';
import FAQSection from '../components/FAQSection';
import HowItWorksSection from '../components/HowItWorksSection';
import PageSection from '../components/PageSection';
import PricingSection from '../components/PricingSection';
import SocialProofSection from '../components/SocialProofSection';
import {
    LargeHeaderTextBold,
    LargerHeaderTextBoldItalic,
    MediumBodyText,
    MediumHeaderTextBold,
    SmallBodyText,
    SmallBodyTextBold,
} from '../components/Typography';

const signupUrl = `${import.meta.env.VITE_APP_SIGNUP_URL}`;
const featuresUrl = `${import.meta.env.VITE_APP_FEATURES_URL}`;

const LandingPage = () => {
    return (
        <div className="grid grid-rows-4 md:grid-rows-[auto_auto_auto_auto]">
            <PageSection name="hero">
                <div className={`col-span-full w-full md:w-4/5 mx-auto flex flex-col gap-y-8 justify-center py-24 md:py-32`}>
                    <LargerHeaderTextBoldItalic>
                        Turn Every Order Into a 5-Star Review.
                    </LargerHeaderTextBoldItalic>
                    <MediumBodyText>
                        NudgeNest automatically emails your customers after every fulfilled order, turning happy buyers
                        into verified reviews. No code. No friction. Just social proof that sells.
                    </MediumBodyText>
                    <Button>
                        <a href={signupUrl} target="_blank" rel="noopener noreferrer">
                            <SmallBodyTextBold className={`!text-[color:var(--color-text)]`}>
                                Get Started
                            </SmallBodyTextBold>
                        </a>
                    </Button>
                </div>
            </PageSection>
            <PageSection name="product-preview">
                <div className="col-span-full md:w-4/5 mx-auto flex flex-col md:flex-row gap-8 items-center py-16">
                    <div className="flex-1 flex flex-col gap-y-4 text-left">
                        <LargeHeaderTextBold>The review experience your customers will love</LargeHeaderTextBold>
                        <MediumBodyText>
                            A beautifully simple, mobile-first review form sent straight to your customer's inbox —
                            no account, no login, no friction. Tap a star, leave a thought, done.
                        </MediumBodyText>
                    </div>
                    <div className="flex-shrink-0 flex gap-3 items-start justify-center">
                        <img
                            src={productScreenshotStars}
                            alt="Nudgenest review form on mobile — star rating step"
                            className="w-28 md:w-36 rounded-3xl shadow-xl border border-[color:var(--color-icons-border)]"
                        />
                        <img
                            src={productScreenshotUpload}
                            alt="Nudgenest review form on mobile — photo upload step"
                            className="w-28 md:w-36 rounded-3xl shadow-xl border border-[color:var(--color-icons-border)] mt-6 md:mt-8"
                        />
                        <img
                            src={productScreenshotComment}
                            alt="Nudgenest review form on mobile — comment and submit step"
                            className="w-28 md:w-36 rounded-3xl shadow-xl border border-[color:var(--color-icons-border)] mt-12 md:mt-16"
                        />
                    </div>
                </div>
            </PageSection>
            <PageSection name="features">
                <div className={`col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 justify-center items-center py-16`}>
                    <LargeHeaderTextBold>Everything that runs on autopilot</LargeHeaderTextBold>
                    <ul className="flex flex-col gap-y-4 md:flex-row md:gap-x-4">
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold>Automated from day one:</SmallBodyTextBold>
                            <SmallBodyText>
                                Review emails go out the moment an order is fulfilled. No manual work,
                                no missed opportunities.
                            </SmallBodyText>
                        </li>
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold className="font-bold">Your brand, your message:</SmallBodyTextBold>
                            <SmallBodyText>
                                Customise the subject line, body, and call-to-action button from your
                                dashboard. Your voice, every time.
                            </SmallBodyText>
                        </li>
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold className="font-bold">Smart follow-up reminders:</SmallBodyTextBold>
                            <SmallBodyText>
                                Automated reminders nudge customers who haven't responded yet — at the
                                cadence you choose.
                            </SmallBodyText>
                        </li>
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold className="font-bold">QR codes & analytics:</SmallBodyTextBold>
                            <SmallBodyText>
                                Generate a QR code for in-store review collection and track response
                                rates from your analytics dashboard.
                            </SmallBodyText>
                        </li>
                    </ul>
                </div>
            </PageSection>
            <PageSection name="advantage">
                <div className={`col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 items-center py-16 md:py-20`}>
                    <LargeHeaderTextBold>Built for the way merchants actually work</LargeHeaderTextBold>
                    <div className="flex flex-col gap-y-4 md:flex-row md:gap-x-4">
                        <div className={`md:col-span-6`}>
                            <div className={'w-full md:w-4/5 text-left flex flex-col gap-y-1'}>
                                <MediumHeaderTextBold>
                                    Real reviews from real customers — automatically.
                                </MediumHeaderTextBold>
                                <MediumBodyText>
                                    Every review on NudgeNest is tied to an actual order. Only customers
                                    who've genuinely purchased from your store can submit one — so you
                                    get authentic feedback that shoppers trust.
                                </MediumBodyText>
                            </div>
                        </div>
                        <div className={`md:col-span-6`}>
                            <div className={'w-full md:w-4/5 text-left flex flex-col gap-y-1'}>
                                <MediumHeaderTextBold>Switching is painless</MediumHeaderTextBold>
                                <MediumBodyText>
                                    Already using a competitor? NudgeNest is quick to set up and your
                                    reviews migrate with you. If there's a feature you need, tell us —
                                    we ship fast.
                                </MediumBodyText>
                                <LinkButton>
                                    <a
                                        href={featuresUrl}
                                        className="w-fit h-fit"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <SmallBodyText className={`!text-[color:var(--color-main)] !font-[500]`}>
                                            Submit Your Feature Request
                                        </SmallBodyText>
                                    </a>
                                </LinkButton>
                            </div>
                        </div>
                    </div>
                </div>
            </PageSection>
            <div id="how-it-works"><HowItWorksSection /></div>
            <div id="social-proof"><SocialProofSection /></div>
            <div id="pricing"><PricingSection /></div>
            <div id="faq"><FAQSection /></div>
        </div>
    );
};

export default LandingPage;
