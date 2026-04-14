<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = ['name', 'tax_id', 'email', 'phone', 'notes'];

    public function subclients(): HasMany { return $this->hasMany(Subclient::class); }
}
