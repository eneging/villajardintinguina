<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Raffle;
use App\Models\RaffleTicket;
use App\Models\User;
use App\Services\RaffleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class RaffleController extends Controller
{
    public function __construct(private readonly RaffleService $raffles) {}

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'title' => ['required', 'string', 'max:150'],
            'prize' => ['required', 'string', 'max:255'],
            'ticket_price' => ['required', 'numeric', 'min:0', 'max:9999'],
            'total_tickets' => ['required', 'integer', 'min:2', 'max:2000'],
            'draw_at' => ['nullable', 'date'],
        ], [], ['title' => 'título', 'prize' => 'premio', 'ticket_price' => 'precio del ticket', 'total_tickets' => 'cantidad de tickets']);

        $raffle = $this->raffles->create($data, $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => "Sorteo creado con {$raffle->total_tickets} tickets."]);

        return to_route('admin.raffles.show', $raffle);
    }

    public function show(Raffle $raffle): Response
    {
        $raffle->load(['tickets.buyer', 'winner', 'event']);

        return Inertia::render('admin/raffles/show', [
            'raffle' => $this->present($raffle),
            'tickets' => $raffle->tickets->map(fn (RaffleTicket $ticket) => [
                'id' => $ticket->id,
                'number' => $ticket->number,
                'buyer_id' => $ticket->buyer_id,
                'holder' => $ticket->holderName(),
                'paid' => $ticket->paid,
            ]),
            'parents' => User::query()
                ->whereHas('roleAssignments', fn ($q) => $q->where('role', Role::Parent))
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => ['value' => $user->id, 'label' => $user->name]),
        ]);
    }

    public function assign(Request $request, RaffleTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'buyer_id' => ['nullable', 'integer', 'exists:users,id'],
            'buyer_name' => ['nullable', 'string', 'max:150'],
            'paid' => ['boolean'],
        ]);

        try {
            $this->raffles->assign($ticket, $data['buyer_id'] ?? null, $data['buyer_name'] ?? null, (bool) ($data['paid'] ?? false), $request->user());
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['ticket' => $exception->getMessage()]);
        }

        return back();
    }

    public function draw(Request $request, Raffle $raffle): RedirectResponse
    {
        try {
            $winner = $this->raffles->draw($raffle, $request->user());
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['draw' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "¡Ganó el ticket N° {$winner->number}!"]);

        return to_route('admin.raffles.live', $raffle);
    }

    /**
     * Pantalla para proyectar el sorteo en vivo.
     */
    public function live(Raffle $raffle): Response
    {
        $raffle->load(['winner.buyer', 'event']);

        return Inertia::render('admin/raffles/live', [
            'raffle' => $this->present($raffle),
            'paidNumbers' => $raffle->tickets()->where('paid', true)->pluck('number'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Raffle $raffle): array
    {
        return [
            'id' => $raffle->id,
            'title' => $raffle->title,
            'prize' => $raffle->prize,
            'ticket_price' => (float) $raffle->ticket_price,
            'total_tickets' => $raffle->total_tickets,
            'draw_at' => $raffle->draw_at?->toIso8601String(),
            'status' => $raffle->status,
            'seed' => $raffle->seed,
            'drawn_at' => $raffle->drawn_at?->toIso8601String(),
            'winner' => $raffle->winner ? ['number' => $raffle->winner->number, 'name' => $raffle->winner->holderName()] : null,
            'event' => $raffle->event ? ['id' => $raffle->event->id, 'title' => $raffle->event->title, 'theme' => $raffle->event->theme] : null,
            'events' => Event::orderByDesc('date')->get(['id', 'title'])->map(fn (Event $event) => ['value' => $event->id, 'label' => $event->title]),
        ];
    }
}
