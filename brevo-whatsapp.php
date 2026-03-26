<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$apiKey = getenv('BREVO_API_KEY') ?: '';
$senderNumber = getenv('BREVO_WHATSAPP_SENDER_NUMBER') ?: '';
$templateId = getenv('BREVO_WHATSAPP_TEMPLATE_ID') ?: '';

if ($apiKey === '' || $senderNumber === '') {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Brevo WhatsApp config missing. Define BREVO_API_KEY and BREVO_WHATSAPP_SENDER_NUMBER'
    ]);
    exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

$text = trim((string)($payload['text'] ?? ''));
$numbersRaw = $payload['contactNumbers'] ?? [];
$numbers = [];

if (is_string($numbersRaw) && $numbersRaw !== '') {
    $numbersRaw = [$numbersRaw];
}

if (is_array($numbersRaw)) {
    foreach ($numbersRaw as $candidate) {
        $digits = preg_replace('/\D+/', '', (string)$candidate);
        if ($digits !== '') {
            $numbers[$digits] = true;
        }
    }
}

$contacts = array_keys($numbers);
if ($text === '' || count($contacts) === 0) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing text or contact numbers']);
    exit;
}

$results = [];
$allOk = true;

foreach ($contacts as $contactNumber) {
    $brevoPayload = [
        'senderNumber' => $senderNumber,
        'contactNumbers' => [$contactNumber],
        'text' => $text,
    ];

    if ($templateId !== '') {
        $brevoPayload['templateId'] = (int)$templateId;
    }

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

    $ok = ($response !== false && $statusCode >= 200 && $statusCode < 300);
    if (!$ok) {
        $allOk = false;
    }

    $results[] = [
        'contactNumber' => $contactNumber,
        'statusCode' => $statusCode,
        'ok' => $ok,
        'error' => $response === false ? ($curlError !== '' ? $curlError : 'Brevo request failed') : null,
        'response' => $response,
    ];
}

http_response_code($allOk ? 200 : 502);
echo json_encode([
    'ok' => $allOk,
    'results' => $results,
]);
