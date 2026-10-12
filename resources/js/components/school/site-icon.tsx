import {
    Baby,
    Bike,
    BookOpen,
    Bus,
    Camera,
    Clock,
    HeartHandshake,
    Languages,
    Music,
    Palette,
    Puzzle,
    ShieldCheck,
    Smile,
    Soup,
    Sprout,
    Star,
    Stethoscope,
    Sun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Íconos que la administradora puede elegir para servicios y pilares. */
export const siteIcons: Record<string, LucideIcon> = {
    'heart-handshake': HeartHandshake,
    'book-open': BookOpen,
    music: Music,
    soup: Soup,
    'shield-check': ShieldCheck,
    camera: Camera,
    palette: Palette,
    languages: Languages,
    baby: Baby,
    puzzle: Puzzle,
    sprout: Sprout,
    bike: Bike,
    sun: Sun,
    star: Star,
    smile: Smile,
    stethoscope: Stethoscope,
    bus: Bus,
    clock: Clock,
};

export function SiteIcon({
    name,
    className,
}: {
    name: string;
    className?: string;
}) {
    const Icon = siteIcons[name] ?? Star;

    return <Icon className={className} />;
}
