<?php
require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); 

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST') {
    $JSONData = file_get_contents("php://input");
    $dataObject = json_decode($JSONData);

    if (isset($dataObject->modo)) {
        $modo = $dataObject->modo;

        // Build dynamic filters
        $filters = "";
        
        if (isset($dataObject->ciclo) && $dataObject->ciclo !== '') {
            $ciclo = $conexion->real_escape_string($dataObject->ciclo);
            $filters .= " AND co.año = '$ciclo' ";
        }
        if (isset($dataObject->nivel) && $dataObject->nivel !== '') {
            $nivel = $conexion->real_escape_string($dataObject->nivel);
            $filters .= " AND co.id_formacion = '$nivel' ";
        }
        if (isset($dataObject->orden) && $dataObject->orden !== '') {
            $orden = $conexion->real_escape_string($dataObject->orden);
            $filters .= " AND e.orden = '$orden' ";
        }
        if (isset($dataObject->seccion) && $dataObject->seccion !== '') {
            $seccion = $conexion->real_escape_string($dataObject->seccion);
            $filters .= " AND cg.seccion = '$seccion' ";
        }

        if (isset($dataObject->espacio) && $dataObject->espacio !== '' && $dataObject->espacio !== 'general') {
            $espacio = $conexion->real_escape_string($dataObject->espacio);
            $filters .= " AND e.id = '$espacio' ";
        }

        if ($modo === 'estudiantesPorCurso') {
            $sql = "SELECT 
                        co.año AS ciclo,
                        f.nombre_formacion AS nivel,
                        e.orden,
                        cg.seccion AS division,
                        e.nombre_espacio,
                        u.id AS estudiante_id,
                        u.documento,
                        u.apellido,
                        u.nombre,
                        u.estado
                    FROM curso_estudiante ce
                    JOIN usuarios u ON ce.id_usuario = u.id
                    JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id
                    JOIN curso c ON cg.id_curso = c.id
                    JOIN espacio e ON c.espacio = e.id
                    JOIN cohorte co ON c.id_cohorte = co.id
                    JOIN formacion f ON co.id_formacion = f.id
                    JOIN rol r ON u.id = r.id_usuario
                    WHERE r.rol = 7
                    $filters
                    ORDER BY co.año DESC, f.nombre_formacion ASC, e.orden ASC, cg.seccion ASC, u.apellido ASC, u.nombre ASC";

            if ($consulta = $conexion->prepare($sql)) {
                $consulta->execute();
                $resultado = $consulta->get_result();
                $datos = [];
                if ($resultado->num_rows >= 1) {
                    $datos = $resultado->fetch_all(MYSQLI_ASSOC);
                }
                echo json_encode(['error' => false, 'datos' => $datos]);
            } else {
                echo json_encode(['error' => true, 'mensaje' => 'Error en la consulta de estudiantes por curso']);
            }
        } 
        else if ($modo === 'cantidadEstudiantes') {
            $sql = "SELECT 
                        co.año AS ciclo,
                        f.nombre_formacion AS nivel,
                        e.orden,
                        cg.seccion AS division,
                        COUNT(DISTINCT u.id) as total_estudiantes
                    FROM curso_estudiante ce
                    JOIN usuarios u ON ce.id_usuario = u.id
                    JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id
                    JOIN curso c ON cg.id_curso = c.id
                    JOIN espacio e ON c.espacio = e.id
                    JOIN cohorte co ON c.id_cohorte = co.id
                    JOIN formacion f ON co.id_formacion = f.id
                    JOIN rol r ON u.id = r.id_usuario
                    WHERE r.rol = 7
                    $filters
                    GROUP BY co.año, f.nombre_formacion, e.orden, cg.seccion
                    ORDER BY co.año DESC, f.nombre_formacion ASC, e.orden ASC, cg.seccion ASC";

            if ($consulta = $conexion->prepare($sql)) {
                $consulta->execute();
                $resultado = $consulta->get_result();
                $datos = [];
                if ($resultado->num_rows >= 1) {
                    $datos = $resultado->fetch_all(MYSQLI_ASSOC);
                }
                echo json_encode(['error' => false, 'datos' => $datos]);
            } else {
                echo json_encode(['error' => true, 'mensaje' => 'Error en la consulta de cantidad de estudiantes']);
            }
        } 
        else if ($modo === 'filtrosOpciones') {
            // Fetch combinations of ciclos, niveles, ordenes, and secciones that actually exist in the database
            $sqlF = "SELECT DISTINCT
                        co.año AS ciclo,
                        f.id AS nivel_id,
                        f.nombre_formacion AS nivel_nombre,
                        e.orden,
                        cg.seccion AS division,
                        e.id AS espacio_id,
                        e.nombre_espacio
                    FROM curso_grupo cg
                    JOIN curso c ON cg.id_curso = c.id
                    JOIN espacio e ON c.espacio = e.id
                    JOIN cohorte co ON c.id_cohorte = co.id
                    JOIN formacion f ON co.id_formacion = f.id
                    WHERE cg.seccion IS NOT NULL AND cg.seccion != ''
                    ORDER BY co.año DESC, f.nombre_formacion ASC, e.orden ASC, cg.seccion ASC";
            
            $resF = $conexion->query($sqlF);
            $combinaciones = [];
            if ($resF && $resF->num_rows > 0) {
                $combinaciones = $resF->fetch_all(MYSQLI_ASSOC);
            }

            echo json_encode([
                'error' => false, 
                'combinaciones' => $combinaciones
            ]);
        }
        else {
            echo json_encode(['error' => true, 'mensaje' => 'Modo no soportado']);
        }
    } else {
        echo json_encode(['error' => true, 'mensaje' => 'Faltan parámetros requeridos']);
    }
} else {
    echo json_encode(['error' => true, 'mensaje' => 'Método no soportado']);
}

$conexion->close();
?>
