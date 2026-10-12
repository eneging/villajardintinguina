import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Select nativo: funciona bien en celulares y con formularios largos. */
export function NativeSelect({
    className,
    options,
    placeholder,
    ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string | number; label: string }[];
    placeholder?: string;
}) {
    return (
        <select
            className={cn(
                'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30',
                className,
            )}
            {...props}
        >
            {placeholder !== undefined && (
                <option value="">{placeholder}</option>
            )}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
