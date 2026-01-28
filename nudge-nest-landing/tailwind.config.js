/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            backgroundImage: {
                'nudge-image': "url('/src/assets/fingerprint.svg')",
            },
        },
    },
    plugins: [],
};
