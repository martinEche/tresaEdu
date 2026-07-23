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
        if(isset($_GET['id_cohorte'])) {
            $id_cohorte = (int)$_GET['id_cohorte'];
            $sql_instancias = "SELECT ic.id, ic.nombre_instancia as nombre, ic.fecha_inicio AS fechaDesde, ic.fecha_cierre AS fechaHasta, ic.tipo_calificacion AS tipoCalificacion
                                FROM instancia_calificacion ic
                                WHERE ic.id_cohorte = $id_cohorte
                                ORDER BY ic.fecha_inicio";
            if ($stmt = $conexion->prepare($sql_instancias)) {
                $stmt->execute();
                $resultado_instancias = $stmt->get_result();
                if($resultado_instancias->num_rows > 0){
                    $instancias = $resultado_instancias->fetch_all(MYSQLI_ASSOC);
                    $stmt->close();
                }else{
                    $instancias=[];
                }
                echo json_encode(["success" => true, "instancias" => $instancias]);
            }else{
                echo json_encode(["success" => false, "message" => "Error en la consulta.".$sql_instancias]);
            }
        } elseif(isset($_GET['idFormacion'])) {
            $idFormacion = $_GET['idFormacion'];
            // crusar con talbla cohorte y luego con instancias y obtener las ultimas instancia
            $sql_instancias = "SELECT ic.nombre_instancia as nombre, ic.fecha_inicio AS fechaDesde, ic.fecha_cierre AS fechaHasta, ic.tipo_calificacion AS tipoCalificacion
                                FROM instancia_calificacion ic
                                JOIN cohorte c ON ic.id_cohorte = c.id
                                WHERE c.id_formacion = $idFormacion
                                AND c.año = (
                                    SELECT MAX(año)
                                    FROM cohorte
                                    WHERE id_formacion = $idFormacion
                                )
                                ORDER BY ic.fecha_inicio";
           // $resultado_instancias = $conexion->query($sql_instancias);
            if ($stmt = $conexion->prepare($sql_instancias)) {
                $stmt->execute();
                $resultado_instancias = $stmt->get_result();
                if($resultado_instancias->num_rows > 0){
                    $instancias = $resultado_instancias->fetch_all(MYSQLI_ASSOC);
                    $stmt->close();
                }else{
                    $instancias=[];
                }
                echo json_encode(["success" => true, "instancias" => $instancias]);
            }else{
                echo json_encode(["success" => false, "message" => "Error en la consulta.".$sql_instancias]);
            }
        } else {
                echo json_encode(["success" => false, "message" => "Error faltan datos."]);
        }
    break;
    case 'POST':
    break;
    case 'PUT':
    break;
    case 'DELETE':
    break;
}

?>