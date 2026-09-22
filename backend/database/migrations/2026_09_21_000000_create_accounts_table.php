<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('provider_id')->nullable();
            $table->string('password_hash')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'provider']);
            $table->unique(['provider', 'provider_id']);
        });

        DB::table('users')
            ->whereNotNull('password')
            ->orderBy('id')
            ->eachById(function (object $user): void {
                DB::table('accounts')->insert([
                    'user_id' => $user->id,
                    'provider' => 'password',
                    'password_hash' => $user->password,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable();
        });

        DB::table('accounts')
            ->where('provider', 'password')
            ->orderBy('id')
            ->eachById(function (object $account): void {
                DB::table('users')->where('id', $account->user_id)->update([
                    'password' => $account->password_hash,
                ]);
            });

        Schema::dropIfExists('accounts');
    }
};
