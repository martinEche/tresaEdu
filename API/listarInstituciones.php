<?php
require_once __DIR__ . '/config_cors.php';
//headers

header("Content-Type: text/html; charset=utf-8");

//conexion a base de datos
include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

//recupero de informacion
$method = $_SERVER['REQUEST_METHOD'];
$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
$modo = $dataObject-> modo;

if($modo=='listarInstituciones'){
    $sql="SELECT * FROM institucion";
}
if($modo==='buscarServicios'){
    $id = $dataObject->id;
     //busco servicios
    $sql = "SELECT id.id, id.fecha_activacion, fm.funcionalidad as fun, m.modulo FROM institucion_data as id, funcionalidad_modulo as fm, modulos as m WHERE id.funcionalidad = fm.id and fm.id_modulo=m.id_modulo and id.id_institucion='$id' order by fm.id_modulo";
}
if($modo=='datosInstitucion'){
    $id = $dataObject->id;
    $sql="SELECT * FROM institucion where id=".$id;
}

if ($nueva_consulta = $conexion->prepare($sql)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    if ($resultado->num_rows >= 1) {
       // $datos = $resultado->fetch_assoc();
        echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
    }else {
        echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
    }
}else{
       echo json_encode(array('resultado'=>false, 'error' => 'No se pudo conectar a BD'));
}
$nueva_consulta -> close();
$conexion->close();
?>