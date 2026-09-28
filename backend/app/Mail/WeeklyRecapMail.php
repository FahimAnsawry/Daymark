<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyRecapMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array{from: string, to: string, completed: int, days_with_progress: int, by_project: array<int, array{project: string, completed: int}>}  $recap
     */
    public function __construct(public User $user, public array $recap) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your week in Daymark',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.weekly-recap',
            with: [
                'dashboardUrl' => config('app.frontend_url').'/dashboard',
            ],
        );
    }
}
