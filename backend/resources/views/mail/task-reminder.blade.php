<x-mail::message>
# {{ $task->title }}

@if ($when !== '')
{{ $when }}
@endif

A small nudge, as you asked. If now isn't the moment, that's fine too.

<x-mail::button :url="$dashboardUrl">
Open today's plan
</x-mail::button>

You can change quiet hours and reminders in Daymark's reminder settings.<br>
{{ config('app.name') }}
</x-mail::message>
