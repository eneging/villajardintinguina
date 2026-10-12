import { Head, Link } from '@inertiajs/react';
import { Clock, Eye, Heart, Target } from 'lucide-react';
import { PageHero, PublicLayout } from '@/components/school/public-layout';
import { SiteIcon } from '@/components/school/site-icon';
import { admission } from '@/routes';
import type { SiteAbout, SiteScheduleItem, SiteTeamMember } from '@/types';

type Props = {
    content: {
        about: SiteAbout;
        team: { intro: string | null; items: SiteTeamMember[] };
        schedule: { items: SiteScheduleItem[] };
    };
};

const valueColors = [
    'bg-amber-100 text-amber-800',
    'bg-sky-100 text-sky-800',
    'bg-green-100 text-green-800',
    'bg-pink-100 text-pink-800',
    'bg-violet-100 text-violet-800',
];

export default function About({ content }: Props) {
    const { about, team, schedule } = content;

    return (
        <PublicLayout width="full">
            <Head title="Nosotros" />
            <PageHero title={about.title} subtitle={about.intro} emoji="🌻" />

            <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-2">
                {about.mission && (
                    <article className="rounded-3xl bg-white p-8 shadow-sm">
                        <Target className="mb-3 size-8 text-green-600" />
                        <h2 className="mb-2 font-display text-2xl font-bold">
                            Misión
                        </h2>
                        <p className="text-slate-600">{about.mission}</p>
                    </article>
                )}
                {about.vision && (
                    <article className="rounded-3xl bg-white p-8 shadow-sm">
                        <Eye className="mb-3 size-8 text-sky-600" />
                        <h2 className="mb-2 font-display text-2xl font-bold">
                            Visión
                        </h2>
                        <p className="text-slate-600">{about.vision}</p>
                    </article>
                )}
                {about.values.length > 0 && (
                    <article className="rounded-3xl bg-white p-8 shadow-sm md:col-span-2">
                        <Heart className="mb-3 size-8 text-pink-500" />
                        <h2 className="mb-4 font-display text-2xl font-bold">
                            Nuestros valores
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {about.values.map((value, index) => (
                                <span
                                    key={value}
                                    className={`rounded-full px-4 py-2 font-semibold ${valueColors[index % valueColors.length]}`}
                                >
                                    {value}
                                </span>
                            ))}
                        </div>
                    </article>
                )}
            </section>

            <section className="bg-white py-16">
                <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
                    <div className="space-y-4">
                        <h2 className="font-display text-3xl font-bold text-slate-900">
                            {about.proposal_title}
                        </h2>
                        <p className="whitespace-pre-line text-slate-600">
                            {about.proposal}
                        </p>
                    </div>
                    {about.image ? (
                        <img
                            src={about.image.url}
                            alt=""
                            className="aspect-[4/3] w-full -rotate-1 rounded-[2rem] object-cover shadow-lg ring-8 ring-amber-50"
                        />
                    ) : (
                        <div
                            aria-hidden
                            className="flex aspect-[4/3] items-center justify-center rounded-[2rem] bg-amber-100 text-8xl"
                        >
                            🎨
                        </div>
                    )}
                </div>
                {about.pillars.length > 0 && (
                    <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
                        {about.pillars.map((pillar) => (
                            <div
                                key={pillar.title}
                                className="rounded-3xl bg-[#fffaf0] p-6"
                            >
                                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                                    <SiteIcon
                                        name={pillar.icon}
                                        className="size-6"
                                    />
                                </div>
                                <h3 className="font-semibold">
                                    {pillar.title}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {pillar.text}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {team.items.length > 0 && (
                <section className="py-16">
                    <div className="mx-auto max-w-6xl space-y-10 px-4">
                        <div className="space-y-2 text-center">
                            <h2 className="font-display text-3xl font-bold text-slate-900">
                                Nuestro equipo
                            </h2>
                            {team.intro && (
                                <p className="text-slate-600">{team.intro}</p>
                            )}
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {team.items.map((member) => (
                                <article
                                    key={member.name}
                                    className="rounded-3xl bg-white p-6 text-center shadow-sm"
                                >
                                    {member.photo?.thumbnail ? (
                                        <img
                                            src={member.photo.thumbnail}
                                            alt={member.name}
                                            className="mx-auto mb-4 size-28 rounded-full object-cover ring-4 ring-amber-100"
                                        />
                                    ) : (
                                        <div
                                            aria-hidden
                                            className="mx-auto mb-4 flex size-28 items-center justify-center rounded-full bg-amber-100 text-5xl"
                                        >
                                            👩‍🏫
                                        </div>
                                    )}
                                    <h3 className="font-display text-lg font-bold">
                                        {member.name}
                                    </h3>
                                    {member.role && (
                                        <p className="text-sm font-medium text-green-700">
                                            {member.role}
                                        </p>
                                    )}
                                    {member.bio && (
                                        <p className="mt-2 text-sm text-slate-600">
                                            {member.bio}
                                        </p>
                                    )}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {schedule.items.length > 0 && (
                <section className="bg-green-600 py-16 text-white">
                    <div className="mx-auto max-w-4xl space-y-8 px-4 text-center">
                        <h2 className="font-display text-3xl font-bold">
                            Horarios
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {schedule.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl bg-white/10 p-5"
                                >
                                    <Clock className="mx-auto mb-2 size-6" />
                                    <p className="font-semibold">
                                        {item.label}
                                    </p>
                                    <p className="text-sm text-green-50">
                                        {item.hours}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Link
                            href={admission()}
                            className="inline-flex rounded-full bg-white px-6 py-3 font-semibold text-green-700 transition hover:bg-green-50"
                        >
                            Quiero una vacante
                        </Link>
                    </div>
                </section>
            )}
        </PublicLayout>
    );
}
