<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A reminder is now "when" (`reminder`) plus how often it repeats
     * (`reminder_frequency`, null for once). Frequencies used to be stored as the
     * reminder itself, reminding at the due time, so they become "at" + frequency.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('reminder_frequency')->nullable()->after('reminder');
        });

        foreach (['daily', 'weekly', 'monthly'] as $frequency) {
            DB::table('tasks')->where('reminder', $frequency)->update([
                'reminder' => 'at',
                'reminder_frequency' => $frequency,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['daily', 'weekly', 'monthly'] as $frequency) {
            DB::table('tasks')->where('reminder_frequency', $frequency)->update(['reminder' => $frequency]);
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('reminder_frequency');
        });
    }
};
