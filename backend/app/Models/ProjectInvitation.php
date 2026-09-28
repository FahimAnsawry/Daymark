<?php

namespace App\Models;

use Database\Factories\ProjectInvitationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An invitation to a shared project. It is accepted by the account whose email it was sent to.
 */
#[Fillable(['project_id', 'invited_by', 'email', 'token', 'accepted_at'])]
#[Hidden(['token'])]
class ProjectInvitation extends Model
{
    /** @use HasFactory<ProjectInvitationFactory> */
    use HasFactory;

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isFor(User $user): bool
    {
        return strcasecmp($this->email, $user->email) === 0;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
        ];
    }
}
