<?php

namespace App\Enums;

enum ServiceStatus: int
{
    case NEW = 0;
    case ASSIGNED = 1;
    case IN_PROGRESS = 2;
    case PENDING_VALIDATION = 3;
    case PARTIAL_DONE = 4;
    case FINAL_DONE = 5;

    public function label(): string
    {
        return match ($this) {
            self::NEW => 'Nuevo',
            self::ASSIGNED => 'Asignado',
            self::IN_PROGRESS => 'En proceso',
            self::PENDING_VALIDATION => 'Pendiente validación',
            self::PARTIAL_DONE => 'Terminado parcial',
            self::FINAL_DONE => 'Terminado final',
        };
    }
}
