<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailyDigestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  'morning'|'evening'  $kind
     * @param  array{tasks: array<int, string>, overdue: int, done_today: int}  $digest
     */
    public function __construct(public User $user, public string $kind, public array $digest) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->kind === 'morning' ? 'Your day in Daymark' : 'Winding down for today',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.daily-digest',
            with: [
                'dashboardUrl' => config('app.frontend_url').'/dashboard?view=today',
            ],
        );
    }
}
