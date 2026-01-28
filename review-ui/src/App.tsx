import { Route, Routes } from 'react-router';

import LandingPage from './pages/LandingPage.tsx';
import NotFound from './components/NotFound.tsx';
import ReviewPage from './pages/ReviewPage.tsx';
import StoreReviewPage from './pages/StoreReviewPage.tsx';
import ReviewConfigsPage from './pages/ReviewConfigsPage.tsx';
import { ConfigsLayout, Layout, ReviewsListLayout } from './components/Layout.tsx';
import ReviewsListPage from './pages/ReviewsListPage.tsx';

//ShopId = MTY3NTgwMjk3MzU0
//merchantId = 68414ac959456a2575dd1aae

const App = () => {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="review/:id" element={<ReviewPage />} />
                <Route path="store/review/:merchantId" element={<StoreReviewPage />} />
            </Route>
            <Route element={<ConfigsLayout />}>
                <Route path="configs/:merchantId" element={<ReviewConfigsPage />} />
            </Route>
            <Route element={<ReviewsListLayout />}>
                <Route path="reviews/:shopId" element={<ReviewsListPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default App;
