import { Cake } from 'lucide-react';
import type { Birthday } from '@/types';

const weekday = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
});

/** Cumpleaños de los próximos días. */
export function BirthdaysCard({
    birthdays,
    showClassroom = true,
}: {
    birthdays: Birthday[];
    showClassroom?: boolean;
}) {
    if (birthdays.length === 0) {
        return null;
    }

    return (
        <section className="space-y-3 rounded-2xl border border-pink-200 bg-pink-50/70 p-4 dark:border-pink-900 dark:bg-pink-950/30">
            <h2 className="flex items-center gap-2 font-semibold">
                <Cake className="size-5 text-pink-600" /> Cumpleaños de la
                semana
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
                {birthdays.map((birthday) => (
                    <li
                        key={birthday.id}
                        className="flex items-center gap-3 rounded-xl bg-background/80 p-2.5"
                    >
                        <span className="text-2xl" aria-hidden>
                            {birthday.days === 0 ? '🎂' : '🎈'}
                        </span>
                        <span className="text-sm">
                            <span className="font-semibold">
                                {birthday.name}
                            </span>{' '}
                            cumple {birthday.turns}{' '}
                            {birthday.turns === 1 ? 'año' : 'años'}
                            <span className="block text-muted-foreground capitalize">
                                {birthday.days === 0
                                    ? '¡Hoy!'
                                    : weekday.format(
                                          new Date(`${birthday.date}T00:00:00`),
                                      )}
                                {showClassroom &&
                                    birthday.classroom &&
                                    ` · ${birthday.classroom.mascot ?? ''} ${birthday.classroom.name}`}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
