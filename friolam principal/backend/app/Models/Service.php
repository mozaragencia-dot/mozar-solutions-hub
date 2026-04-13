<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_name', 'ticket', 'invoice', 'client_id', 'subclient_id', 'technician_id',
        'status', 'service_type', 'scheduled_date', 'scheduled_time', 'observations',
        'client_phone', 'fantasy_name', 'maintenance_data', 'postmix_data', 'total', 'closed_at',
    ];

    protected $casts = [
        'maintenance_data' => 'array',
        'postmix_data' => 'array',
        'scheduled_date' => 'date',
        'closed_at' => 'datetime',
    ];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function subclient(): BelongsTo { return $this->belongsTo(Subclient::class); }
    public function technician(): BelongsTo { return $this->belongsTo(User::class, 'technician_id'); }
    public function machines(): HasMany { return $this->hasMany(ServiceMachine::class); }
    public function photos(): HasMany { return $this->hasMany(ServicePhoto::class); }
    public function statusLogs(): HasMany { return $this->hasMany(ServiceStatusLog::class); }
}
