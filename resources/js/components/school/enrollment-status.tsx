import { cn } from '@/lib/utils';

const tones: Record<string, string> = {
    enviada: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    observada:
        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    aprobada:
        'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    rechazada: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

export function EnrollmentStatus({
    status,
    label,
}: {
    status: string;
    label: string;
}) {
    return (
        <span
            className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                tones[status],
            )}
        >
            {label}
        </span>
    );
}
