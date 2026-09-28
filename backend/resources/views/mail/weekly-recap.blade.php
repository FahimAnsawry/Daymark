<x-mail::message>
# Your week, {{ $user->name }}

@if ($recap['completed'] === 0)
This week was a quiet one in Daymark, and that's okay. Rest counts too. Whenever you're ready, next week is a fresh page.
@else
Here's what you made room for between {{ \Carbon\CarbonImmutable::parse($recap['from'])->format('M j') }} and {{ \Carbon\CarbonImmutable::parse($recap['to'])->format('M j') }}.

You finished **{{ $recap['completed'] }} {{ Str::plural('thing', $recap['completed']) }}** across {{ $recap['days_with_progress'] }} {{ Str::plural('day', $recap['days_with_progress']) }}.

@if (count($recap['by_project']) > 0)
<x-mail::table>
| Where your time went | Done |
|:---------------------|-----:|
@foreach ($recap['by_project'] as $row)
| {{ $row['project'] === '' ? 'No project' : $row['project'] }} | {{ $row['completed'] }} |
@endforeach
</x-mail::table>
@endif
@endif

<x-mail::button :url="$dashboardUrl">
Plan the week ahead
</x-mail::button>

You can turn these emails off in your billing settings.<br>
{{ config('app.name') }}
</x-mail::message>
