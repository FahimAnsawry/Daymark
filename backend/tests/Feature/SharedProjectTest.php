<?php

namespace Tests\Feature;

use App\Mail\ProjectInvitationMail;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\Task;
use App\Models\User;
use App\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SharedProjectTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: User, 2: Project}
     */
    private function sharedProject(): array
    {
        $owner = User::factory()->subscribed(Plan::Pro)->create();
        $member = User::factory()->create();
        $project = Project::factory()->for($owner)->create(['name' => 'Family']);
        $project->members()->attach($member);

        return [$owner, $member, $project];
    }

    public function test_inviting_needs_pro(): void
    {
        $owner = User::factory()->subscribed(Plan::Plus)->create();
        $project = Project::factory()->for($owner)->create();
        Sanctum::actingAs($owner);

        $this->postJson("/api/projects/{$project->id}/invitations", ['email' => 'sam@example.com'])
            ->assertPaymentRequired()
            ->assertJsonPath('required_plan', 'pro');
    }

    public function test_owner_invites_by_email(): void
    {
        Mail::fake();
        $owner = User::factory()->subscribed(Plan::Pro)->create();
        $project = Project::factory()->for($owner)->create();
        Sanctum::actingAs($owner);

        $this->postJson("/api/projects/{$project->id}/invitations", ['email' => 'Sam@Example.com'])
            ->assertCreated()
            ->assertJsonPath('email', 'sam@example.com');
        $this->postJson("/api/projects/{$project->id}/invitations", ['email' => 'sam@example.com'])->assertCreated();

        $this->assertSame(1, $project->invitations()->count());
        Mail::assertQueued(ProjectInvitationMail::class, 2);
    }

    public function test_only_the_owner_can_invite(): void
    {
        [, $member, $project] = $this->sharedProject();
        $member->subscriptions()->create(['plan' => Plan::Pro, 'period' => 'monthly']);
        Sanctum::actingAs($member);

        $this->postJson("/api/projects/{$project->id}/invitations", ['email' => 'new@example.com'])->assertForbidden();
    }

    public function test_people_who_already_have_access_cannot_be_invited(): void
    {
        [$owner, $member, $project] = $this->sharedProject();
        Sanctum::actingAs($owner);

        $this->postJson("/api/projects/{$project->id}/invitations", ['email' => $member->email])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_invitee_on_the_free_plan_accepts_and_sees_the_project(): void
    {
        $owner = User::factory()->subscribed(Plan::Pro)->create();
        $project = Project::factory()->for($owner)->create(['name' => 'Family']);
        Task::factory()->for($owner)->for($project)->create(['title' => 'Book the vet']);
        $invitee = User::factory()->create(['email' => 'sam@example.com']);
        $invitation = ProjectInvitation::factory()->for($project)->create(['email' => 'sam@example.com']);
        Sanctum::actingAs($invitee);

        $this->getJson("/api/invitations/{$invitation->token}")
            ->assertOk()
            ->assertJsonPath('project', 'Family')
            ->assertJsonPath('is_for_you', true);

        $this->postJson("/api/invitations/{$invitation->token}/accept")
            ->assertOk()
            ->assertJsonPath('data.is_owner', false)
            ->assertJsonPath('data.owner_name', $owner->name);

        $this->getJson('/api/projects')->assertJsonPath('data.0.name', 'Family');
        $this->getJson('/api/tasks')->assertJsonPath('data.0.title', 'Book the vet');
    }

    public function test_invitations_only_work_for_the_invited_email(): void
    {
        $invitation = ProjectInvitation::factory()->create(['email' => 'sam@example.com']);
        Sanctum::actingAs(User::factory()->create(['email' => 'alex@example.com']));

        $this->postJson("/api/invitations/{$invitation->token}/accept")->assertForbidden();
        $this->assertSame(0, $invitation->project->members()->count());
    }

    public function test_members_can_add_complete_and_assign_tasks(): void
    {
        [$owner, $member, $project] = $this->sharedProject();
        $task = Task::factory()->for($owner)->for($project)->create();
        Sanctum::actingAs($member);

        $this->postJson('/api/tasks', ['title' => 'Buy food', 'project' => 'Family'])
            ->assertCreated()
            ->assertJsonPath('data.project_id', $project->id);
        $this->assertSame(0, $member->projects()->count());

        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-28'])->assertOk();
        $this->assertSame(1, $member->taskCompletions()->count());

        $this->patchJson("/api/tasks/{$task->id}", ['assignee_id' => $owner->id])
            ->assertOk()
            ->assertJsonPath('data.assignee.name', $owner->name);
    }

    public function test_tasks_cannot_be_assigned_outside_the_project(): void
    {
        [$owner, , $project] = $this->sharedProject();
        $task = Task::factory()->for($owner)->for($project)->create();
        $ownTask = Task::factory()->for($owner)->create();
        Sanctum::actingAs($owner);

        $this->patchJson("/api/tasks/{$task->id}", ['assignee_id' => User::factory()->create()->id])
            ->assertUnprocessable();
        $this->patchJson("/api/tasks/{$ownTask->id}", ['assignee_id' => $owner->id])
            ->assertUnprocessable();
    }

    public function test_outsiders_cannot_see_or_touch_shared_work(): void
    {
        [$owner, , $project] = $this->sharedProject();
        $task = Task::factory()->for($owner)->for($project)->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/projects/{$project->id}/members")->assertForbidden();
        $this->patchJson("/api/tasks/{$task->id}", ['title' => 'Nope'])->assertForbidden();
        $this->getJson('/api/tasks')->assertJsonCount(0, 'data');
    }

    public function test_members_list_and_leaving(): void
    {
        [$owner, $member, $project] = $this->sharedProject();
        $task = Task::factory()->for($owner)->for($project)->create(['assignee_id' => $member->id]);
        ProjectInvitation::factory()->for($project)->create(['email' => 'waiting@example.com']);
        Sanctum::actingAs($member);

        $this->getJson("/api/projects/{$project->id}/members")
            ->assertOk()
            ->assertJsonPath('owner.id', $owner->id)
            ->assertJsonPath('members.0.id', $member->id)
            ->assertJsonPath('invitations.0.email', 'waiting@example.com');

        $this->deleteJson("/api/projects/{$project->id}/members/{$member->id}")->assertOk();

        $this->assertFalse($project->isAccessibleBy($member));
        $this->assertNull($task->fresh()->assignee_id);
    }

    public function test_members_cannot_remove_others_or_delete_the_project(): void
    {
        [$owner, $member, $project] = $this->sharedProject();
        Sanctum::actingAs($member);

        $this->deleteJson("/api/projects/{$project->id}/members/{$owner->id}")->assertForbidden();
        $this->deleteJson("/api/projects/{$project->id}")->assertForbidden();
    }

    public function test_owner_cancels_a_pending_invitation(): void
    {
        [$owner, , $project] = $this->sharedProject();
        $invitation = ProjectInvitation::factory()->for($project)->create();
        Sanctum::actingAs($owner);

        $this->deleteJson("/api/projects/{$project->id}/invitations/{$invitation->id}")->assertOk();
        $this->assertModelMissing($invitation);
    }
}
