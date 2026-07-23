<?php
require_once __DIR__ . '/config_env.php';

// Permitir acceso desde orígenes específicos definidos en config_env.php
$origen = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if ($origen !== '') {
    if (in_array($origen, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origen");
    } else {
        // Bloqueo estricto para navegadores ajenos
        http_response_code(403);
        die(json_encode(['error' => 'Acceso denegado por politica CORS. Origen no autorizado.']));
    }
} else {
    // Clientes móviles (Flutter) o peticiones backend (Postman) no envían cabecera Origin permitimos que pasen.
    header("Access-Control-Allow-Origin: " . ALLOWED_ORIGINS[0]); 
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Allow: GET, POST, OPTIONS, PUT, DELETE");

// Manejo automático de peticiones preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
