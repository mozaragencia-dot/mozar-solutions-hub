<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('service_name');
            $table->string('ticket')->nullable()->index();
            $table->string('invoice')->nullable();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subclient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->tinyInteger('status')->default(0)->index();
            $table->string('service_type')->nullable();
            $table->date('scheduled_date')->nullable()->index();
            $table->time('scheduled_time')->nullable();
            $table->text('observations')->nullable();
            $table->string('client_phone')->nullable();
            $table->string('fantasy_name')->nullable();
            $table->json('maintenance_data')->nullable();
            $table->json('postmix_data')->nullable();
            $table->decimal('total', 12, 2)->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
