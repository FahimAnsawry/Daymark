<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('daymark:send-weekly-recaps')->hourly()->withoutOverlapping();
Schedule::command('daymark:send-digests')->hourly()->withoutOverlapping();
Schedule::command('daymark:send-reminders')->everyMinute()->withoutOverlapping();
