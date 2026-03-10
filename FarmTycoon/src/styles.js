import { create } from 'twrnc';

// Custom tailwind configuration
const tw = create({
    theme: {
        extend: {
            colors: {
                primary: '#ec5b13',
                backgroundLight: '#f8f6f6',
                backgroundDark: '#221610',
            },
        },
    },
});

export default tw;
