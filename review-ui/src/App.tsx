import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router';

import NotFound from './components/NotFound.tsx';
import { ConfigsLayout, Layout, ReviewsListLayout } from './components/Layout.tsx';
import Loading from './components/Loading.tsx';

// Redirect /configs/:merchantId → /config/:merchantId (legacy URL support)
const ConfigsRedirect = () => {
    const { merchantId } = useParams<{ merchantId: string }>();
    return <Navigate to={`/config/${merchantId}${window.location.search}`} replace />;
};

// Code-split route components
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const ReviewPage = lazy(() => import('./pages/ReviewPage.tsx'));
const StoreReviewPage = lazy(() => import('./pages/StoreReviewPage.tsx'));
const ReviewConfigsPage = lazy(() => import('./pages/ReviewConfigsPage.tsx'));
const ReviewsListPage = lazy(() => import('./pages/ReviewsListPage.tsx'));
const BillingPage = lazy(() => import('./pages/billing/BillingPage.tsx'));
// DEV-only: Vite drops these chunks from prod builds via dead-code elimination
const IframePreviewPage = lazy(() => import('./pages/dev/IframePreviewPage.tsx'));
const ConfigsPreviewPage = lazy(() => import('./pages/dev/ConfigsPreviewPage.tsx'));

//ShopId = MTY3NTgwMjk3MzU0
//merchantId = 68414ac959456a2575dd1aae

const App = () => {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex justify-center items-center bg-[color:var(--color-bg)]">
                <Loading />
            </div>
        }>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="review/:id" element={<ReviewPage />} />
                    <Route path="store/review/:merchantId" element={<StoreReviewPage />} />
                </Route>
                <Route path="config/:merchantId" element={<ConfigsLayout />}>
                    <Route index element={<ReviewConfigsPage />} />
                </Route>
                <Route path="configs/:merchantId" element={<ConfigsRedirect />} />
                <Route element={<ReviewsListLayout />}>
                    <Route path="reviews/:shopId" element={<ReviewsListPage />} />
                </Route>
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/dev/preview" element={<IframePreviewPage />} />
                <Route path="/dev/configs-preview" element={<ConfigsPreviewPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
};

export default App;
