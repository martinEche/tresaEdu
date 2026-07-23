<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;

switch($method){
    case 'GET':
        $sql="SELECT 
                rm.id,
                ro.nombre AS rol_origen_nombre, rm.rol_origen,
                rd.nombre AS rol_destino_nombre, rm.rol_destino,
                rm.noPermitido
            FROM rol_mensajeria rm
            JOIN roles ro ON ro.id = rm.rol_origen
            JOIN roles rd ON rd.id = rm.rol_destino";

        if ($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $resultado = $nueva_consulta->get_result();
            if ($resultado->num_rows >= 1) {
                echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
            }else {
                 echo json_encode([]);
            }
        }else{
               echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
        }
        $conexion->close();
        break;

    case 'POST':  
        $rol_origen= $_POST['rol_origen'];
        $rol_destino= $_POST['rol_destino'];
        $noPermitido = $_POST['noPermitido'];
        $sql="INSERT INTO rol_mensajeria( rol_origen, rol_destino, noPermitido) VALUES ($rol_origen, $rol_destino, $noPermitido)";
 
        if ($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $respuesta = ['success','Rol agregado'];
        }else{
            $respuesta = ['error','fallo al agregar el rol'];
        }
        echo json_encode($respuesta); 
        break;
    case 'PUT':
        break;
    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $sql = "DELETE FROM rol_mensajeria WHERE id = $id"; 
        if ($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $respuesta = ['success','Regla eliminada'];
        }else{
            $respuesta = ['error','fallo al eliminar la regla'];
        }
        echo json_encode($respuesta);
        break;
}
?>