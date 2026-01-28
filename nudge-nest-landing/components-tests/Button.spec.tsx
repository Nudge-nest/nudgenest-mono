import { test, expect } from '@playwright/experimental-ct-react';
import { Button, FooterButton, LinkButton } from '../src/components/Button';

test.describe('App buttons component', () => {
    test('Button renders', async ({ mount }) => {
        const component = await mount(<Button>Hello Button</Button>);
        await expect(component).toContainText('Hello Button');
    });

    test('LinkButton renders', async ({ mount }) => {
        const component = await mount(<LinkButton>Hello Link Button</LinkButton>);
        await expect(component).toContainText('Hello Link Button');
    });

    test('FooterButton renders', async ({ mount }) => {
        const component = await mount(<FooterButton>Hello Footer Button</FooterButton>);
        await expect(component).toContainText('Hello Footer Button');
    });
});
