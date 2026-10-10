import {
    ArrowDown,
    ArrowUp,
    CheckSquare,
    FileText,
    Film,
    Home,
    ImageIcon,
    Trash2,
    Type,
} from 'lucide-react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { BlockRenderer } from '@/components/school/block-renderer';
import { MediaUploader } from '@/components/school/media-uploader';
import type { UploadTarget } from '@/components/school/media-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BlockContent, BlockType, ContentBlock, MediaItem } from '@/types';

export type BlockForm = {
    key: string;
    type: BlockType;
    content: BlockContent;
    media_id: number | null;
    media: MediaItem | null;
};

const blockTypes: Record<BlockType, { label: string; icon: ReactNode }> = {
    text: { label: 'Texto', icon: <Type /> },
    image: { label: 'Imagen', icon: <ImageIcon /> },
    video: { label: 'Video', icon: <Film /> },
    file: { label: 'PDF', icon: <FileText /> },
    activity: { label: 'Actividad para casa', icon: <Home /> },
    confirmation: { label: 'Casilla de aceptación', icon: <CheckSquare /> },
};

export const textareaClass =
    'min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

const newKey = () => Math.random().toString(36).slice(2);

export function toBlockForms(blocks: ContentBlock[] = []): BlockForm[] {
    return blocks.map((block) => ({
        key: newKey(),
        type: block.type,
        content: block.content,
        media_id: block.media?.id ?? null,
        media: block.media,
    }));
}

/** Lo que se envía al servidor (sin la vista previa del archivo). */
export function toBlockPayload(blocks: BlockForm[]) {
    return blocks.map(({ type, content, media_id }) => ({
        type,
        content,
        media_id,
    }));
}

export function BlockEditor({
    blocks,
    onChange,
    errors,
    target,
    cloudinaryEnabled,
    types,
}: {
    blocks: BlockForm[];
    onChange: (blocks: BlockForm[]) => void;
    errors: Record<string, string | undefined>;
    target: UploadTarget;
    cloudinaryEnabled: boolean;
    types: BlockType[];
}) {
    function update(index: number, patch: Partial<BlockForm>) {
        onChange(
            blocks.map((block, i) =>
                i === index ? { ...block, ...patch } : block,
            ),
        );
    }

    function updateContent(index: number, patch: BlockContent) {
        update(index, { content: { ...blocks[index].content, ...patch } });
    }

    function move(index: number, direction: -1 | 1) {
        const next = [...blocks];
        const target = index + direction;
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    }

    return (
        <div className="space-y-4">
            {!cloudinaryEnabled && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    Cloudinary aún no está configurado: por ahora puedes usar
                    texto, actividades y videos de YouTube.
                </p>
            )}
            <InputError message={errors.blocks} />

            {blocks.map((block, index) => (
                <div
                    key={block.key}
                    className="space-y-3 rounded-2xl border bg-card p-4"
                >
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-4">
                            {blockTypes[block.type].icon}
                            {blockTypes[block.type].label}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Subir"
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                            >
                                <ArrowUp />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Bajar"
                                disabled={index === blocks.length - 1}
                                onClick={() => move(index, 1)}
                            >
                                <ArrowDown />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Eliminar bloque"
                                onClick={() =>
                                    onChange(
                                        blocks.filter((_, i) => i !== index),
                                    )
                                }
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    </div>

                    {block.type === 'activity' && (
                        <Input
                            value={block.content.title ?? ''}
                            onChange={(e) =>
                                updateContent(index, { title: e.target.value })
                            }
                            placeholder="Actividad para casa"
                        />
                    )}

                    {(block.type === 'text' ||
                        block.type === 'activity' ||
                        block.type === 'confirmation') && (
                        <textarea
                            className={textareaClass}
                            value={block.content.body ?? ''}
                            onChange={(e) =>
                                updateContent(index, { body: e.target.value })
                            }
                            placeholder={
                                block.type === 'confirmation'
                                    ? 'He leído y acepto…'
                                    : block.type === 'text'
                                      ? 'Escribe aquí…'
                                      : 'Describe la actividad que pueden hacer en familia'
                            }
                        />
                    )}

                    {block.type === 'video' && (
                        <Input
                            value={block.content.youtube_url ?? ''}
                            onChange={(e) =>
                                updateContent(index, {
                                    youtube_url: e.target.value,
                                })
                            }
                            placeholder="Enlace de YouTube (opcional si subes el video)"
                        />
                    )}

                    {(block.type === 'image' ||
                        block.type === 'video' ||
                        block.type === 'file') && (
                        <>
                            <MediaUploader
                                target={target}
                                resourceType={
                                    block.type === 'file' ? 'raw' : block.type
                                }
                                label={
                                    block.media
                                        ? 'Reemplazar archivo'
                                        : 'Subir archivo'
                                }
                                disabled={!cloudinaryEnabled}
                                onUploaded={(media) =>
                                    update(index, { media, media_id: media.id })
                                }
                            />
                            <Input
                                value={block.content.caption ?? ''}
                                onChange={(e) =>
                                    updateContent(index, {
                                        caption: e.target.value,
                                    })
                                }
                                placeholder="Descripción (opcional)"
                            />
                        </>
                    )}

                    <InputError
                        message={
                            errors[`blocks.${index}`] ??
                            errors[`blocks.${index}.content.youtube_url`]
                        }
                    />

                    {(block.media || block.content.youtube_url) && (
                        <div className="rounded-xl bg-muted/40 p-3">
                            <BlockRenderer
                                block={{
                                    type: block.type,
                                    content: block.content,
                                    media: block.media,
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}

            <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                    <Button
                        key={type}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onChange([
                                ...blocks,
                                {
                                    key: newKey(),
                                    type,
                                    content: {},
                                    media_id: null,
                                    media: null,
                                },
                            ])
                        }
                    >
                        {blockTypes[type].icon} {blockTypes[type].label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
