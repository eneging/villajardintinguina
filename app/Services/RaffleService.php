<?php

namespace App\Services;

use App\Models\OtherIncome;
use App\Models\Raffle;
use App\Models\RaffleTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Sorteos con tickets numerados. El ganador se elige entre los tickets pagados con
 * una semilla aleatoria que se publica: ganador = sha256(semilla) mod cantidad de
 * tickets pagados (ordenados por número), así cualquiera puede verificarlo.
 */
class RaffleService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $by): Raffle
    {
        return DB::transaction(function () use ($data, $by) {
            $raffle = Raffle::create([...$data, 'created_by' => $by->id]);
            $now = now();

            RaffleTicket::insert(array_map(fn ($number) => [
                'raffle_id' => $raffle->id,
                'number' => $number,
                'created_at' => $now,
                'updated_at' => $now,
            ], range(1, $raffle->total_tickets)));

            return $raffle;
        });
    }

    public function assign(RaffleTicket $ticket, ?int $buyerId, ?string $buyerName, bool $paid, User $by): void
    {
        if ($ticket->raffle->isDrawn()) {
            throw new InvalidArgumentException('El sorteo ya se realizó.');
        }

        $empty = ! $buyerId && blank($buyerName);

        $ticket->update([
            'buyer_id' => $buyerId,
            'buyer_name' => $buyerId ? null : $buyerName,
            'paid' => ! $empty && $paid,
            'paid_at' => ! $empty && $paid ? ($ticket->paid_at ?? now()) : null,
            'sold_by' => $empty ? null : $by->id,
        ]);
    }

    public function draw(Raffle $raffle, User $by): RaffleTicket
    {
        return DB::transaction(function () use ($raffle, $by) {
            $raffle = Raffle::query()->lockForUpdate()->findOrFail($raffle->id);

            if ($raffle->isDrawn()) {
                throw new InvalidArgumentException('Este sorteo ya se realizó.');
            }

            $paid = $raffle->tickets()->where('paid', true)->orderBy('number')->get();

            if ($paid->isEmpty()) {
                throw new InvalidArgumentException('No hay tickets pagados para sortear.');
            }

            $seed = bin2hex(random_bytes(16));
            $winner = $paid[self::winnerIndex($seed, $paid->count())];

            $raffle->update([
                'status' => 'sorteado',
                'seed' => $seed,
                'winner_ticket_id' => $winner->id,
                'drawn_at' => now(),
            ]);

            $collected = round($paid->count() * (float) $raffle->ticket_price, 2);

            if ($collected > 0) {
                OtherIncome::create([
                    'date' => today(),
                    'source' => 'sorteo',
                    'raffle_id' => $raffle->id,
                    'description' => "{$raffle->title} ({$paid->count()} tickets)",
                    'amount' => $collected,
                    'created_by' => $by->id,
                ]);
            }

            return $winner;
        });
    }

    public static function winnerIndex(string $seed, int $count): int
    {
        // 13 dígitos hex = 52 bits: cabe en un entero sin perder precisión.
        return hexdec(substr(hash('sha256', $seed), 0, 13)) % $count;
    }
}
