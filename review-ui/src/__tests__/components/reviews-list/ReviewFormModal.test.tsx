import { render, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ReviewFormModal from '../../../components/reviews-list/ReviewFormModal';
import { nudgeNestApi } from '../../../redux/nudgenest';

vi.mock('@tabler/icons-react', () => ({
    IconX: () => <svg data-testid="close-icon" />,
}));
vi.mock('../../../components/Loading', () => ({
    default: () => <div data-testid="loading" />,
}));

function makeStore() {
    return configureStore({
        reducer: { [nudgeNestApi.reducerPath]: nudgeNestApi.reducer },
        middleware: (getDefault) => getDefault().concat(nudgeNestApi.middleware),
    });
}

function renderModal(props = {}) {
    const store = makeStore();
    const invalidateTags = vi.spyOn(nudgeNestApi.util, 'invalidateTags');
    const onClose = vi.fn();
    const view = render(
        <Provider store={store}>
            <ReviewFormModal isOpen={true} onClose={onClose} merchantId="merchant123" {...props} />
        </Provider>
    );
    return { onClose, invalidateTags, ...view };
}

describe('ReviewFormModal', () => {
    beforeEach(() => vi.clearAllMocks());

    test('postMessage review_submitted invalidates cache and closes modal', () => {
        const { onClose, invalidateTags } = renderModal();

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {
                data: { type: 'review_submitted' },
                origin: window.location.origin,
            }));
        });

        expect(invalidateTags).toHaveBeenCalledWith(['review']);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('postMessage form_closed calls onClose without cache invalidation', () => {
        const { onClose, invalidateTags } = renderModal();

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {
                data: { type: 'form_closed' },
                origin: window.location.origin,
            }));
        });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(invalidateTags).not.toHaveBeenCalled();
    });

    test('postMessage from disallowed origin is ignored', () => {
        const { onClose, invalidateTags } = renderModal();

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {
                data: { type: 'review_submitted' },
                origin: 'https://evil.example.com',
            }));
        });

        expect(onClose).not.toHaveBeenCalled();
        expect(invalidateTags).not.toHaveBeenCalled();
    });
});
