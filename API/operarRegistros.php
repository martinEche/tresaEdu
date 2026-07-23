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
        //buscar los registros para el curso grupo
        if(isset($_GET['id_curso_grupo'])){
            $id_curso_grupo = $_GET['id_curso_grupo'];

           // $sql_r="SELECT `id`, 
            //            `id_curso_grupo`, 
            //            `area`, 
            //            `detalle`, 
            //            `fecha`, 
            //            `creado_por`, 
            //            `nivel`, 
            //            `link`, 
            //            `idElemento` 
            //        FROM registro_actividad 
            //        WHERE id_curso_grupo=$id_curso_grupo";
            $sql_r="SELECT 
                        ra.id,
                        ra.id_curso_grupo,
                        ra.area,
                        ra.detalle,
                        ra.fecha,
                        ra.creado_por,
                        ra.nivel,
                        ra.link,
                        ra.idElemento
                    FROM registro_actividad ra
                    WHERE ra.id_curso_grupo = $id_curso_grupo
                    UNION ALL
                    SELECT
                        ce.id,
                        ce.id_curso_grupo,
                        'Inscripción' AS area,
                        'Se inscribió el estudiante al curso' AS detalle,
                        ce.fecha_inscripcion AS fecha,
                        ce.usuario_inscribio AS creado_por,
                        'docente' AS nivel,
                        NULL AS link,
                        ce.id_usuario AS idElemento
                    FROM curso_estudiante ce
                    WHERE ce.id_curso_grupo = $id_curso_grupo
                    ORDER BY fecha ASC";
    
            if($nueva_consulta = $conexion->prepare($sql_r)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows >= 1) {
                    $registros=$resultado->fetch_all(MYSQLI_ASSOC);
                }else {
                    $registros = [];
                }
            }else{
                echo json_encode(array('error' => 'No se pudo realizar la query1'));
                exit;
            }
            echo json_encode(['registros'=>$registros]);
        }
        break;
    case 'POST':      

        break;
        
    case 'PUT':    

        break;

    case 'DELETE':

        break;
}
$conexion->close();
?>
                