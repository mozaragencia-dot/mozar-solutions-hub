<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$apiKey = getenv('BREVO_API_KEY') ?: '';
$senderEmail = getenv('BREVO_SENDER_EMAIL') ?: '';
$senderName = getenv('BREVO_SENDER_NAME') ?: 'TACAM';
$replyToEmail = getenv('BREVO_REPLY_TO_EMAIL') ?: '';
$replyToName = getenv('BREVO_REPLY_TO_NAME') ?: $senderName;

if ($apiKey === '' || $senderEmail === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Brevo server config missing']);
    exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

$toEmail = trim((string)($payload['toEmail'] ?? ''));
$toName = trim((string)($payload['toName'] ?? 'Cliente'));
$subject = trim((string)($payload['subject'] ?? ''));
$textContent = trim((string)($payload['textContent'] ?? ''));

if ($toEmail === '' || $subject === '' || $textContent === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing email payload fields']);
    exit;
}

$brevoPayload = [
    'sender' => [
        'name' => $senderName,
        'email' => $senderEmail,
    ],
    'to' => [[
        'email' => $toEmail,
        'name' => $toName,
    ]],
    'subject' => $subject,
    'textContent' => $textContent,
];

if ($replyToEmail !== '') {
    $brevoPayload['replyTo'] = [
        'email' => $replyToEmail,
        'name' => $replyToName,
    ];
}

$ch = curl_init('https://api.brevo.com/v3/smtp/email');
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
