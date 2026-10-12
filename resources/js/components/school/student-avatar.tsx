import { cn } from '@/lib/utils';
import type { StudentSummary } from '@/types';

export function StudentAvatar({
    student,
    className,
}: {
    student: Pick<StudentSummary, 'name' | 'photo' | 'classroom'>;
    className?: string;
}) {
    if (student.photo?.thumbnail) {
        return (
            <img
                src={student.photo.thumbnail}
                alt={student.name}
                className={cn('rounded-full object-cover', className)}
            />
        );
    }

    return (
        <span
            aria-hidden
            className={cn(
                'flex items-center justify-center rounded-full text-3xl',
                className,
            )}
            style={{
                backgroundColor: `${student.classroom?.color ?? '#16a34a'}26`,
            }}
        >
            {student.classroom?.mascot ?? '🧒'}
        </span>
    );
}
