import { Baby, Moon, ShoppingBag, Utensils } from 'lucide-react';
import { day } from '@/components/billing/format';
import type { DailyLogEntry, DailyLogOptions } from '@/types';

function label(options: { value: string; label: string }[], value: string) {
    return options.find((option) => option.value === value)?.label ?? value;
}

function duration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return hours ? `${hours} h${rest ? ` ${rest} min` : ''}` : `${rest} min`;
}

/** Lo que la familia ve del día de su hijo. */
export function DailyLogCard({
    log,
    options,
    title,
    color = '#16a34a',
}: {
    log: DailyLogEntry;
    options: DailyLogOptions;
    title?: string;
    color?: string;
}) {
    const mood = options.moods.find((m) => m.value === log.mood);

    return (
        <article className="space-y-4 rounded-3xl border bg-card p-5">
            <header className="flex items-center gap-3">
                <span
                    className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                    style={{ backgroundColor: `${color}22` }}
                    aria-hidden
                >
                    {mood?.emoji ?? '📒'}
                </span>
                <div>
                    <h2 className="text-lg font-semibold">
                        {title ?? 'Cuaderno del día'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {day(log.date)}
                        {mood && ` · ${mood.label}`}
                        {log.recorded_by && ` · ${log.recorded_by}`}
                    </p>
                </div>
            </header>

            {log.needs && (
                <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                    <ShoppingBag className="mt-0.5 size-4 shrink-0" /> Por favor
                    traer: {log.needs}
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                        <Utensils className="size-4" /> Comidas
                    </p>
                    {log.meals.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin registro
                        </p>
                    ) : (
                        <ul className="space-y-0.5 text-sm">
                            {log.meals.map((meal, index) => (
                                <li key={index}>
                                    <span className="font-medium">
                                        {label(options.moments, meal.moment)}:
                                    </span>{' '}
                                    {label(
                                        options.amounts,
                                        meal.amount,
                                    ).toLowerCase()}
                                    {meal.note && ` (${meal.note})`}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                        <Moon className="size-4" /> Siesta
                    </p>
                    {log.naps.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No durmió siesta
                        </p>
                    ) : (
                        <ul className="space-y-0.5 text-sm">
                            {log.naps.map((nap, index) => (
                                <li key={index}>
                                    {nap.from}
                                    {nap.to ? ` – ${nap.to}` : ' (durmiendo)'}
                                </li>
                            ))}
                            {(log.nap_minutes ?? 0) > 0 && (
                                <li className="font-medium">
                                    Total: {duration(log.nap_minutes ?? 0)}
                                </li>
                            )}
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                        <Baby className="size-4" /> Pañal / baño
                    </p>
                    {log.diapers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin registro
                        </p>
                    ) : (
                        <ul className="space-y-0.5 text-sm">
                            {log.diapers.map((diaper, index) => (
                                <li key={index}>
                                    {diaper.time} ·{' '}
                                    {label(options.diapers, diaper.type)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {log.note && (
                <p className="text-sm leading-relaxed whitespace-pre-line">
                    {log.note}
                </p>
            )}

            {log.photo && (
                <img
                    src={log.photo.url}
                    alt="Foto del día"
                    loading="lazy"
                    className="max-h-96 w-full rounded-2xl object-cover"
                />
            )}
        </article>
    );
}
