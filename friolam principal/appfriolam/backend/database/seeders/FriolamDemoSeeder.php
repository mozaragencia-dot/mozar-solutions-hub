<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Subclient;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class FriolamDemoSeeder extends Seeder
{
    public function run(): void
    {
        $tech = User::firstOrCreate(['email' => 'tecnico@friolam.cl'], [
            'name' => 'Técnico Demo',
            'password' => bcrypt('secret123'),
            'role' => 'technician',
        ]);

        $client = Client::firstOrCreate(['name' => 'Cliente Demo']);
        $sub = Subclient::firstOrCreate([
            'client_id' => $client->id,
            'local_name' => 'Local Centro',
        ], [
            'address' => 'Av. Principal 123',
            'city' => 'Santiago',
            'phone' => '+56911111111',
        ]);

        Service::firstOrCreate(['ticket' => 'TK-1001'], [
            'service_name' => 'Mantención Postmix Preventiva',
            'client_id' => $client->id,
            'subclient_id' => $sub->id,
            'technician_id' => $tech->id,
            'status' => 1,
            'scheduled_date' => now()->toDateString(),
        ]);
    }
}
