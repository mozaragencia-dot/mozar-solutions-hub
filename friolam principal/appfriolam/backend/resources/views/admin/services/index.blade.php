@extends('layouts.admin')

@section('content')
<div class="container py-3">
  <h1 class="mb-3">Servicios técnicos</h1>

  <form class="row g-2 mb-3" method="GET">
    <div class="col-md-3">
      <select class="form-select" name="status">
        <option value="">Todos los estados</option>
        <option value="0">Nuevo</option>
        <option value="1">Asignado</option>
        <option value="2">En proceso</option>
        <option value="3">Pendiente validación</option>
        <option value="4">Terminado parcial</option>
        <option value="5">Terminado final</option>
      </select>
    </div>
    <div class="col-md-3">
      <select class="form-select" name="technician_id">
        <option value="">Todos los técnicos</option>
        @foreach($technicians as $tech)
          <option value="{{ $tech->id }}">{{ $tech->name }}</option>
        @endforeach
      </select>
    </div>
    <div class="col-md-2"><button class="btn btn-primary w-100">Filtrar</button></div>
  </form>

  <div class="table-responsive">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>#</th><th>Servicio</th><th>Cliente</th><th>Local</th><th>Técnico</th><th>Estado</th><th></th>
        </tr>
      </thead>
      <tbody>
      @foreach($services as $s)
        <tr>
          <td>{{ $s->id }}</td>
          <td>{{ $s->service_name }}</td>
          <td>{{ $s->client->name ?? '-' }}</td>
          <td>{{ $s->subclient->local_name ?? '-' }}</td>
          <td>{{ $s->technician->name ?? 'Sin asignar' }}</td>
          <td>{{ $s->status }}</td>
          <td><a class="btn btn-sm btn-outline-primary" href="{{ route('admin.services.view', $s) }}">Ver</a></td>
        </tr>
      @endforeach
      </tbody>
    </table>
  </div>

  {{ $services->links() }}
</div>
@endsection
