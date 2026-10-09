import { Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { areaColors, formatRange, moduleTiming } from '@/lib/school';
import { cn } from '@/lib/utils';
import { show } from '@/routes/modules';
import type { LearningModuleCard } from '@/types';

const timingLabels = {
    current: 'Esta semana',
    upcoming: 'Próximo',
    past: 'Anterior',
} as const;

export function ModuleCard({
    module,
    color = '#f59e0b',
}: {
    module: LearningModuleCard;
    color?: string;
}) {
    const timing = moduleTiming(module.starts_on, module.ends_on);

    return (
        <Link
            href={show(module.id)}
            className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div
                className="relative h-32 w-full"
                style={{ backgroundColor: `${color}22` }}
            >
                {module.cover?.thumbnail ? (
                    <img
                        src={module.cover.thumbnail}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : (
                    <div
                        className="flex size-full items-center justify-center text-5xl"
                        aria-hidden
                    >
                        📚
                    </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                    {module.status === 'draft' ? (
                        <Badge variant="secondary">Borrador</Badge>
                    ) : (
                        <Badge
                            className={cn(
                                timing === 'current' &&
                                    'bg-green-600 text-white',
                            )}
                            variant={
                                timing === 'current' ? 'default' : 'secondary'
                            }
                        >
                            {timingLabels[timing]}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <span
                    className={cn(
                        'w-fit rounded-full px-2 py-0.5 text-xs font-medium',
                        areaColors[module.area] ?? 'bg-muted',
                    )}
                >
                    {module.area_label}
                </span>
                <h3 className="leading-snug font-semibold group-hover:underline">
                    {module.title}
                </h3>
                {module.summary && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {module.summary}
                    </p>
                )}
                <div className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {formatRange(module.starts_on, module.ends_on)}
                    {module.classroom && <> · {module.classroom}</>}
                </div>
            </div>
        </Link>
    );
}
