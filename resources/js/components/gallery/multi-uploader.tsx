import { ImagePlus, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadFile } from '@/components/school/media-uploader';
import type { UploadTarget } from '@/components/school/media-uploader';
import { Button } from '@/components/ui/button';
import type { MediaItem } from '@/types';

/**
 * Selección múltiple de fotos y videos; los sube uno por uno y devuelve los que salieron bien.
 */
export function MultiUploader({
    target,
    disabled,
    onUploaded,
}: {
    target: UploadTarget;
    disabled?: boolean;
    onUploaded: (media: MediaItem[]) => void;
}) {
    const input = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<{
        current: number;
        total: number;
        percent: number;
    } | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    async function handleFiles(files: File[]) {
        const uploaded: MediaItem[] = [];
        const failed: string[] = [];

        for (const [index, file] of files.entries()) {
            setStatus({ current: index + 1, total: files.length, percent: 0 });

            try {
                uploaded.push(
                    await uploadFile(
                        file,
                        target,
                        file.type.startsWith('video/') ? 'video' : 'image',
                        (percent) =>
                            setStatus({
                                current: index + 1,
                                total: files.length,
                                percent,
                            }),
                    ),
                );
            } catch (exception) {
                failed.push(
                    exception instanceof Error
                        ? exception.message
                        : `No se pudo subir «${file.name}».`,
                );
            }
        }

        setStatus(null);
        setErrors(failed);

        if (input.current) {
            input.current.value = '';
        }

        if (uploaded.length > 0) {
            onUploaded(uploaded);
        }
    }

    return (
        <div className="space-y-2">
            <input
                ref={input}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length > 0) {
                        void handleFiles(files);
                    }
                }}
            />
            <Button
                type="button"
                disabled={disabled || status !== null}
                onClick={() => input.current?.click()}
            >
                {status ? (
                    <>
                        <Loader2 className="animate-spin" /> Subiendo{' '}
                        {status.current} de {status.total} ({status.percent}%)
                    </>
                ) : (
                    <>
                        <ImagePlus /> Subir fotos y videos
                    </>
                )}
            </Button>
            {errors.map((error) => (
                <p key={error} className="text-sm text-destructive">
                    {error}
                </p>
            ))}
        </div>
    );
}
