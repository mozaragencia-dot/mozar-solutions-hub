<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceStatusLog extends Model
{
    protected $fillable = ['service_id', 'changed_by', 'from_status', 'to_status', 'comment'];
}
