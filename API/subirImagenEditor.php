<?php
require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

include "conectar.php";
$conexion = conectarDB();

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['image'])) {
        $file = $_FILES['image'];
        $fileName = time() . '_' . basename($file['name']);
        
        // Sanitizar el nombre del archivo
        $fileName = preg_replace("/[^a-zA-Z0-9_\.-]/", "", $fileName);
        
        $targetDir = __DIR__ . '/uploads/';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        
        $targetFile = $targetDir . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            // Construir URL absoluta dinámica
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
            $host = $_SERVER['HTTP_HOST'];
            $dir = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
            $url = $protocol . $host . $dir . '/uploads/' . $fileName;
            
            echo json_encode([
                'success' => true,
                'url' => $url
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => true, 'msg' => 'Error al mover el archivo subido.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => true, 'msg' => 'No se recibió ninguna imagen.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => true, 'msg' => 'Método HTTP no soportado.']);
}
?>
