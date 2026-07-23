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

if ($method === 'GET') {
    //btener la asistencia de un estudiante en un año lectivo determinado
    if((isset($_GET['id_estudiante'])) and (isset($_GET['anioLectivo']))){
		$id_estudiante=$_GET['id_estudiante'];
        $anioLectivo= $_GET['anioLectivo'];
		$sql="SELECT * FROM asistencia WHERE id_usuario = $id_estudiante AND YEAR(fecha) = $anioLectivo";

		if ($nueva_consulta = $conexion->prepare($sql)) {
			$nueva_consulta->execute();
			$resultado = $nueva_consulta->get_result();

            if ($resultado->num_rows >= 1) {
                $asistencias= $resultado->fetch_all(MYSQLI_ASSOC);
            }else{
                $asistencias= [];
            }
        }else{
            echo json_encode(['resultado'=>false, 'asistencia' => []]);
        }
        echo json_encode(['resultado' => true, 'asistencia' => $asistencias]);
        $conexion->close();
	}
    //obtener la asistencia general registrada en un cilo lectivo determinado
    if((isset($_GET['anioRegistro']))){
        $anioRegistro= $_GET['anioRegistro'];
        $sql="SELECT
                a.fecha,
                co.id_formacion,
                tf.nombre_formacion,
                e.nombre_espacio,
                cg.id as id_curso_grupo,
                e.orden,
                cg.denominacion,

                COUNT(
                    DISTINCT CASE
                        WHEN a.asistencia='Presente'
                        THEN a.id_usuario
                    END
                ) AS presentes,

                COUNT(
                    DISTINCT CASE
                        WHEN a.asistencia='Ausente'
                        THEN a.id_usuario
                    END
                ) AS ausentes,

                COUNT(
                    DISTINCT CASE
                        WHEN a.asistencia='Tarde'
                        THEN a.id_usuario
                    END
                ) AS tardes,

                COUNT(
                    DISTINCT CASE
                        WHEN a.asistencia IN ('Presente','Tarde')
                        THEN a.id_usuario
                    END
                ) AS total_presentes

            FROM asistencia a

            INNER JOIN curso_grupo cg
                ON cg.id = a.curso_grupo

            INNER JOIN curso c
                ON c.id = cg.id_curso

            INNER JOIN cohorte co
                ON co.id = c.id_cohorte

            INNER JOIN espacio e
                ON e.id = c.espacio

            INNER JOIN formacion tf
                ON tf.id = co.id_formacion

            WHERE
                co.año = $anioRegistro
                AND a.fecha BETWEEN co.fecha_inicio AND co.fecha_cierre

            GROUP BY
                a.fecha,
                cg.id

            ORDER BY
                co.id_formacion DESC,
                a.fecha DESC,
                e.orden";
        $asistenciasGeneral= [];
        $cursosActivos = [];
        if ($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $resultado = $nueva_consulta->get_result();

            if ($resultado->num_rows >= 1) {
                $asistenciasGeneral= $resultado->fetch_all(MYSQLI_ASSOC);
            }else{
                $asistenciasGeneral= [];
            }
            $sql_cursos_activos = "SELECT
                                    f.id AS id_formacion,
                                    f.nombre_formacion,
                                    c.id AS id_curso,
                                    cg.id AS id_curso_grupo,
                                    cg.seccion,
                                    cg.denominacion,
                                    e.orden,
                                    e.nombre_espacio
                                FROM curso_grupo cg
                                INNER JOIN curso c
                                    ON c.id = cg.id_curso
                                INNER JOIN cohorte co
                                    ON co.id = c.id_cohorte
                                INNER JOIN espacio e
                                    ON e.id = c.espacio
                                INNER JOIN formacion f
                                    ON f.id = co.id_formacion
                                WHERE co.año = $anioRegistro
                                ORDER BY
                                    f.id DESC,
                                    e.orden ASC,
                                    cg.seccion ASC,
                                    e.id ASC";
            if ($consulta_cursos = $conexion->prepare($sql_cursos_activos)) {
                $consulta_cursos->execute();
                $resultado_cursos = $consulta_cursos->get_result();

                if ($resultado_cursos->num_rows >= 1) {
                    $cursosActivos = $resultado_cursos->fetch_all(MYSQLI_ASSOC);
                } else {
                    $cursosActivos = [];
                }
            } else {
                echo json_encode(['resultado' => false, 'asistenciasGeneral' => [], 'cursos' => [], 'sql' => $sql_cursos_activos]);
                exit;
            }
        }else{
            echo json_encode(['resultado'=>false, 'asistenciasGeneral' => [], 'cursos' => [],'sql' => $sql]);
            exit;
        }
        echo json_encode(['resultado' => true, 'asistenciasGeneral' => $asistenciasGeneral, 'cursos' => $cursosActivos]);
        $conexion->close();
    }
}

if ($method === 'POST') {
    $response = ['error' => true, 'message' => 'f'];
    if (isset($dataObject->modo) && $dataObject ->modo === 'obtenerAsistencia') {
        $fecha = $dataObject->fecha;
        $curso = $dataObject->curso;
        //obtener asistenacia para todos los estudiantes de un curso en una fecha dada
        $sql = "SELECT id_usuario, fecha, asistencia 
                FROM asistencia 
                WHERE fecha = ? AND curso_grupo = ?";
                
        if ($stmt = $conexion->prepare($sql)) {
            $stmt->bind_param("si", $fecha, $curso);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $asistencias = $result->fetch_all(MYSQLI_ASSOC);
                $response=['asistencias' => $asistencias];
            } else {
                $asistencias=[];
            }
            //consultar toda la asistencia de todo un año de todos los estudiantes para el curso seleccionado
            $anio = (new DateTime($fecha))->format("Y");
            $sql_anual = "
            SELECT id_usuario, fecha, asistencia  
            FROM asistencia 
            WHERE YEAR(fecha) = ? 
            AND curso_grupo = ?
            ORDER BY fecha, id_usuario
            ";
            if ($stmt_anual = $conexion->prepare($sql_anual)) {
                $stmt_anual->bind_param("si", $anio, $curso);
                $stmt_anual->execute();
                $result_anual = $stmt_anual->get_result();
                
                if ($result_anual->num_rows > 0) {
                    $asistencias_anual = $result_anual->fetch_all(MYSQLI_ASSOC);
                }else {
                    $asistencias_anual=[];
                }
            } else {
                echo json_encode(['error' => 'No se pudo preparar la consulta por año']);
            }
            $response=['asistencias' => $asistencias, 'asistencias_anual' => $asistencias_anual];
        } else {
            echo json_encode(['error' => 'No se pudo preparar la consulta por fecha']);
        }
    }
    if (isset($dataObject->modo) && $dataObject ->modo === 'guardarAsistencia') {
        $valores = $dataObject->valores; // Recibe las valores enviadas.
        $fecha = $dataObject->fecha; 
        $curso = $dataObject->curso;
        $responsable = $dataObject->responsable;
        $fechaActual = date('Y-m-d H:i:s');
        
        try {
            foreach ($valores as $valor) {
                $id_usuario = $valor->id_usuario;
                $valor = $valor->valor;

                // Verifica si ya existe un valor para el usuario en la fecha
                $queryCheck = $conexion->prepare("SELECT id FROM asistencia WHERE id_usuario =".$id_usuario." AND fecha = '".$fecha."' AND curso_grupo='".$curso."'" );
                $queryCheck->execute();
                $resultado = $queryCheck->get_result();
                if ($resultado->num_rows >= 1) {
                    // Si existe, actualiza el registro.
                    $SQL_UPDATE = "UPDATE asistencia 
                         SET asistencia = '".$valor."', fecha_registro = '".$fechaActual."', responsable = '".$responsable."' 
                         WHERE id_usuario = '".$id_usuario."' AND fecha = '".$fecha."' AND curso_grupo='".$curso."'";
                    if($queryUpdate = $conexion->prepare($SQL_UPDATE)) {
                        $queryUpdate->execute();
                    }else{
                        echo json_encode(['error' => 'No se pudo completar la consulta de actualización.'.$SQL_UPDATE ]);
                        exit;
                    }
                } else {
                    // Si no existe, inserta un nuevo registro.
                    $SQL_INSERT="INSERT INTO asistencia(id_usuario, fecha, asistencia, curso_grupo, responsable, fecha_registro) 
                         VALUES ('$id_usuario', ' $fecha', '$valor', '$curso', '$responsable','$fechaActual')";
                    if($queryInsert = $conexion->prepare($SQL_INSERT)) {
                        $queryInsert->execute();
                    } else {
                        echo json_encode(['error' => 'No se pudo completar la consulta de inserción.'.$SQL_INSERT ]);
                        exit;
                    }
                }
            }
            $response['error'] = false;
            $response['message'] = 'Asistencia guardada correctamente.';
        } catch (Exception $e) {
            $response['error'] = true;
            $response['message'] = 'Error al guardar la asistencia: ' . $e->getMessage();
        }
    }
    echo json_encode($response);
} 

?>