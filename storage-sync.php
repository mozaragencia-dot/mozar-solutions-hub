<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$storageFile = __DIR__ . '/storage-data.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!is_file($storageFile)) {
        echo json_encode(['ok' => true, 'data' => null]);
        exit;
    }

    $raw = file_get_contents($storageFile);
    if ($raw === false || trim($raw) === '') {
        echo json_encode(['ok' => true, 'data' => null]);
        exit;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Stored data is invalid']);
        exit;
    }

    echo json_encode(['ok' => true, 'data' => $decoded], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    $allowed = ['clients', 'bookings', 'lawyers', 'profiles'];
    $clean = [];
    foreach ($allowed as $key) {
        $clean[$key] = isset($payload[$key]) && is_array($payload[$key]) ? $payload[$key] : [];
    }
    $clean['updatedAt'] = gmdate('c');

    $encoded = json_encode($clean, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($encoded === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not encode data']);
        exit;
    }

    $result = file_put_contents($storageFile, $encoded . PHP_EOL, LOCK_EX);
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not persist data']);
        exit;
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
