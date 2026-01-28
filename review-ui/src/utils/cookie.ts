import { Cookies } from 'react-cookie';

export const COOKIE_AGE: number = 86400; //24 HOURS

export const cookieManager = (function CookieManager() {
    return new Cookies();
})();
