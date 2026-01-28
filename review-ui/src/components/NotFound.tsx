import { Link } from 'react-router';

const NotFound = () => {
    return (
        <div className={`w-1/2 mx-auto pt-4`}>
            <p className={`text-[color:var(--color-text)]`}>Page not found</p>
            <Link to={'/'} className={`text-[color:var(--color-main)] underline italic`}>
                Back to home
            </Link>
        </div>
    );
};
export default NotFound;
