<x-mail::message>
@if ($kind === 'morning')
# Good morning, {{ $user->name }}

@if (count($digest['tasks']) === 0)
Nothing is planned for today yet. Plenty of room.
@else
Here's what you planned for today:

@foreach ($digest['tasks'] as $title)
- {{ $title }}
@endforeach
@endif

@if ($digest['overdue'] > 0)
{{ $digest['overdue'] }} earlier {{ Str::plural('task', $digest['overdue']) }} can wait for a better moment, or be let go.
@endif
@else
# Time to wind down, {{ $user->name }}

@if ($digest['done_today'] > 0)
You finished {{ $digest['done_today'] }} {{ Str::plural('thing', $digest['done_today']) }} today. That's enough.
@else
Some days are for other things. That's enough too.
@endif

@if (count($digest['tasks']) > 0)
Waiting for tomorrow:

@foreach ($digest['tasks'] as $title)
- {{ $title }}
@endforeach
@endif
@endif

<x-mail::button :url="$dashboardUrl">
Open Daymark
</x-mail::button>

You can turn these emails off in Daymark's reminder settings.<br>
{{ config('app.name') }}
</x-mail::message>
