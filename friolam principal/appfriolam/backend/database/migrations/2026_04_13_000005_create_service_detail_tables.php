<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->string('path');
            $table->string('type')->default('general');
            $table->timestamps();
        });

        Schema::create('service_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->string('technician_signature_path')->nullable();
            $table->string('client_signature_path')->nullable();
            $table->string('receiver_name')->nullable();
            $table->string('receiver_role')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('service_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('changed_by')->constrained('users')->cascadeOnDelete();
            $table->tinyInteger('from_status');
            $table->tinyInteger('to_status');
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_status_logs');
        Schema::dropIfExists('service_signatures');
        Schema::dropIfExists('service_photos');
    }
};
