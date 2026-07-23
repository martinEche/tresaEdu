<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD']; 

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); //ejecuta la funcion del conectar

if ($conexion === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al conectar a la base de datos']);
    exit;
}

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$data = json_decode($JSONData, true);    //convierte el formato json a un formato php
    
$conexion->set_charset('utf8mb4');

switch ($method) {
    case 'GET':
        if(isset($_GET['curso_grupo']) && isset($_GET['ciclo']) ){
            $curso_grupo= $_GET['curso_grupo'];
            //año actual
            $ciclo_actual=$_GET['ciclo'];

            //convertir arreglo y separar orden de seccion
            $arreglo_CG=explode('-', $curso_grupo);
            $orden=$arreglo_CG[0];
            $seccion=$arreglo_CG[1];
            // consulta para los horarios
            $sql = "SELECT h.*, e.nombre_espacio 
                    FROM horarios h 
                    LEFT JOIN espacio e ON h.id_espacio = e.id
                    WHERE h.curso_grupo = '$curso_grupo'";

            if($nueva_consulta = $conexion->prepare($sql)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows >= 1) {
                    $horarios = $resultado->fetch_all(MYSQLI_ASSOC);
                    //obtener el total de los espacios
                }else{
                    $horarios = [];
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query de horarios'));
                exit;   
            }

            // consulta para  los cursos
            $sql_cursos="SELECT DISTINCT e.orden, cg.seccion, cg.denominacion, e.id_formacion 
                        FROM curso_grupo cg 
                        JOIN curso c ON cg.id_curso = c.id 
                        JOIN espacio e ON c.espacio = e.id 
                        WHERE c.id_cohorte 
                        IN ( 
                            SELECT id 
                            FROM cohorte 
                            WHERE CURRENT_TIMESTAMP(6) 
                            BETWEEN fecha_inicio 
                            AND fecha_cierre ) 
                            ORDER BY `e`.`id_formacion` DESC, e.orden ASC, cg.seccion ASC
                            "; 
            if($nueva_consulta_cursos= $conexion->prepare($sql_cursos)) {
                $nueva_consulta_cursos->execute();
                $resultado_cursos = $nueva_consulta_cursos->get_result();
                if ($resultado_cursos->num_rows >= 1) {
                    $cursos = $resultado_cursos->fetch_all(MYSQLI_ASSOC);
                }else {
                    $cursos = [];
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query de espacios'));
                exit;
            }
            // consulta para los espacios
            $sql_esp = "SELECT espacio.* 
                        FROM espacio 
                        WHERE espacio.orden 
                        in (SELECT e.orden FROM espacio as e, curso as c, curso_grupo as cg where c.espacio=e.id and cg.id_curso = c.id and cg.seccion='$seccion' and e.orden='$orden' )";            
            if($nueva_consulta_esp= $conexion->prepare($sql_esp)) {
                $nueva_consulta_esp->execute();
                $resultado_esp = $nueva_consulta_esp->get_result();
                if ($resultado_esp->num_rows >= 1) {
                    $espacios = $resultado_esp->fetch_all(MYSQLI_ASSOC);
                }else {
                    $espacios = [];
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query de espacios'));
                exit;
            }
            echo json_encode(['horarios'=>$horarios, 'espacios'=>$espacios, 'cursos'=>$cursos]);
        }
        if(isset($_GET['id_estudiante']) && isset($_GET['ciclo']) && isset($_GET['dia_semana'])){
            $id_estudiante = $_GET['id_estudiante'];
            $ciclo = $_GET['ciclo'];
            $dia = $_GET['dia_semana'];

            // Paso 1: Obtener del estudiante el curso actual
            //$sql_curso_alumno = "SELECT curso, turno, division FROM alumno_anio WHERE anio_lectivo = ? AND id_alumno = ?";
            $sql_curso_alumno = "SELECT e.orden, cg.seccion FROM curso_estudiante as ce, curso_grupo as cg, curso as c, cohorte as co, espacio as e WHERE c.espacio =e.id and c.id_cohorte=co.id and cg.id_curso= c.id and cg.id= ce.id_curso_grupo and ce.id_usuario=? and co.año=?";
            $stmt = $conexion->prepare($sql_curso_alumno);
            $stmt->bind_param("ii", $id_estudiante,$ciclo);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) {
                $curso_orden = $row['orden'];
                $curso_seccion = $row['seccion'];
                $curso_grupo=$curso_orden.'-'.$curso_seccion;
            } else {
                echo json_encode(['error'=>'no obtuvo el curso']);
                exit;
            }

            // Paso 2: Obtener espacios del año/orden en curso
            $sql_espacio = "SELECT id FROM espacio WHERE orden = ?";
            $stmt = $conexion->prepare($sql_espacio);
            $stmt->bind_param("s", $curso_orden);
            $stmt->execute();
            $result = $stmt->get_result();

            $ids_espacios = [];
            while ($row = $result->fetch_assoc()) {
                $ids_espacios[] = $row['id'];
            }
            if (empty($ids_espacios)) {
                echo json_encode(['error'=>'no hay datos de los espacios']);
                exit;
            }

            // Paso 3: Horarios + Docente a cargo
            $placeholders = implode(',', array_fill(0, count($ids_espacios), '?'));
            $types = str_repeat('i', count($ids_espacios));

            $sql_horarios = "SELECT h.*, 
                            e.nombre_espacio 
                            FROM horarios AS h 
                            INNER JOIN espacio AS e ON h.id_espacio = e.id 
                            WHERE h.id_espacio IN ($placeholders) 
                            AND h.curso_grupo = ? 
                            AND h.dia_semana = ? 
                            ORDER BY h.hora_desde ASC";

            $stmt = $conexion->prepare($sql_horarios);
            // Parámetros dinámicos
            $params = array_merge($ids_espacios, [$curso_grupo, $dia]);
            $param_types = $types . "ss";

            $stmt->bind_param($param_types, ...$params);

            $stmt->execute();
            $result = $stmt->get_result();

            $espacios = [];
            while ($row = $result->fetch_assoc()) {
                $espacios[] = $row;
            }

            echo json_encode(['espacios'=>$espacios]);
        }
        break;

    case 'POST':
        
        $id_espacio = $data['id_espacio'];
        $curso_grupo = $data['curso_grupo'];
        $hora_desde = $data['hora_desde'];
        $hora_hasta = $data['hora_hasta'];
        $dia_semana = $data['dia_semana'];
        $contraturno = $data['contraturno'];

        $sql = "INSERT INTO horarios (id_espacio,curso_grupo,hora_desde,hora_hasta,dia_semana,contraturno) 
                VALUES ('$id_espacio','$curso_grupo','$hora_desde','$hora_hasta','$dia_semana','$contraturno')";
        if ($conexion->query($sql)) {
            echo json_encode(['success'=>true, 'id'=>$conexion->insert_id]);
        } else {
            echo json_encode(['error'=>$conexion->error]);
        }
        break;

    case 'PUT':
        $id = $data['id'];
        $sql = "UPDATE horarios SET 
                    id_espacio='{$data['id_espacio']}',
                    curso_grupo='{$data['curso_grupo']}',
                    hora_desde='{$data['hora_desde']}',
                    hora_hasta='{$data['hora_hasta']}',
                    dia_semana='{$data['dia_semana']}',
                    contraturno='{$data['contraturno']}'
                WHERE id=$id";
        if ($conexion->query($sql)) {
            echo json_encode(['success'=>true]);
        } else {
            echo json_encode(['error'=>$conexion->error]);
        }
        break;
}
$conexion->close();

?>