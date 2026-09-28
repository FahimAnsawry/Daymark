<?php

namespace App\Mail;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Task $task) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'A gentle reminder: '.$this->task->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.task-reminder',
            with: [
                'when' => collect([
                    $this->task->due_date?->format('l, M j'),
                    $this->task->due_time,
                    $this->task->project?->name,
                ])->filter()->implode(' · '),
                'dashboardUrl' => config('app.frontend_url').'/dashboard?view=today',
            ],
        );
    }
}
