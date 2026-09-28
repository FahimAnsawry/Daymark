<x-mail::message>
# Join “{{ $invitation->project->name }}”

{{ $invitation->inviter->name }} would like to plan “{{ $invitation->project->name }}” together with you in Daymark. You'll both see its tasks, and can add, finish and assign them.

<x-mail::button :url="$acceptUrl">
Join the project
</x-mail::button>

You'll need a Daymark account with this email address ({{ $invitation->email }}). Any plan works, including Free.<br>
{{ config('app.name') }}
</x-mail::message>
