<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subclient extends Model
{
    protected $fillable = [
        'client_id', 'local_name', 'fantasy_name', 'address', 'district', 'city',
        'phone', 'email', 'channel', 'notes'
    ];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
}
