<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint (obliga a tener token)

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;

switch($method){
    case 'GET':
        
        $sql="SELECT * FROM espacio group by id_formacion, orden";
        
        if ($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $resultado = $nueva_consulta->get_result();
            if ($resultado->num_rows >= 1) {
                echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
            }else {
                echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
            }
        }else{
               echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
        }
        $conexion->close();
        break;

    case 'POST':   
        break;

    case 'PUT':
        break;

    case 'DELETE';
    break;
}