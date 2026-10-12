import type { Auth } from '@/types/auth';
import type { SiteContact } from '@/types/site';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            school: { name: string; whatsapp: string };
            contact: SiteContact;
            [key: string]: unknown;
        };
    }
}
