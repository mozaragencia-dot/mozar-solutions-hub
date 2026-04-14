<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicianServiceController extends Controller
{
    public function myServices(Request $request): JsonResponse
    {
        $services = Service::with(['client', 'subclient'])
            ->where('technician_id', $request->user()->id)
            ->orderByDesc('scheduled_date')
            ->get();

        return response()->json($services);
    }

    public function updateForm(Request $request, Service $service): JsonResponse
    {
        abort_unless($service->technician_id === $request->user()->id, 403);

        $data = $request->validate([
            'client_phone' => ['nullable', 'string', 'max:50'],
            'fantasy_name' => ['nullable', 'string', 'max:255'],
            'maintenance_data' => ['nullable', 'array'],
            'postmix_data' => ['nullable', 'array'],
            'observations' => ['nullable', 'string'],
        ]);

        // Regla: técnico solo puede editar datos variables definidos + formularios técnicos.
        $service->update($data);

        return response()->json(['message' => 'Servicio actualizado', 'service' => $service->fresh()]);
    }

    public function changeStatus(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'id_service' => ['required', 'integer', 'exists:services,id'],
            'status' => ['required', 'integer', 'between:0,5'],
            'comment' => ['nullable', 'string'],
        ]);

        $service = Service::findOrFail($payload['id_service']);
        abort_unless($service->technician_id === $request->user()->id, 403);

        $from = $service->status;
        $service->update(['status' => $payload['status']]);
        $service->statusLogs()->create([
            'changed_by' => $request->user()->id,
            'from_status' => $from,
            'to_status' => $payload['status'],
            'comment' => $payload['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Estado actualizado',
            'id_service' => $service->id,
            'status' => $service->status,
        ]);
    }
}
