<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A reminder is now always a clock time the person picks ("05:00"), optionally
     * sent 10 minutes early. Older relative reminders become the time they fired at.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('reminder_early')->default(false)->after('reminder');
        });

        DB::table('tasks')
            ->whereIn('reminder', ['at', '10m', '1h', 'morning'])
            ->orderBy('id')
            ->each(function (object $task): void {
                $time = $task->due_time && $task->reminder !== 'morning' ? substr($task->due_time, 0, 5) : '08:00';

                if ($task->reminder === '1h' && $task->due_time) {
                    $time = CarbonImmutable::parse($time)->subHour()->format('H:i');
                }

                DB::table('tasks')->where('id', $task->id)->update([
                    'reminder' => $time,
                    'reminder_early' => $task->reminder === '10m' && $task->due_time,
                ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('reminder_early');
        });
    }
};
