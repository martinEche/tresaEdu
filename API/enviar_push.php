<?php
require_once __DIR__ . '/config_cors.php';
require_once __DIR__ . '/vendor/autoload.php';

use Google\Client as GoogleClient;

function enviarPushFirebase($token, $title, $body, $dataPayload = null) {
    $serviceAccountPath = __DIR__ . '/firebase_service_account.json';

    if (!file_exists($serviceAccountPath)) {
        return ['error' => 'Archivo de credenciales de Firebase no encontrado'];
    }

    $serviceAccountContent = json_decode(file_get_contents($serviceAccountPath), true);
    $projectId = $serviceAccountContent['project_id'];

    // Caché del Access Token en un archivo temporal (Lo ideal seria tenerlo en redis pero funciona bien esto)
    $tokenCacheFile = __DIR__ . '/firebase_token_cache.json';
    $accessToken = null;

    if (file_exists($tokenCacheFile)) {
        $cache = json_decode(file_get_contents($tokenCacheFile), true);
        if (isset($cache['access_token']) && isset($cache['expires_at']) && $cache['expires_at'] > (time() + 60)) {
            $accessToken = $cache['access_token'];
        }
    }

    if (!$accessToken) {
        try {
            $client = new GoogleClient();
            $client->setAuthConfig($serviceAccountPath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $tokenInfo = $client->fetchAccessTokenWithAssertion();
            
            if (isset($tokenInfo['access_token'])) {
                $accessToken = $tokenInfo['access_token'];
                file_put_contents($tokenCacheFile, json_encode([
                    'access_token' => $accessToken,
                    'expires_at' => time() + ($tokenInfo['expires_in'] ?? 3600)
                ]));
            } else {
                throw new Exception("No se pudo obtener el token de acceso");
            }
        } catch (Exception $e) {
            return ['error' => 'Error de autenticación con Firebase', 'details' => $e->getMessage()];
        }
    }

    $message = [
        'token' => $token,
        'notification' => [
            'title' => $title,
            'body'  => $body,
            'image' => 'https://www.institutopetitdemeurville.com.ar/API/ConfigArchivos/logo.png'
        ],
        'android' => [
            'priority' => 'high',
            'notification' => [
                'color' => '#1b2a4e', 
                'sound' => 'default', 
                'default_vibrate_timings' => true, 
                'notification_priority' => 'PRIORITY_MAX'
            ]
        ],
        'apns' => [
            'payload' => [
                'aps' => [
                    'sound' => 'default',
                    'badge' => 1,
                    'mutable-content' => 1
                ]
            ]
        ]
    ];

    if ($dataPayload !== null) {
        $message['data'] = $dataPayload;
    }

    $payload = ['message' => $message];
    $url = "https://fcm.googleapis.com/v1/projects/$projectId/messages:send";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 10
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['error' => 'Error de red conectando a FCM', 'details' => $curlError];
    }

    return [
        'http_code' => $httpCode,
        'firebase_response' => json_decode($response, true) ?? $response
    ];
}

// Si el archivo es invocado directamente vía HTTP (no incluido)
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    header('Content-Type: application/json');
    $token = $_POST['token'] ?? null;
    $title = $_POST['title'] ?? 'Nuevo mensaje';
    $body  = $_POST['body'] ?? 'Tenés un mensaje nuevo';
    
    // Controlar tamaño del archivo debug
    $debugFile = __DIR__ . '/debug_request.txt';
    if (file_exists($debugFile) && filesize($debugFile) > 5 * 1024 * 1024) {
        unlink($debugFile); 
    }
    file_put_contents(
      $debugFile,
      date('Y-m-d H:i:s') . "\n" .
      "POST:\n" . print_r($_POST, true) . "\n" .
      "RAW:\n" . file_get_contents("php://input") . "\n\n",
      FILE_APPEND
    );

    $dataPayload = null;
    if (isset($_POST['data'])) {
        $decoded = json_decode($_POST['data'], true);
        if (is_array($decoded)) {
            $dataPayload = [];
            foreach ($decoded as $key => $value) {
                $dataPayload[(string)$key] = is_array($value) ? json_encode($value) : (string)$value;
            }
        }
    }

    if (!$token) {
        http_response_code(400);
        echo json_encode(['error' => 'Token requerido']);
        exit;
    }

    $resultado = enviarPushFirebase($token, $title, $body, $dataPayload);
    
    if (isset($resultado['error'])) {
        http_response_code(500);
    }
    echo json_encode($resultado);
}
