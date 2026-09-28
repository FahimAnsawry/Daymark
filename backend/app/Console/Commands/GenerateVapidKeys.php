<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

#[Signature('daymark:vapid-keys')]
#[Description('Generate the VAPID key pair that signs browser push notifications')]
class GenerateVapidKeys extends Command
{
    public function handle(): int
    {
        $keys = VAPID::createVapidKeys();

        $this->line('Add these to your .env file:');
        $this->newLine();
        $this->line("VAPID_PUBLIC_KEY={$keys['publicKey']}");
        $this->line("VAPID_PRIVATE_KEY={$keys['privateKey']}");

        return self::SUCCESS;
    }
}
