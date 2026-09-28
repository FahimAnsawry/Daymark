<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['user_id', 'name']);
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->boolean('done')->default(false);
            $table->date('due_date')->nullable();
            $table->string('due_time', 5)->nullable();
            $table->string('label')->nullable();
            $table->string('repeat')->default('none');
            $table->string('client_id')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'client_id']);
        });

        Schema::create('task_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('completed_on');
            $table->timestamps();

            $table->index(['user_id', 'completed_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_completions');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('projects');
    }
};
