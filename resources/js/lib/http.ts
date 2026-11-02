function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

/** POST con JSON a una ruta de Laravel (con el token CSRF de la cookie). */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as T & {
        message?: string;
    };

    if (!response.ok) {
        throw new Error(data.message ?? 'No se pudo completar la operación.');
    }

    return data;
}
