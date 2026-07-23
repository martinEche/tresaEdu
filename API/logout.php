<?php
require_once __DIR__ . '/config_cors.php';
include "conectar.php";

// Destruir la cookie seteando su expiración en el pasado
setcookie("sessionToken", "", [
    'expires' => time() - 3600,
    'path' => '/',
    'secure' => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);

echo json_encode(['ok' => true, 'msg' => 'Sesión cerrada y cookie eliminada.']);
exit;
