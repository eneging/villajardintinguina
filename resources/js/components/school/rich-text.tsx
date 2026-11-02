import type { ReactNode } from 'react';

/**
 * Texto simple con formato mínimo: "## Título" para subtítulos, "- " para
 * viñetas y una línea en blanco entre párrafos.
 */
export function RichText({ text }: { text: string }) {
    const blocks: ReactNode[] = [];

    text.split(/\n{2,}/).forEach((block, index) => {
        const lines = block.split('\n');

        lines.forEach((line, lineIndex) => {
            const key = `${index}-${lineIndex}`;

            if (line.startsWith('## ')) {
                blocks.push(
                    <h2
                        key={key}
                        className="pt-4 font-display text-2xl font-bold text-slate-900"
                    >
                        {line.slice(3)}
                    </h2>,
                );
            }
        });

        const items = lines.filter((line) => line.startsWith('- '));
        const prose = lines.filter(
            (line) => !line.startsWith('## ') && !line.startsWith('- '),
        );

        if (prose.length > 0) {
            blocks.push(<p key={`${index}-p`}>{prose.join(' ')}</p>);
        }

        if (items.length > 0) {
            blocks.push(
                <ul key={`${index}-ul`} className="list-disc space-y-1 pl-6">
                    {items.map((item) => (
                        <li key={item}>{item.slice(2)}</li>
                    ))}
                </ul>,
            );
        }
    });

    return (
        <div className="space-y-4 leading-relaxed text-slate-700">{blocks}</div>
    );
}
