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
