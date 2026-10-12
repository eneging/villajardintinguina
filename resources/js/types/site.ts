import type { MediaItem } from './school';

export type SiteContact = {
    phone: string | null;
    email: string | null;
    address: string | null;
    hours: string | null;
    map_query: string | null;
    facebook: string | null;
    instagram: string | null;
    tiktok: string | null;
    youtube: string | null;
};

export type SiteHero = {
    badge: string | null;
    title: string;
    highlight: string | null;
    title_end: string | null;
    subtitle: string | null;
    image_media_id: number | null;
    video_media_id: number | null;
    video_url: string | null;
    image?: MediaItem | null;
    video?: MediaItem | null;
};

export type SiteIconItem = { icon: string; title: string; text: string | null };

export type SiteLevel = {
    name: string;
    age: string | null;
    mascot: string | null;
    color: string;
    text: string | null;
};

export type SiteScheduleItem = { label: string; hours: string };

export type SiteTeamMember = {
    name: string;
    role: string | null;
    bio: string | null;
    photo_media_id: number | null;
    photo?: MediaItem | null;
};

export type SiteTestimonial = {
    name: string;
    relation: string | null;
    text: string;
};

export type SiteAbout = {
    title: string;
    intro: string | null;
    mission: string | null;
    vision: string | null;
    values: string[];
    proposal_title: string | null;
    proposal: string | null;
    pillars: SiteIconItem[];
    image_media_id: number | null;
    image?: MediaItem | null;
};

export type SiteAdmission = {
    open: boolean;
    title: string;
    text: string | null;
    steps: string[];
    requirements: string[];
};

export type SiteSections = {
    hero: SiteHero;
    about: SiteAbout;
    levels: { items: SiteLevel[] };
    services: { items: SiteIconItem[] };
    schedule: { items: SiteScheduleItem[] };
    team: { intro: string | null; items: SiteTeamMember[] };
    testimonials: { items: SiteTestimonial[] };
    contact: SiteContact;
    admission: SiteAdmission;
};

export type PublicLessonCard = {
    id: number;
    title: string;
    description: string | null;
    cover: MediaItem | null;
};
