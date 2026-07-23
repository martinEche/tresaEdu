<?php
// test_email.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config_cors.php';
include __DIR__ . '/conectar.php';
require_once __DIR__ . '/enviar_email.php';

header('Content-Type: application/json; charset=utf-8');

$conexion = conectarDB();
if (!$conexion) {
    echo json_encode(['error' => 'No database connection']);
    exit;
}

$username = $_GET['usuario'] ?? '';
if (empty($username)) {
    echo json_encode(['error' => 'Debe especificar el parámetro ?usuario=XYZ']);
    exit;
}

$sql = "
    SELECT u.id, u.usuario, up.email, u.nombre, u.apellido
    FROM usuarios u
    LEFT JOIN usuario_perfil up ON u.id = up.id_usuario
    WHERE u.usuario = ?
    LIMIT 1
";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(['error' => 'Query preparation failed: ' . $conexion->error]);
    exit;
}

$stmt->bind_param('s', $username);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

$email = $user['email'] ?? '';
if (empty($email)) {
    echo json_encode(['error' => 'El usuario no tiene correo registrado en usuario_perfil', 'user' => $user]);
    exit;
}

$asunto = "Prueba de correo desde Plataforma";
$cuerpo = "Hola " . htmlspecialchars($user['nombre'] . ' ' . $user['apellido']) . ", esto es una prueba del sistema de correos.";
$html = obtenerPlantillaEmail("Prueba de Correo", $cuerpo, obtenerFrontendUrlDinamico());

$sent = enviarEmailPlataforma($email, $asunto, $html);

echo json_encode([
    'success' => $sent,
    'destinatario' => $email,
    'info_usuario' => [
        'id' => $user['id'],
        'usuario' => $user['usuario'],
        'nombre' => $user['nombre'],
        'apellido' => $user['apellido'],
        'email' => $email
    ]
]);
?>
