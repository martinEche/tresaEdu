<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config_env.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

function validarToken() {
    $jwt = null;

    // 1. Primero vemos si viene en los headers (Porque la App mobile se comunica via el token por bearer)
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    if ($authHeader) {
        $arr = explode(" ", $authHeader);
        if (count($arr) == 2 && $arr[0] == 'Bearer') {
            $jwt = $arr[1];
        }
    }

    // 2. Si no hay encabezado, intentamos leer la Cookie HttpOnly para la web.
    if (!$jwt) {
        $jwt = $_COOKIE['sessionToken'] ?? null;
    }

    if (!$jwt) {
        http_response_code(401);
        echo json_encode(["error" => "No se encontró el token de sesión.", "debug_cookies" => $_COOKIE, "debug_auth_header" => $authHeader]);
        exit;
    }

    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET_KEY, 'HS256'));

        if ($decoded->iss !== JWT_ISSUER) {
            throw new Exception("Emisor inválido");
        }
        return $decoded->data;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["error" => "Acceso denegado. Token inválido o expirado."]);
        exit;
    }
}
?>
