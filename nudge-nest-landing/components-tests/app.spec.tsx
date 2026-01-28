import { test, expect } from '@playwright/experimental-ct-react';
import App from '../src/App';
import { MemoryRouter } from 'react-router-dom';

test.describe('App component', () => {
    test('Renders all texts', async ({ mount }) => {
        const component = await mount(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        await expect(component).toContainText('Boost Trust. Grow Your Brand. Simplify Reviews.');
        await expect(component).toContainText(
            'Discover Nudge-Nest — the seamless solution for gathering, showcasing, and analyzing customer reviews. Empower your e-commerce store to build credibility, increase conversions, and connect authentically with your audience.'
        );
        await expect(component).toContainText('Sign Up for Early Access');
        await expect(component).toContainText('Seamless Integration:');

        await expect(component).toContainText(
            'Seamlessly connect with Shopify and other e-commerce platforms to simplify\n' +
                '                                    collecting and managing text, photo, and video reviews'
        );
        await expect(component).toContainText('Automated Review Requests:');
        await expect(component).toContainText(
            'Send perfectly timed review invites via email, SMS, or QR codes to boost response\n' +
                '                                    rates.'
        );
        await expect(component).toContainText('Customizable Widgets:');
        await expect(component).toContainText(
            'Showcase customer feedback, whether in text, photos, or videos, using beautifully\n' +
                '                                    designed widgets that align perfectly with your brand and look stunning on any\n' +
                '                                    website.'
        );
        await expect(component).toContainText('Data-Driven Insights:');
        await expect(component).toContainText(
            'Unlock powerful analytics to measure the impact of customer feedback on your\n' +
                '                                    business.'
        );
        await expect(component).toContainText('Turn Customer Feedback into Your Competitive Advantage.');
        await expect(component).toContainText(
            'At Nudge-Nest, we believe every great product deserves authentic recognition. Our\n' +
                '                                    platform helps you capture the voice of your customers and transform it into\n' +
                '                                    compelling stories that drive trust, loyalty, and sales.'
        );
        await expect(component).toContainText('Feature Request Section');
        await expect(component).toContainText(
            'Already using a competitor but considering switching? Tell us what features you need\n' +
                '                                    to make Nudge-Nest perfect for you.'
        );
        await expect(component).toContainText('Submit Your Feature Request');
        await expect(component).toContainText('Subscribe to our newsletter');
        await expect(component).toContainText('Subscribe');
    });
});
