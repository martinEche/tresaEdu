<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); 

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php

$mensajes = $dataObject-> buscar;
$tabla = $dataObject-> tabla;
        
if ($nueva_consulta = $conexion->prepare("SELECT * FROM {$tabla} WHERE (apellido like '%{$buscar}%') or (nombre like '%{$buscar}%') or (dni like '%{$buscar}%')")) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    if ($resultado->num_rows >= 1) {
        $datos = $resultado->fetch_assoc();
        echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
    }else {
        echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
    }
    $nueva_consulta->close();
}else{
   
    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo conectar a BD'));
}
$conexion->close();
?>