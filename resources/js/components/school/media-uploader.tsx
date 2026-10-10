import { ImageUp, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { signature, store } from '@/routes/media';
import type { MediaItem } from '@/types';

type ResourceType = 'image' | 'video' | 'raw';

/** Dónde se guarda el archivo: contenido de un salón o lecciones de inducción. */
export type UploadTarget =
    | { context: 'classroom'; classroom_id: number }
    | { context: 'induction' };

type SignedUpload = {
    upload_url: string;
    api_key: string;
    timestamp: number;
    signature: string;
    folder: string;
    type: string;
};

const accepts: Record<ResourceType, string> = {
    image: 'image/*',
    video: 'video/*',
    raw: 'application/pdf',
};

const maxBytes: Record<ResourceType, number> = {
    image: 10 * 1024 * 1024,
    video: 100 * 1024 * 1024,
    raw: 10 * 1024 * 1024,
};

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
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

    if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
            message?: string;
        };
        throw new Error(data.message ?? 'No se pudo completar la subida.');
    }

    return (await response.json()) as T;
}

function uploadToCloudinary(
    file: File,
    signed: SignedUpload,
    onProgress: (percent: number) => void,
): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signed.api_key);
    form.append('timestamp', String(signed.timestamp));
    form.append('signature', signed.signature);
    form.append('folder', signed.folder);
    form.append('type', signed.type);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', signed.upload_url);
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(
                    JSON.parse(xhr.responseText) as Record<string, unknown>,
                );
            } else {
                reject(new Error('Cloudinary rechazó el archivo.'));
            }
        };
        xhr.onerror = () => reject(new Error('Sin conexión con Cloudinary.'));
        xhr.send(form);
    });
}

/**
 * Sube un archivo directo del navegador a Cloudinary con la firma que da Laravel.
 */
export function MediaUploader({
    target,
    resourceType,
    label,
    disabled,
    onUploaded,
}: {
    target: UploadTarget;
    resourceType: ResourceType;
    label: string;
    disabled?: boolean;
    onUploaded: (media: MediaItem) => void;
}) {
    const input = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleFile(file: File) {
        setError(null);

        if (file.size > maxBytes[resourceType]) {
            setError(
                `El archivo pesa más de ${maxBytes[resourceType] / 1024 / 1024} MB.`,
            );

            return;
        }

        try {
            setProgress(0);
            const signed = await postJson<SignedUpload>(signature().url, {
                ...target,
                resource_type: resourceType,
            });
            const result = await uploadToCloudinary(file, signed, setProgress);
            const media = await postJson<MediaItem>(store().url, {
                ...target,
                public_id: result.public_id,
                version: result.version,
                signature: result.signature,
                resource_type: result.resource_type,
                type: result.type,
                format: result.format,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                duration: result.duration,
                original_filename: file.name,
            });
            onUploaded(media);
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'No se pudo subir el archivo.',
            );
        } finally {
            setProgress(null);
            if (input.current) {
                input.current.value = '';
            }
        }
    }

    return (
        <div className="space-y-1">
            <input
                ref={input}
                type="file"
                accept={accepts[resourceType]}
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        void handleFile(file);
                    }
                }}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || progress !== null}
                onClick={() => input.current?.click()}
            >
                {progress !== null ? (
                    <>
                        <Loader2 className="animate-spin" /> Subiendo {progress}
                        %
                    </>
                ) : (
                    <>
                        <ImageUp /> {label}
                    </>
                )}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
