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

$response = ['error' => true, 'message' => 'f'];

if($method === 'POST'){
    if (isset($dataObject->modo) && $dataObject ->modo === 'guardarValoraciones') {
        $valoraciones = $dataObject->valoraciones; // Recibe las valoraciones enviadas.
        $fechaActual = date('Y-m-d H:i:s');
        
        try {
            foreach ($valoraciones as $valoracion) {
                $id_usuario = $valoracion->id_usuario;
                $id_instancia = $valoracion->id_instancia;
                $id_curso = $valoracion->id_curso;
                $valor = $valoracion->valor;

                // Verifica si ya existe una valoración para el usuario, instancia y curso.
                $queryCheck = $conexion->prepare("SELECT id FROM valoracion WHERE id_usuario ='$id_usuario' AND id_instancia = '$id_instancia' AND id_curso='$id_curso'");
                $queryCheck->execute();
                $resultado = $queryCheck->get_result();
                if ($resultado->num_rows >= 1) {
                    // Si existe, actualiza el registro.
                    $queryUpdate = $conexion->prepare(
                        "UPDATE valoracion 
                         SET valor = '".$valor."', fecha = '".$fechaActual."' 
                         WHERE id_usuario = '".$id_usuario."' AND id_instancia = '".$id_instancia."' AND id_curso = '".$id_curso."'"
                    );
                    $queryUpdate->execute();
                } else {
                    // Si no existe, inserta un nuevo registro.
                    $queryInsert = $conexion->prepare(
                        "INSERT INTO valoracion (id_usuario, id_instancia, id_curso, valor, fecha, estado_aprobacion) 
                         VALUES ('$id_usuario', '$id_instancia', '$id_curso', '$valor', '$fechaActual', '')"
                    );
                    $queryInsert->execute();
                }
            }
            $response['error'] = false;
            $response['message'] = 'Valoraciones guardadas correctamente.';
        } catch (Exception $e) {
            $response['error'] = true;
            $response['message'] = 'Error al guardar las valoraciones: ' . $e->getMessage();
        }
    }else{
        if (isset($dataObject->modo) && $dataObject ->modo === 'guardarInformeValoraciones') {
            $id_usuario = $dataObject->id_estudiante;
            $id_instancia = $dataObject->id_instancia;
            $id_curso = $dataObject->id_curso;
            $informe = $dataObject->informe;
            $fechaActual = date('Y-m-d H:i:s');

            // Verifica si ya existe una valoración para el usuario, instancia y curso.
                $queryCheck = $conexion->prepare("SELECT id FROM valoracion WHERE id_usuario ='$id_usuario' AND id_instancia = '$id_instancia' AND id_curso='$id_curso'");
                $queryCheck->execute();
                $resultado = $queryCheck->get_result();
                if ($resultado->num_rows >= 1) {
                    // Si existe, actualiza el registro.
                    $queryUpdate = $conexion->prepare(
                        "UPDATE valoracion 
                         SET observacion = '".$informe."', fecha = '".$fechaActual."' 
                         WHERE id_usuario = '".$id_usuario."' AND id_instancia = '".$id_instancia."' AND id_curso = '".$id_curso."'"
                    );
                    $queryUpdate->execute();
                    $response = ['error' => false, 'message' => 'se actualizo'];
                } else {
                    // Si no existe, inserta un nuevo registro.
                    $queryInsert = $conexion->prepare(
                        "INSERT INTO valoracion (id_usuario, id_instancia, id_curso, valor, fecha, observacion, estado_aprobacion) 
                         VALUES ('$id_usuario', '$id_instancia', '$id_curso', '', '$fechaActual','$informe', '')"
                    );
                    $queryInsert->execute();
                    $response = ['error' => false, 'message' => 'se inserto'];
                }

        }else {
            $response['error'] = true;
            $response['message'] = 'Modo no válido.';
        }
    }
    echo json_encode($response);
}
if ($method === 'GET') {
    if (isset($_GET['id_estudiante']) && isset($_GET['id_instancia'])) {
        $id_estudiante = $_GET['id_estudiante'];
        $id_instancia = $_GET['id_instancia'];

        // Verifica si ya existe informacion de valoración para el usuario e instancia.
        $sql="SELECT * FROM valoracion WHERE id_usuario ='$id_estudiante' AND id_instancia = '$id_instancia'";
        $queryCheck = $conexion->prepare($sql);
        $queryCheck->execute();
        $resultado = $queryCheck->get_result();
        if ($resultado->num_rows >= 1) {
            // Si existe, muestro registro.
            $response['error'] = false;
            $response['informacion'] = $resultado->fetch_assoc();
            
        }else{
            $response['informacion'] =$sql;
        }
        
    } else {
        // obtener informacion de la valoración final del curso
        if (isset($_GET['id_estudiante']) && isset($_GET['id_curso'])) {
            $id_estudiante = $_GET['id_estudiante'];
            $id_curso = $_GET['id_curso'];
            
            $sql="SELECT v.*
                    FROM valoracion v
                    INNER JOIN instancia_calificacion i 
                        ON i.id = v.id_instancia
                    WHERE i.nombre_instancia = 'final'
                    AND v.id_usuario = '$id_estudiante'
                    AND v.id_curso = '$id_curso';
                    ";
            $queryCheck = $conexion->prepare($sql);
            $queryCheck->execute();
            $resultado = $queryCheck->get_result();
            if ($resultado->num_rows >= 1) {
                // Si existe, muestro registro.
                $response['error'] = false;
                $response['informacion'] = $resultado->fetch_assoc();
                
            }else{
                $response['informacion'] =$sql;
            }
        }else{
            $response['error'] = true;
            $response['message'] = 'Modo no válido.';
        }
    }
    echo json_encode($response);
}
?>