import { create } from 'twrnc';

// Custom tailwind configuration
const tw = create({
    theme: {
        extend: {
            fontFamily: {
                inter: ['Inter_400Regular'],
                interBold: ['Inter_700Bold'],
                interBlack: ['Inter_900Black'],
            },
            colors: {
                primary: '#ec5b13',
                backgroundLight: '#f8f6f6',
                backgroundDark: '#221610',
                slate900: '#0f172a',
                green500: '#22c55e',
            },
        },
    },
});

export default tw;
