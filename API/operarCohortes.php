<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";
$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;

switch($method){
    case 'GET':
        if(isset($_GET['accion'])) {
            $accion = $_GET['accion'];
            if($accion == 'listar') {
                // Listar cohortes
                $sql_cohortes = "SELECT 
                                    co.id, 
                                    co.año, 
                                    co.fecha_inicio, 
                                    co.fecha_cierre, 
                                    co.id_formacion, 
                                    f.nombre_formacion, 
                                    f.nivel
                                FROM cohorte AS co
                                INNER JOIN formacion AS f 
                                    ON co.id_formacion = f.id
                                ORDER BY f.nombre_formacion asc, co.año DESC";
                $resultado_cohortes = $conexion->query($sql_cohortes);
                if ($stmt = $conexion->prepare($sql_cohortes)) {
                    $stmt->execute();
                    $resultado_cohortes = $stmt->get_result();
                    if($resultado_cohortes->num_rows > 0){
                        $cohortes = $resultado_cohortes->fetch_all(MYSQLI_ASSOC);
                        $stmt->close();
                    }else{
                        $cohortes=[];
                    }
                    echo json_encode(["success" => true, "cohortes" => $cohortes]);
                }else{
                    echo json_encode(["success" => false, "message" => "Error en la consulta."]);
                }
            }
            if($accion == 'años'){ 
                // Listar años de cohortes
                $sql_años = "SELECT DISTINCT año as cohorte FROM cohorte WHERE año <> YEAR(CURRENT_DATE) ORDER BY año DESC";
                if ($stmt = $conexion->prepare($sql_años)) {
                    $stmt->execute();
                    $resultado_años = $stmt->get_result();
                    if($resultado_años->num_rows > 0){
                        $cohortes = $resultado_años->fetch_all(MYSQLI_ASSOC);
                        $stmt->close();
                    }else{
                        $cohortes=[];
                    }
                    echo json_encode(["success" => true, "cohortes" => $cohortes]);
                }else{
                    echo json_encode(["success" => false, "message" => "Error en la consulta."]);
                }
            }
        }else{ 
            if (isset($_GET['ciclo'])) { 
                $ciclo = intval($_GET['ciclo']);
                // Consulta base de cohortes en el ciclo actual
                $sql_cohortes = "SELECT 
                                    co.id, 
                                    co.año, 
                                    co.fecha_inicio, 
                                    co.fecha_cierre, 
                                    f.nombre_formacion, 
                                    n.id AS id_nivel, 
                                    n.denominacion AS nivel
                                FROM cohorte co
                                JOIN formacion f ON f.id = co.id_formacion
                                JOIN nivel n     ON n.id = f.nivel
                                WHERE co.año = ?";
                if ($stmt = $conexion->prepare($sql_cohortes)) {
                    $stmt->bind_param("i", $ciclo);
                    $stmt->execute();
                    $resultado_cohortes = $stmt->get_result();
                    if($resultado_cohortes->num_rows > 0){
                        $cohortes = $resultado_cohortes->fetch_all(MYSQLI_ASSOC);
                        $stmt->close();
                    }else{
                        $cohortes=[];
                    }
                    echo json_encode(["success" => true, "cohortes" => $cohortes]);
                }else{
                    echo json_encode(["success" => false, "message" => "Error en la consulta."]);
                }
            } else {
                echo json_encode(["success" => false, "message" => "Error falta el ciclo."]);
            }
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