import { Route, Routes } from 'react-router-dom';
import useCurrentTheme from './hooks/useCurrentTheme';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/404';

const App = () => {
    const { currentTheme } = useCurrentTheme();

    return (
        <div className={`${currentTheme} w-full bg-[color:var(--color-dark)]`}>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </div>
    );
};

export default App;
