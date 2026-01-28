import { test, expect } from '@playwright/experimental-ct-react';

import Header from '../src/components/Header';

test.describe('App header component', () => {
    test('Renders name and links', async ({ mount }) => {
        const component = await mount(<Header />);
        await expect(component).toContainText('Nudge-nest');
        await expect(component).toContainText('Home');
        await expect(component).toContainText('About');
        await expect(component).toContainText('Contact');
    });
});
