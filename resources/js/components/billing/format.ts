const soles = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
});

const shortDate = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

export function money(value: number | string): string {
    return soles.format(Number(value));
}

export function day(value: string): string {
    return shortDate.format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

/** "2026-10" → "Octubre de 2026" (solo la primera letra en mayúscula). */
export function monthName(period: string): string {
    const text = new Date(
        `${period.slice(0, 7)}-01T00:00:00`,
    ).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

    return text.charAt(0).toUpperCase() + text.slice(1);
}
