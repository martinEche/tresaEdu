<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); 
$dataObject = json_decode($JSONData);    

if($method =='POST' || $method == 'GET' || $method == 'OPTIONS'){
    // Permitir solicitudes preflight OPTIONS si config_cors no las maneja por completo
    if ($method == 'OPTIONS') {
        echo json_encode(["success" => true]);
        exit;
    }

    $id_usuario = isset($dataObject->id) ? intval($dataObject->id) : (isset($_REQUEST['id']) ? intval($_REQUEST['id']) : 0);
    $modo = isset($dataObject->modo) ? $dataObject->modo : (isset($_REQUEST['modo']) ? $_REQUEST['modo'] : '');
    
    if($id_usuario <= 0){
        $respuesta = ['resultado'=>false,'error'=>'El ID no reconoce el usuario'];
    } else {
        if($modo == 'todas las notificaciones'){ 
            $sql = "SELECT id, titulo, desarrollo, tipo, leida, fecha FROM notificaciones WHERE id_usuario = ? ORDER BY fecha DESC";
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id_usuario);
                $stmt->execute();
                $resultado = $stmt->get_result();
                $notificaciones = $resultado->fetch_all(MYSQLI_ASSOC);
                $respuesta = [
                    'resultado' => true, 
                    'data' => $notificaciones, 
                    'notificar' => $notificaciones
                ];
                $stmt->close();
            } else {
                $respuesta = ['resultado'=>false, 'error'=>"fallo la consulta: " . $conexion->error];
            }
        } elseif ($modo == 'contador') {
            $sql = "SELECT COUNT(*) as cantidad FROM notificaciones WHERE id_usuario = ? AND leida = 0";
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id_usuario);
                $stmt->execute();
                $resultado = $stmt->get_result();
                $row = $resultado->fetch_assoc();
                $respuesta = [
                    'resultado' => true,
                    'cantidad' => intval($row['cantidad'] ?? 0)
                ];
                $stmt->close();
            } else {
                $respuesta = ['resultado'=>false, 'error'=>"fallo la consulta: " . $conexion->error];
            }
        } elseif ($modo == 'marcar_leida') {
            $id_notificacion = isset($dataObject->id_notificacion) ? intval($dataObject->id_notificacion) : (isset($_REQUEST['id_notificacion']) ? intval($_REQUEST['id_notificacion']) : 0);
            
            if ($id_notificacion > 0) {
                $sql = "UPDATE notificaciones SET leida = 1 WHERE id = ? AND id_usuario = ?";
                if ($stmt = $conexion->prepare($sql)) {
                    $stmt->bind_param("ii", $id_notificacion, $id_usuario);
                    $stmt->execute();
                    $respuesta = ['resultado' => true, 'mensaje' => 'Notificacion marcada como leida'];
                    $stmt->close();
                } else {
                    $respuesta = ['resultado' => false, 'error' => "fallo la consulta: " . $conexion->error];
                }
            } else {
                // Marcar todas como leídas
                $sql = "UPDATE notificaciones SET leida = 1 WHERE id_usuario = ?";
                if ($stmt = $conexion->prepare($sql)) {
                    $stmt->bind_param("i", $id_usuario);
                    $stmt->execute();
                    $respuesta = ['resultado' => true, 'mensaje' => 'Todas las notificaciones marcadas como leidas'];
                    $stmt->close();
                } else {
                    $respuesta = ['resultado' => false, 'error' => "fallo la consulta: " . $conexion->error];
                }
            }
        } else {
            $respuesta = ['resultado'=>false, 'error'=>'Modo no especificado o no soportado'];
        }
    }
    echo json_encode($respuesta);
}else{
    echo json_encode(['resultado'=>false,'error'=>'Metodo no permitido']);
}

$conexion->close();
?>