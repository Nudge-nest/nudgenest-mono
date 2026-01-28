import { test, expect } from '@playwright/experimental-ct-react';

import Footer from '../src/components/Footer';

test.describe('App header component', () => {
    const year = `${new Date().getFullYear()}`;
    test('Renders name and links', async ({ mount }) => {
        const component = await mount(<Footer />);
        await expect(component).toContainText('Subscribe to our newsletter');
        await expect(component).toContainText('Subscribe');
        await expect(component).toContainText('©');
        await expect(component).toContainText(year);
        await expect(component).toContainText('Nudge-nest');
        await expect(component).toContainText('. Privacy');
        await expect(component).toContainText('. Terms');
        await expect(component).toContainText('. Sitemap');
    });
});
