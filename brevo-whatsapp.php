<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$apiKey = getenv('BREVO_API_KEY') ?: '';
$enabled = strtolower(trim((string)(getenv('BREVO_WHATSAPP_ENABLED') ?: 'false'))) === 'true';
$senderNumber = trim((string)(getenv('BREVO_WHATSAPP_SENDER') ?: ''));

if (!$enabled) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Brevo WhatsApp disabled']);
    exit;
}

if ($apiKey === '' || $senderNumber === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Brevo WhatsApp config missing']);
    exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

$toPhone = trim((string)($payload['toPhone'] ?? ''));
$textContent = trim((string)($payload['textContent'] ?? ''));
if ($toPhone === '' || $textContent === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing WhatsApp payload fields']);
    exit;
}

$brevoPayload = [
    'senderNumber' => $senderNumber,
    'contactNumbers' => [$toPhone],
    'text' => $textContent,
];

$ch = curl_init('https://api.brevo.com/v3/whatsapp/sendMessage');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'accept: application/json',
        'api-key: ' . $apiKey,
        'content-type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($brevoPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => $curlError !== '' ? $curlError : 'Brevo request failed']);
    exit;
}

http_response_code($statusCode >= 200 && $statusCode < 300 ? 200 : $statusCode);
echo $response;
