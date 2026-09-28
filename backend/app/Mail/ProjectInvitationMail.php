<?php

namespace App\Mail;

use App\Models\ProjectInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public ProjectInvitation $invitation) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->invitation->inviter->name} shared “{$this->invitation->project->name}” with you",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.project-invitation',
            with: [
                'acceptUrl' => config('app.frontend_url').'/invite/'.$this->invitation->token,
            ],
        );
    }
}
