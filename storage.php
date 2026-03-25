<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$storageFile = __DIR__ . '/data/storage.json';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if (!file_exists($storageFile)) {
        echo json_encode(new stdClass());
        exit;
    }

    $content = file_get_contents($storageFile);
    if ($content === false || trim($content) === '') {
        echo json_encode(new stdClass());
        exit;
    }

    echo $content;
    exit;
}

if ($method === 'POST') {
    $payload = file_get_contents('php://input') ?: '';
    json_decode($payload, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    if (!is_dir(dirname($storageFile))) {
        mkdir(dirname($storageFile), 0775, true);
    }

    $written = file_put_contents($storageFile, $payload, LOCK_EX);
    if ($written === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Unable to write storage file']);
        exit;
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
