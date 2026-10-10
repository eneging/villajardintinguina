import { useState } from 'react';
import { MediaUploader } from '@/components/school/media-uploader';
import type { UploadTarget } from '@/components/school/media-uploader';
import { Label } from '@/components/ui/label';
import type { MediaItem } from '@/types';

export function CoverField({
    target,
    initial,
    hasCover,
    disabled,
    onChange,
}: {
    target: UploadTarget;
    initial: MediaItem | null;
    hasCover: boolean;
    disabled: boolean;
    onChange: (mediaId: number) => void;
}) {
    const [cover, setCover] = useState<MediaItem | null>(initial);

    return (
        <div className="grid gap-2">
            <Label>Portada</Label>
            {hasCover && cover?.thumbnail && (
                <img
                    src={cover.thumbnail}
                    alt=""
                    className="h-24 w-fit rounded-lg"
                />
            )}
            <MediaUploader
                target={target}
                resourceType="image"
                label={hasCover ? 'Cambiar portada' : 'Subir portada'}
                disabled={disabled}
                onUploaded={(media) => {
                    setCover(media);
                    onChange(media.id);
                }}
            />
        </div>
    );
}
