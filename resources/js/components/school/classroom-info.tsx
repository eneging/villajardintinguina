import { Link } from '@inertiajs/react';
import { CalendarDays, Clock, Soup, Pencil } from 'lucide-react';
import { day } from '@/components/billing/format';
import { cn } from '@/lib/utils';
import type { ClassroomActivity, ClassroomInfo } from '@/types';

export const activityStyles: Record<string, string> = {
    actividad: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    salida: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    celebracion:
        'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200',
    reunion:
        'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
    evaluacion:
        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    sin_clases: 'bg-muted text-muted-foreground',
};

const weekdayIndex: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
};

/** Fecha corta "mié 15 oct". */
const shortDate = new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
});

export function ActivityList({
    activities,
    onDelete,
}: {
    activities: ClassroomActivity[];
    onDelete?: (activity: ClassroomActivity) => void;
}) {
    if (activities.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No hay actividades programadas.
            </p>
        );
    }

    return (
        <ul className="divide-y">
            {activities.map((activity) => (
                <li key={activity.id} className="flex gap-3 py-2.5">
                    <div className="w-20 shrink-0 text-sm font-medium capitalize">
                        {shortDate.format(
                            new Date(`${activity.date}T00:00:00`),
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-medium">
                            {activity.title}{' '}
                            <span
                                className={cn(
                                    'ml-1 rounded-full px-2 py-0.5 text-xs font-normal',
                                    activityStyles[activity.type],
                                )}
                            >
                                {activity.type_label}
                            </span>
                        </p>
                        {activity.description && (
                            <p className="text-sm text-muted-foreground">
                                {activity.description}
                            </p>
                        )}
                    </div>
                    {onDelete && (
                        <button
                            type="button"
                            className="text-sm text-destructive hover:underline"
                            onClick={() => onDelete(activity)}
                        >
                            Quitar
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}

/**
 * Tarjetas de información práctica del salón (horario, menú, útiles y calendario).
 */
export function ClassroomInfoCards({
    info,
    weekdays,
    activities,
    color,
    editHref,
}: {
    info: ClassroomInfo;
    weekdays: Record<string, string>;
    activities: ClassroomActivity[];
    color: string;
    editHref?: string;
}) {
    const today = new Date().getDay();
    const hasMenu = Object.values(info.weekly_menu).some(
        (meal) => meal.snack || meal.lunch,
    );
    const empty =
        info.schedule.length === 0 &&
        info.supplies.length === 0 &&
        !hasMenu &&
        activities.length === 0;

    if (empty && !editHref) {
        return null;
    }

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">Información del salón</h2>
                {editHref && (
                    <Link
                        href={editHref}
                        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                        <Pencil className="size-4" /> Editar
                    </Link>
                )}
            </div>
            {empty ? (
                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Agrega el horario, el menú semanal, la lista de útiles y las
                    actividades para que las familias estén informadas.
                </p>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {activities.length > 0 && (
                        <article className="rounded-2xl border bg-card p-4 lg:col-span-2">
                            <h3 className="mb-2 flex items-center gap-2 font-semibold">
                                <CalendarDays
                                    className="size-5"
                                    style={{ color }}
                                />
                                Próximas actividades
                            </h3>
                            <ActivityList activities={activities} />
                        </article>
                    )}
                    {info.schedule.length > 0 && (
                        <article className="rounded-2xl border bg-card p-4">
                            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                <Clock className="size-5" style={{ color }} />
                                Un día en el salón
                            </h3>
                            <ol className="relative space-y-3 border-l-2 pl-4">
                                {info.schedule.map((slot, index) => (
                                    <li key={index} className="relative">
                                        <span
                                            className="absolute top-1.5 -left-[1.4rem] size-3 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-sm font-semibold tabular-nums">
                                            {slot.time}
                                        </span>{' '}
                                        <span className="text-sm">
                                            {slot.activity}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </article>
                    )}
                    {hasMenu && (
                        <article className="rounded-2xl border bg-card p-4">
                            <h3 className="mb-3 flex items-center gap-2 font-semibold">
                                <Soup className="size-5" style={{ color }} />
                                Menú de la semana
                                {info.menu_week_of && (
                                    <span className="text-sm font-normal text-muted-foreground">
                                        · desde el {day(info.menu_week_of)}
                                    </span>
                                )}
                            </h3>
                            <dl className="space-y-2">
                                {Object.entries(weekdays).map(
                                    ([key, label]) => {
                                        const meal = info.weekly_menu[key];

                                        if (!meal?.snack && !meal?.lunch) {
                                            return null;
                                        }

                                        return (
                                            <div
                                                key={key}
                                                className={cn(
                                                    'rounded-xl p-2 text-sm',
                                                    weekdayIndex[key] ===
                                                        today && 'ring-2',
                                                )}
                                                style={{
                                                    backgroundColor: `${color}14`,
                                                    ...(weekdayIndex[key] ===
                                                    today
                                                        ? {
                                                              ['--tw-ring-color' as string]:
                                                                  color,
                                                          }
                                                        : {}),
                                                }}
                                            >
                                                <dt className="font-semibold">
                                                    {label}
                                                    {weekdayIndex[key] ===
                                                        today && ' · hoy'}
                                                </dt>
                                                {meal.snack && (
                                                    <dd>🍎 {meal.snack}</dd>
                                                )}
                                                {meal.lunch && (
                                                    <dd>🍲 {meal.lunch}</dd>
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                            </dl>
                        </article>
                    )}
                    {info.supplies.length > 0 && (
                        <article className="rounded-2xl border bg-card p-4 lg:col-span-2">
                            <h3 className="mb-3 font-semibold">
                                ✏️ Lista de útiles
                            </h3>
                            <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                                {info.supplies.map((supply, index) => (
                                    <li
                                        key={index}
                                        className="flex justify-between gap-2 border-b border-dashed py-1"
                                    >
                                        <span>{supply.item}</span>
                                        {supply.quantity && (
                                            <span className="text-muted-foreground">
                                                {supply.quantity}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    )}
                </div>
            )}
        </section>
    );
}
