<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

include "conectar.php";
$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php

//$tutor_id = $_POST['tutor_id'];
//$estudiante_id = $_POST['estudiante_id'];
$tutor_id = $dataObject->tutor_id;
$estudiante_id = $dataObject->estudiante_id;

$query = "SELECT * FROM vinculo WHERE id_tutor = ? AND id_estudiante = ?";

if ($nueva_consulta = $conexion->prepare($query)) {
    $nueva_consulta->bind_param("ii", $tutor_id, $estudiante_id);
    $nueva_consulta->execute();
    $result = $nueva_consulta->get_result();
    $response = ["vinculado" => $result->num_rows > 0];
}else{
    $response = ["vinculado" =>false];
}

echo json_encode($response);
?>
