import type { SVGAttributes } from 'react';

/** Flor del jardín: logo provisional hasta tener el oficial del colegio. */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="9" r="7" />
            <circle cx="31" cy="17" r="7" />
            <circle cx="27" cy="30" r="7" />
            <circle cx="13" cy="30" r="7" />
            <circle cx="9" cy="17" r="7" />
            <circle cx="20" cy="20" r="6" fillOpacity="0.55" />
        </svg>
    );
}
