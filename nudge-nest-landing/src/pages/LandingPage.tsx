import { Button, LinkButton } from '../components/Button';
import PageSection from '../components/PageSection';
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
        <div>
            <PageSection name="hero">
                <div className={`col-span-full w-full md:w-4/5 mx-auto flex flex-col gap-y-8 justify-center py-24 md:py-32`}>
                    <LargerHeaderTextBoldItalic>
                        Boost Trust. Grow Your Brand. Simplify Reviews.
                    </LargerHeaderTextBoldItalic>
                    <MediumBodyText>
                        Discover Nudge-Nest — the seamless solution for gathering, showcasing, and analyzing customer
                        reviews. Empower your e-commerce store to build credibility, increase conversions, and connect
                        authentically with your audience.
                    </MediumBodyText>
                    <Button>
                        <a href={signupUrl} target="_blank" rel="noopener noreferrer">
                            <SmallBodyTextBold className={`!text-[color:var(--color-text)]`}>
                                Sign Up for Early Access
                            </SmallBodyTextBold>
                        </a>
                    </Button>
                </div>
            </PageSection>
            <PageSection name="media-video">
                <div className="col-span-full md:w-4/5 mx-auto w-full py-8">
                    <video
                        className="w-full aspect-video rounded-xl"
                        autoPlay
                        muted
                        playsInline
                    >
                        <source type="video/webm"
                                src="https://nudge-nest-media.s3.eu-north-1.amazonaws.com/nudge_nest_landing_01_HD.webm"/>
                    </video>
                </div>
            </PageSection>
            <PageSection name="features">
                <div className={`col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 justify-center items-center py-16 md:py-20`}>
                    <LargeHeaderTextBold>Why Choose Nudge-Nest?</LargeHeaderTextBold>
                    <ul className="flex flex-col gap-y-4 md:flex-row md:gap-x-4">
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold>Seamless Integration:</SmallBodyTextBold>
                            <SmallBodyText>
                                Seamlessly connect with Shopify and other e-commerce platforms to simplify collecting
                                and managing text, photo, and video reviews
                            </SmallBodyText>
                        </li>
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold className="font-bold">Automated Review Requests:</SmallBodyTextBold>
                            <SmallBodyText>
                                Send perfectly timed review invites via email, SMS, or QR codes to boost response rates.
                            </SmallBodyText>
                        </li>
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold className="font-bold">Customizable Widgets:</SmallBodyTextBold>
                            <SmallBodyText>
                                Showcase customer feedback, whether in text, photos, or videos, using beautifully
                                designed widgets that align perfectly with your brand and look stunning on any website.
                            </SmallBodyText>
                        </li>
                        <li className="w-full md:text-left md:w-4/5">
                            <SmallBodyTextBold className="font-bold">Data-Driven Insights:</SmallBodyTextBold>
                            <SmallBodyText>
                                Unlock powerful analytics to measure the impact of customer feedback on your business.
                            </SmallBodyText>
                        </li>
                    </ul>
                </div>
            </PageSection>
            <PageSection name="advantage">
                <div className={`col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 items-center py-16 md:py-20`}>
                    <LargeHeaderTextBold>Our Value Proposition</LargeHeaderTextBold>
                    <div className="flex flex-col gap-y-4 md:flex-row md:gap-x-4">
                        <div className={`md:col-span-6`}>
                            <div className={'w-full md:w-4/5 text-left flex flex-col gap-y-1'}>
                                <MediumHeaderTextBold>
                                    Turn Customer Feedback into Your Competitive Advantage.
                                </MediumHeaderTextBold>
                                <MediumBodyText>
                                    At Nudge-Nest, we believe every great product deserves authentic recognition. Our
                                    platform helps you capture the voice of your customers and transform it into
                                    compelling stories that drive trust, loyalty, and sales.
                                </MediumBodyText>
                                {/*<LinkButton>
                                    <SmallBodyText className={`!text-[color:var(--color-main)] !font-[500]`}>
                                        Learn More
                                    </SmallBodyText>
                                </LinkButton>*/}
                            </div>
                        </div>
                        <div className={`md:col-span-6`}>
                            <div className={'w-full md:w-4/5 text-left flex flex-col gap-y-1'}>
                                <MediumHeaderTextBold>Feature Request Section</MediumHeaderTextBold>
                                <MediumBodyText>
                                    Already using a competitor but considering switching? Tell us what features you need
                                    to make Nudge-Nest perfect for you.
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
        </div>
    );
};

export default LandingPage;
