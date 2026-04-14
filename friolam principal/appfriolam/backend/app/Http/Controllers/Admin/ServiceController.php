<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): View
    {
        $query = Service::with(['client', 'subclient', 'technician']);

        if ($request->filled('status')) $query->where('status', $request->integer('status'));
        if ($request->filled('technician_id')) $query->where('technician_id', $request->integer('technician_id'));
        if ($request->filled('client_id')) $query->where('client_id', $request->integer('client_id'));

        $services = $query->orderByDesc('scheduled_date')->paginate(20);
        $technicians = User::where('role', 'technician')->get();

        return view('admin.services.index', compact('services', 'technicians'));
    }

    public function view(Service $service): View
    {
        $service->load(['client', 'subclient', 'technician', 'machines', 'photos', 'statusLogs']);
        return view('admin.services.view', compact('service'));
    }
}
