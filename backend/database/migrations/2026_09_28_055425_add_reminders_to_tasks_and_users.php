<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('reminder')->nullable();
            $table->timestamp('remind_at')->nullable()->index();
            $table->timestamp('reminded_at')->nullable();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('quiet_hours_start', 5)->nullable();
            $table->string('quiet_hours_end', 5)->nullable();
            $table->boolean('morning_digest')->default(false);
            $table->boolean('evening_winddown')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['remind_at']);
            $table->dropColumn(['reminder', 'remind_at', 'reminded_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['quiet_hours_start', 'quiet_hours_end', 'morning_digest', 'evening_winddown']);
        });
    }
};
