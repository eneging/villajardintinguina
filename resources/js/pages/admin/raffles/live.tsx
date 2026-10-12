import { Head, Link } from '@inertiajs/react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { show } from '@/routes/admin/raffles';
import type { EventTheme } from '@/types';

type Props = {
    raffle: {
        id: number;
        title: string;
        prize: string;
        status: 'abierto' | 'sorteado';
        seed: string | null;
        winner: { number: number; name: string | null } | null;
        event: { id: number; title: string; theme: EventTheme } | null;
    };
    paidNumbers: number[];
};

/**
 * Pantalla para proyectar: los números giran y se detienen en el ganador
 * (el ganador ya fue elegido en el servidor; la animación solo lo revela).
 */
export default function RaffleLive({ raffle, paidNumbers }: Props) {
    const theme = raffle.event?.theme ?? {
        color: '#16a34a',
        accent: '#dcfce7',
        emoji: '🎉',
    };
    const [shown, setShown] = useState<number | null>(null);
    const [done, setDone] = useState(false);

    const spin = useCallback(() => {
        if (!raffle.winner || paidNumbers.length === 0) {
            return;
        }
        setDone(false);
        let delay = 40;
        let elapsed = 0;
        let timer: ReturnType<typeof setTimeout>;
        const tick = () => {
            elapsed += delay;
            if (elapsed > 4500) {
                setShown(raffle.winner!.number);
                setDone(true);

                return;
            }
            setShown(
                paidNumbers[Math.floor(Math.random() * paidNumbers.length)],
            );
            delay = Math.min(delay * 1.08, 400);
            timer = setTimeout(tick, delay);
        };
        tick();

        return () => clearTimeout(timer);
    }, [paidNumbers, raffle.winner]);

    useEffect(() => spin(), [spin]);

    return (
        <>
            <Head title={`Sorteo en vivo · ${raffle.title}`} />
            <div
                className="flex min-h-[80vh] flex-col items-center justify-center gap-6 rounded-3xl p-6 text-center"
                style={{ backgroundColor: theme.accent }}
            >
                <p className="text-6xl" aria-hidden>
                    {theme.emoji}
                </p>
                <h1
                    className="font-display text-4xl font-extrabold sm:text-5xl"
                    style={{ color: theme.color }}
                >
                    {raffle.title}
                </h1>
                <p className="text-xl text-slate-700">🎁 {raffle.prize}</p>
                <div
                    className={`flex size-56 items-center justify-center rounded-full border-8 bg-white font-display text-8xl font-extrabold tabular-nums shadow-xl transition-transform sm:size-72 sm:text-9xl ${done ? 'scale-110' : ''}`}
                    style={{ borderColor: theme.color, color: theme.color }}
                    aria-live="polite"
                >
                    {shown ?? '?'}
                </div>
                {done && raffle.winner && (
                    <p className="animate-in text-3xl font-bold text-slate-900 fade-in zoom-in">
                        🎉 ¡Ticket N° {raffle.winner.number}
                        {raffle.winner.name && `: ${raffle.winner.name}`}! 🎉
                    </p>
                )}
                {raffle.status === 'abierto' && (
                    <p className="text-slate-700">
                        Este sorteo aún no se realizó.
                    </p>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                    {raffle.winner && (
                        <Button
                            variant="outline"
                            className="bg-white"
                            onClick={spin}
                        >
                            <RotateCcw /> Repetir animación
                        </Button>
                    )}
                    <Button variant="outline" className="bg-white" asChild>
                        <Link href={show(raffle.id)}>Volver a los tickets</Link>
                    </Button>
                </div>
                {raffle.seed && (
                    <p className="flex max-w-xl items-start gap-2 text-xs text-slate-600">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0" />{' '}
                        Semilla pública:{' '}
                        <code className="break-all">{raffle.seed}</code> ·{' '}
                        {paidNumbers.length} tickets pagados participaron.
                    </p>
                )}
            </div>
        </>
    );
}

RaffleLive.layout = (props: Props) => ({
    breadcrumbs: [{ title: props.raffle.title, href: show(props.raffle.id) }],
});
