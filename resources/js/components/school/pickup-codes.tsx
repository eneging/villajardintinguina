import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

type Code = { key: string; name: string; relationship: string; url: string };

function QrImage({ url, label }: { url: string; label: string }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        void QRCode.toDataURL(url, {
            margin: 1,
            width: 360,
            errorCorrectionLevel: 'M',
        }).then(setSrc);
    }, [url]);

    return src ? (
        <img
            src={src}
            alt={`Código QR de recojo de ${label}`}
            className="size-40 rounded-xl bg-white p-1"
        />
    ) : (
        <span className="size-40 animate-pulse rounded-xl bg-muted" />
    );
}

/** Códigos QR de recojo: la familia los guarda en el celular o los imprime. */
export function PickupCodes({ codes }: { codes: Code[] }) {
    if (codes.length === 0) {
        return null;
    }

    return (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
            <div>
                <h2 className="font-semibold">Códigos QR de recojo</h2>
                <p className="text-sm text-muted-foreground">
                    La maestra escanea el código al entregar al niño y verifica
                    el DNI. Haz una captura de pantalla o envíaselo a la persona
                    autorizada. No lo compartas con nadie más.
                </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {codes.map((code) => (
                    <li
                        key={code.key}
                        className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center"
                    >
                        <QrImage url={code.url} label={code.name} />
                        <span className="text-sm font-medium">{code.name}</span>
                        <span className="text-xs text-muted-foreground">
                            {code.relationship}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
