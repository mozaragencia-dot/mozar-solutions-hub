@extends('layouts.admin')

@section('content')
<div class="container py-3">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1>Servicio #{{ $service->id }}</h1>
    <a href="{{ url('/Services/view/' . $service->id) }}" class="btn btn-danger">Ver PDF</a>
  </div>

  <div class="card mb-3">
    <div class="card-body">
      <h5>Datos base</h5>
      <p><strong>Cliente:</strong> {{ $service->client->name ?? '-' }}</p>
      <p><strong>Local:</strong> {{ $service->subclient->local_name ?? '-' }}</p>
      <p><strong>Dirección:</strong> {{ $service->subclient->address ?? '-' }}</p>
      <p><strong>Teléfono:</strong> {{ $service->client_phone }}</p>
      <p><strong>Nombre fantasía:</strong> {{ $service->fantasy_name }}</p>
      <p><strong>Estado:</strong> {{ $service->status }}</p>
    </div>
  </div>

  <div class="card mb-3">
    <div class="card-body">
      <h5>Postmix</h5>
      <pre class="mb-0">{{ json_encode($service->postmix_data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) }}</pre>
    </div>
  </div>
</div>
@endsection
