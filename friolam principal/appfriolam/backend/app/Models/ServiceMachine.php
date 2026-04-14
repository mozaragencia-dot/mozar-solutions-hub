<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceMachine extends Model
{
    protected $fillable = [
        'service_id', 'machine_name', 'model', 'serial', 'brand', 'diagnosis',
        'work_performed', 'parts_used', 'observations', 'machine_status'
    ];
}
