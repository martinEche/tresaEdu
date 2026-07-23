<?php
require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset("utf8mb4");

$JSONData = file_get_contents("php://input");
$dataObject = json_decode($JSONData);

// Fallback para hostings que bloquean php://input o JSON crudo por mod_security
if (!$dataObject && isset($_POST['data'])) {
    $dataObject = json_decode($_POST['data']);
}

switch ($method) {
    case 'GET':
        // 1. Obtener todas las rúbricas para un grupo específico
        if (isset($_GET['id_curso_grupo'])) {
            $id_curso_grupo = intval($_GET['id_curso_grupo']);
            $sql = "SELECT r.*, 
                           (SELECT COUNT(*) FROM rubrica_criterios rc WHERE rc.id_rubrica = r.id) AS cantidad_criterios 
                    FROM rubricas r 
                    WHERE r.id_curso_grupo = ? 
                    ORDER BY r.id DESC";
            
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id_curso_grupo);
                $stmt->execute();
                $res = $stmt->get_result();
                $rubricas = $res->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                echo json_encode($rubricas);
            } else {
                echo json_encode(['error' => true, 'msg' => 'No se pudo preparar la consulta de rúbricas']);
            }
            exit;
        }

        // 2. Obtener los criterios (y evaluaciones si se pasa el id_estudiante) de una rúbrica específica
        if (isset($_GET['id_rubrica'])) {
            $id_rubrica = intval($_GET['id_rubrica']);
            $id_estudiante = isset($_GET['id_estudiante']) ? intval($_GET['id_estudiante']) : null;

            // Fetch rubric metadata
            $rubrica_info = null;
            $sql_rubrica = "SELECT * FROM rubricas WHERE id = ?";
            if ($stmt = $conexion->prepare($sql_rubrica)) {
                $stmt->bind_param("i", $id_rubrica);
                $stmt->execute();
                $res = $stmt->get_result();
                $rubrica_info = $res->fetch_assoc();
                $stmt->close();
            }

            if (!$rubrica_info) {
                echo json_encode(['error' => true, 'msg' => 'Rúbrica no encontrada']);
                exit;
            }

            // Fetch criteria (and evaluations if id_estudiante is provided)
            $criterios = [];
            if ($id_estudiante !== null) {
                $sql_criterios = "SELECT rc.*, re.calificacion, re.comentario, re.evaluado_por, re.fecha_evaluacion 
                                  FROM rubrica_criterios rc 
                                  LEFT JOIN rubrica_evaluaciones re 
                                    ON rc.id = re.id_criterio AND re.id_estudiante = ? 
                                  WHERE rc.id_rubrica = ? 
                                  ORDER BY rc.id ASC";
                if ($stmt = $conexion->prepare($sql_criterios)) {
                    $stmt->bind_param("ii", $id_estudiante, $id_rubrica);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    $criterios = $res->fetch_all(MYSQLI_ASSOC);
                    $stmt->close();
                }
            } else {
                $sql_criterios = "SELECT * FROM rubrica_criterios WHERE id_rubrica = ? ORDER BY id ASC";
                if ($stmt = $conexion->prepare($sql_criterios)) {
                    $stmt->bind_param("i", $id_rubrica);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    $criterios = $res->fetch_all(MYSQLI_ASSOC);
                    $stmt->close();
                }
            }

            echo json_encode([
                'rubrica' => $rubrica_info,
                'criterios' => $criterios
            ]);
            exit;
        }

        echo json_encode(['error' => true, 'msg' => 'Faltan parámetros en la petición GET']);
        exit;

    case 'POST':
        if (!isset($dataObject->accion)) {
            echo json_encode(['error' => true, 'msg' => 'Falta el parámetro accion en la petición POST']);
            exit;
        }

        $accion = $dataObject->accion;
        $evaluado_por = intval($tokenData->id); // ID del docente logueado

        // Guardar o Editar Rúbrica y sus Criterios
        if ($accion === 'guardar_rubrica') {
            $id = isset($dataObject->id) ? intval($dataObject->id) : 0;
            $id_curso_grupo = intval($dataObject->id_curso_grupo);
            $titulo = $conexion->real_escape_string($dataObject->titulo);
            $descripcion = $conexion->real_escape_string($dataObject->descripcion);
            $visible_estudiante = intval($dataObject->visible_estudiante);
            $criterios = $dataObject->criterios; // Array de objetos { criterio, descripcion, puntaje_maximo }

            $conexion->begin_transaction();

            try {
                if ($id > 0) {
                    // Actualizar rúbrica existente
                    $sql_update = "UPDATE rubricas SET titulo = ?, descripcion = ?, visible_estudiante = ? WHERE id = ?";
                    $stmt = $conexion->prepare($sql_update);
                    $stmt->bind_param("ssii", $titulo, $descripcion, $visible_estudiante, $id);
                    $stmt->execute();
                    $stmt->close();

                    $id_rubrica = $id;

                    // Eliminar criterios viejos
                    $sql_delete_crit = "DELETE FROM rubrica_criterios WHERE id_rubrica = ?";
                    $stmt = $conexion->prepare($sql_delete_crit);
                    $stmt->bind_param("i", $id_rubrica);
                    $stmt->execute();
                    $stmt->close();
                } else {
                    // Crear nueva rúbrica
                    $sql_insert = "INSERT INTO rubricas (id_curso_grupo, titulo, descripcion, visible_estudiante, creado_por) VALUES (?, ?, ?, ?, ?)";
                    $stmt = $conexion->prepare($sql_insert);
                    $stmt->bind_param("issii", $id_curso_grupo, $titulo, $descripcion, $visible_estudiante, $evaluado_por);
                    $stmt->execute();
                    $id_rubrica = $stmt->insert_id;
                    $stmt->close();
                }

                // Insertar los nuevos criterios
                $sql_crit = "INSERT INTO rubrica_criterios (id_rubrica, criterio, descripcion, puntaje_maximo) VALUES (?, ?, ?, ?)";
                foreach ($criterios as $crit) {
                    $criterio_txt = $conexion->real_escape_string($crit->criterio);
                    $desc_txt = $conexion->real_escape_string($crit->descripcion);
                    $puntaje_max = intval($crit->puntaje_maximo);

                    $stmt_crit = $conexion->prepare($sql_crit);
                    $stmt_crit->bind_param("issi", $id_rubrica, $criterio_txt, $desc_txt, $puntaje_max);
                    $stmt_crit->execute();
                    $stmt_crit->close();
                }

                $conexion->commit();
                echo json_encode(['success' => true, 'msg' => 'Rúbrica guardada correctamente', 'id_rubrica' => $id_rubrica]);
            } catch (Exception $e) {
                $conexion->rollback();
                echo json_encode(['error' => true, 'msg' => 'Error al guardar la rúbrica: ' . $e->getMessage()]);
            }
            exit;
        }

        // Guardar Evaluaciones de los alumnos
        if ($accion === 'guardar_evaluacion') {
            $id_estudiante = intval($dataObject->id_estudiante);
            $evaluaciones = $dataObject->evaluaciones; // Array de objetos { id_criterio, calificacion, comentario }

            $conexion->begin_transaction();

            try {
                $sql_upsert = "INSERT INTO rubrica_evaluaciones (id_criterio, id_estudiante, calificacion, comentario, evaluado_por) 
                               VALUES (?, ?, ?, ?, ?) 
                               ON DUPLICATE KEY UPDATE 
                                 calificacion = VALUES(calificacion), 
                                 comentario = VALUES(comentario), 
                                 evaluado_por = VALUES(evaluado_por)";

                foreach ($evaluaciones as $eval) {
                    $id_criterio = intval($eval->id_criterio);
                    $calificacion = $conexion->real_escape_string($eval->calificacion);
                    $comentario = $conexion->real_escape_string($eval->comentario);

                    $stmt = $conexion->prepare($sql_upsert);
                    $stmt->bind_param("iissi", $id_criterio, $id_estudiante, $calificacion, $comentario, $evaluado_por);
                    $stmt->execute();
                    $stmt->close();
                }

                $conexion->commit();
                echo json_encode(['success' => true, 'msg' => 'Evaluación de rúbrica guardada correctamente']);
            } catch (Exception $e) {
                $conexion->rollback();
                echo json_encode(['error' => true, 'msg' => 'Error al guardar la evaluación: ' . $e->getMessage()]);
            }
            exit;
        }

        echo json_encode(['error' => true, 'msg' => 'Acción no válida']);
        exit;

    case 'DELETE':
        $id = isset($dataObject->id) ? intval($dataObject->id) : 0;
        if ($id <= 0) {
            echo json_encode(['error' => true, 'msg' => 'ID de rúbrica no válido para eliminación']);
            exit;
        }

        $sql_del = "DELETE FROM rubricas WHERE id = ?";
        if ($stmt = $conexion->prepare($sql_del)) {
            $stmt->bind_param("i", $id);
            $stmt->execute();
            if ($stmt->affected_rows > 0) {
                echo json_encode(['success' => true, 'msg' => 'Rúbrica eliminada con éxito']);
            } else {
                echo json_encode(['error' => true, 'msg' => 'No se encontró la rúbrica a eliminar']);
            }
            $stmt->close();
        } else {
            echo json_encode(['error' => true, 'msg' => 'Error al preparar la eliminación de la rúbrica']);
        }
        exit;

    default:
        echo json_encode(['error' => true, 'msg' => 'Método HTTP no soportado']);
        exit;
}

$conexion->close();
?>
