<?php
require_once __DIR__ . '/config_cors.php';
header('Content-Type: application/json; charset=utf-8');

// ============================
// CONEXIÓN
// ============================
include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');
if (!$conexion) {
    http_response_code(500);
    error_log("Error conexión DB");
    echo json_encode(['error' => true, 'msg' => 'Error conexión DB']);
    exit;
}

$conexion->set_charset('utf8');

// ============================
// INPUT
// ============================
$usuario_id = $tokenData->id;
$token      = trim($_POST['token'] ?? ''); // Token fcm
$platform   = $_POST['platform'] ?? 'android';

error_log("Datos recibidos: usuario_id=$usuario_id, platform=$platform");
error_log("Token: " . substr($token, 0, 20) . "...");

// ============================
// VALIDACIÓN
// ============================
if (!$token || !$usuario_id) {
    http_response_code(400);
    error_log("Token o usuario inválido");
    echo json_encode([
        'error' => true,
        'msg'   => 'Token o usuario inválido',
        'debug' => compact('usuario_id', 'platform')
    ]);
    exit;
}

// ============================
// BUSCAR TOKEN
// ============================
$stmt = $conexion->prepare("SELECT id FROM fcm_tokens WHERE token = ?");
if (!$stmt) {
    http_response_code(500);
    error_log("Error prepare SELECT: " . $conexion->error);
    echo json_encode(['error' => true, 'msg' => 'Error SQL SELECT']);
    exit;
}

$stmt->bind_param("s", $token);
$stmt->execute();
$res = $stmt->get_result();

// ============================
// UPDATE
// ============================
if ($row = $res->fetch_assoc()) {

    error_log("Token existente, ID=" . $row['id']);

    $upd = $conexion->prepare(
        "UPDATE fcm_tokens 
         SET usuario_id=?, platform=?, actualizado=NOW() 
         WHERE id=?"
    );

    if (!$upd) {
        http_response_code(500);
        error_log("Error prepare UPDATE: " . $conexion->error);
        echo json_encode(['error' => true, 'msg' => 'Error SQL UPDATE']);
        exit;
    }

    $upd->bind_param("isi", $usuario_id, $platform, $row['id']);
    $upd->execute();

    echo json_encode([
        'ok'  => true,
        'msg' => 'Token actualizado'
    ]);

} 
// ============================
// INSERT
// ============================
else {

    error_log("Token nuevo, insertando");

    $ins = $conexion->prepare(
        "INSERT INTO fcm_tokens 
        (usuario_id, token, platform, creado, actualizado)
        VALUES (?, ?, ?, NOW(), NOW())"
    );

    if (!$ins) {
        http_response_code(500);
        error_log("Error prepare INSERT: " . $conexion->error);
        echo json_encode(['error' => true, 'msg' => 'Error SQL INSERT']);
        exit;
    }

    $ins->bind_param("iss", $usuario_id, $token, $platform);
    $ins->execute();

    echo json_encode([
        'ok'  => true,
        'msg' => 'Token guardado'
    ]);
}
