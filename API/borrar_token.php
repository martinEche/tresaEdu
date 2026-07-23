<?php
require_once __DIR__ . '/config_cors.php';
header('Content-Type: application/json; charset=utf-8');

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken();

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');
if (!$conexion) {
    http_response_code(500);
    error_log("Error conexión DB");
    echo json_encode(['error' => true, 'msg' => 'Error conexión DB']);
    exit;
}

// Obtener el token FCM a borrar. 
// Soportamos tanto form-data ($_POST) como JSON raw body.
$token = trim($_POST['token'] ?? '');
if (!$token) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    $token = trim($data['token'] ?? '');
}

if (!$token) {
    http_response_code(400);
    error_log("Falta el token FCM a borrar");
    echo json_encode([
        'error' => true,
        'msg'   => 'Falta el token a eliminar'
    ]);
    exit;
}

// Por seguridad, forzamos a que el usuario solo pueda borrar tokens asociados a su propia cuenta
$usuario_id = $tokenData->id;

// Borrado de token
$stmt = $conexion->prepare("DELETE FROM fcm_tokens WHERE token = ? AND usuario_id = ?");
if (!$stmt) {
    http_response_code(500);
    error_log("Error prepare DELETE: " . $conexion->error);
    echo json_encode(['error' => true, 'msg' => 'Error SQL DELETE']);
    exit;
}

$stmt->bind_param("si", $token, $usuario_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode([
        'ok'  => true,
        'msg' => 'Token eliminado correctamente'
    ]);
} else {
    echo json_encode([
        'ok'  => true,
        'msg' => 'El token no se encontró o ya estaba eliminado'
    ]);
}
