<?php
require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];
include "conectar.php";
require_once 'validarToken.php';
$tokenData = validarToken(); 
$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

if ($method === 'GET') {
    if (isset($_GET['modo'])) {
        $modo = $_GET['modo'];
        
        if ($modo === 'buscarActividad') {
            $id_trabajo = (int)$_GET['id_trabajo'];
            $id_estudiante = isset($_GET['id_estudiante']) ? (int)$_GET['id_estudiante'] : 0;
            $id_curso_grupo = isset($_GET['id_curso_grupo']) ? (int)$_GET['id_curso_grupo'] : 0;
            
            // 1. Obtener la actividad
            $sql = "SELECT * FROM trabajo WHERE id = ?";
            $stmt = $conexion->prepare($sql);
            $stmt->bind_param("i", $id_trabajo);
            $stmt->execute();
            $actividad = $stmt->get_result()->fetch_assoc();
            
            // 2. Obtener la entrega del estudiante (o de su grupo)
            // Primero, ver si está en un grupo para este trabajo
            $id_grupo = null;
            $sql_grupo = "SELECT id_grupo FROM grupo_practico WHERE id_alumno = ? AND id_practico = ?";
            $stmt_grupo = $conexion->prepare($sql_grupo);
            $stmt_grupo->bind_param("ii", $id_estudiante, $id_trabajo);
            $stmt_grupo->execute();
            $res_grupo = $stmt_grupo->get_result();
            if ($row_grupo = $res_grupo->fetch_assoc()) {
                $id_grupo = $row_grupo['id_grupo'];
            }
            
            // Buscar historial de entregas (ordenadas por la más reciente primero)
            if ($id_grupo !== null && $id_grupo !== 0) {
                // Entrega grupal
                $sql_entrega = "SELECT e.*, ea.adjunto, ea.nombre_archivo 
                                FROM entregas e 
                                LEFT JOIN entrega_adjunto ea ON e.id_entrega = ea.id_entrega 
                                WHERE e.id_trabajo = ? AND e.id_grupo = ? AND e.id_estudiante = ?
                                ORDER BY e.id_entrega DESC";
                $stmt_entrega = $conexion->prepare($sql_entrega);
                $stmt_entrega->bind_param("iii", $id_trabajo, $id_grupo, $id_estudiante);
            } else {
                // Entrega individual
                $sql_entrega = "SELECT e.*, ea.adjunto, ea.nombre_archivo 
                                FROM entregas e 
                                LEFT JOIN entrega_adjunto ea ON e.id_entrega = ea.id_entrega 
                                WHERE e.id_trabajo = ? AND e.id_estudiante = ?
                                ORDER BY e.id_entrega DESC";
                $stmt_entrega = $conexion->prepare($sql_entrega);
                $stmt_entrega->bind_param("ii", $id_trabajo, $id_estudiante);
            }
            
            $stmt_entrega->execute();
            $result_entrega = $stmt_entrega->get_result();
            $historial_entregas = [];
            while ($row = $result_entrega->fetch_assoc()) {
                $historial_entregas[] = $row;
            }
            
            // La entrega más reciente (estado actual)
            $entrega = count($historial_entregas) > 0 ? $historial_entregas[0] : null;
            
            // 3. Obtener compañeros si es grupal y no tiene grupo
            $companeros = [];
            $grupo_actual = [];
            if ($actividad && $actividad['tipo_trabajo'] === 'grupal') {
                if ($id_grupo === null) {
                    // Buscar alumnos del curso que no tengan grupo para este practico
                    // id_curso_grupo debe venir en GET
                    $sql_comp = "
                        SELECT u.id, u.nombre, u.apellido 
                        FROM curso_estudiante ce 
                        JOIN usuarios u ON ce.id_usuario = u.id 
                        WHERE ce.id_curso_grupo = ? 
                        AND u.id != ?
                        AND u.id NOT IN (
                            SELECT id_alumno FROM grupo_practico WHERE id_practico = ?
                        )
                    ";
                    $stmt_comp = $conexion->prepare($sql_comp);
                    $stmt_comp->bind_param("iii", $id_curso_grupo, $id_estudiante, $id_trabajo);
                    $stmt_comp->execute();
                    $companeros = $stmt_comp->get_result()->fetch_all(MYSQLI_ASSOC);
                } else {
                    // Buscar integrantes del grupo
                    $sql_int = "
                        SELECT u.id, u.nombre, u.apellido 
                        FROM grupo_practico gp 
                        JOIN usuarios u ON gp.id_alumno = u.id 
                        WHERE gp.id_grupo = ? AND gp.id_practico = ?
                    ";
                    $stmt_int = $conexion->prepare($sql_int);
                    $stmt_int->bind_param("ii", $id_grupo, $id_trabajo);
                    $stmt_int->execute();
                    $grupo_actual = $stmt_int->get_result()->fetch_all(MYSQLI_ASSOC);
                }
            }

            echo json_encode([
                "error" => false, 
                "actividad" => $actividad, 
                "entrega" => $entrega,
                "historial_entregas" => $historial_entregas,
                "companeros_disponibles" => $companeros,
                "grupo_actual" => $grupo_actual,
                "id_grupo" => $id_grupo
            ]);
            exit;
        }
    }
} elseif ($method === 'POST') {
    if (isset($_POST['modo'])) {
        $modo = $_POST['modo'];
        
        if ($modo === 'crearGrupo') {
            $id_trabajo = (int)$_POST['id_trabajo'];
            $id_estudiante = (int)$_POST['id_estudiante'];
            $integrantes = json_decode($_POST['integrantes'], true); // array de ids
            array_push($integrantes, $id_estudiante); // incluirse a si mismo
            
            // Obtener el proximo id_grupo
            $sql_max = "SELECT MAX(id_grupo) as max_grupo FROM grupo_practico";
            $res_max = $conexion->query($sql_max);
            $max_grupo = $res_max->fetch_assoc()['max_grupo'];
            $nuevo_grupo = $max_grupo ? $max_grupo + 1 : 1;
            
            // Insertar cada integrante
            $sql_ins = "INSERT INTO grupo_practico (id_alumno, id_practico, id_grupo, estado_integrante) VALUES (?, ?, ?, 'activo')";
            $stmt_ins = $conexion->prepare($sql_ins);
            foreach ($integrantes as $id_integrante) {
                $id_int = (int)$id_integrante;
                $stmt_ins->bind_param("iii", $id_int, $id_trabajo, $nuevo_grupo);
                $stmt_ins->execute();
            }
            
            echo json_encode(["error" => false, "mensaje" => "Grupo creado exitosamente", "id_grupo" => $nuevo_grupo]);
            exit;
        }
        
        if ($modo === 'entregarActividad') {
            $id_trabajo = (int)$_POST['id_trabajo'];
            $id_estudiante = (int)$_POST['id_estudiante'];
            $id_grupo = isset($_POST['id_grupo']) && $_POST['id_grupo'] !== 'null' && $_POST['id_grupo'] !== '' ? (int)$_POST['id_grupo'] : 0;
            $comentario = $_POST['comentario'];
            $fecha_entrega = date('Y-m-d H:i:s');
            
            // Si hay adjunto
            $adjunto = null;
            $nombre_archivo = null;
            if (isset($_FILES['adjunto']) && $_FILES['adjunto']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = 'uploads_entregas/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                // Add timestamp to prevent overwriting
                $nombre_archivo = basename($_FILES['adjunto']['name']);
                $filename = time() . '_' . $nombre_archivo;
                $filePath = $uploadDir . $filename;
                
                if (move_uploaded_file($_FILES['adjunto']['tmp_name'], $filePath)) {
                    $adjunto = $filePath;
                } else {
                    echo json_encode(["error" => true, "mensaje" => "Error al subir el archivo adjunto"]);
                    exit;
                }
            }
            
            // Determinar alumnos a registrar la entrega
            $alumnos_entrega = [];
            if ($id_grupo !== 0) {
                $sql_grupo = "SELECT id_alumno FROM grupo_practico WHERE id_grupo = ? AND id_practico = ?";
                $stmt_grupo = $conexion->prepare($sql_grupo);
                $stmt_grupo->bind_param("ii", $id_grupo, $id_trabajo);
                $stmt_grupo->execute();
                $res_grupo = $stmt_grupo->get_result();
                while ($row = $res_grupo->fetch_assoc()) {
                    $alumnos_entrega[] = $row['id_alumno'];
                }
            } else {
                $alumnos_entrega[] = $id_estudiante;
            }
            
            // Insertar entregas siempre como un nuevo registro (historial)
            $id_entregas_generadas = [];
            
            foreach ($alumnos_entrega as $id_alum) {
                // Insert
                $sql_ins = "INSERT INTO entregas (id_trabajo, id_estudiante, id_grupo, fecha_entrega, comentario, estado, visto) VALUES (?, ?, ?, ?, ?, 'entregado', 0)";
                $stmt_ins = $conexion->prepare($sql_ins);
                $stmt_ins->bind_param("iiiss", $id_trabajo, $id_alum, $id_grupo, $fecha_entrega, $comentario);
                $stmt_ins->execute();
                $id_entrega = $conexion->insert_id;
                
                $id_entregas_generadas[] = $id_entrega;
            }
            
            // Adjunto
            if ($adjunto && count($id_entregas_generadas) > 0) {
                // Para todas las entregas generadas, insertamos el adjunto
                $sql_adj_ins = "INSERT INTO entrega_adjunto (id_entrega, adjunto, nombre_archivo, fecha_entrega) VALUES (?, ?, ?, ?)";
                $stmt_adj_ins = $conexion->prepare($sql_adj_ins);
                
                foreach ($id_entregas_generadas as $id_e) {
                    $stmt_adj_ins->bind_param("isss", $id_e, $adjunto, $nombre_archivo, $fecha_entrega);
                    $stmt_adj_ins->execute();
                }
            }
            
            echo json_encode(["error" => false, "mensaje" => "Entrega registrada exitosamente"]);
            exit;
        }

        if ($modo === 'evaluarEntrega') {
            $id_entrega = (int)$_POST['id_entrega'];
            $estado = $_POST['estado'];
            $devolucion = $_POST['devolucion'];
            $id_grupo = (int)$_POST['id_grupo'];
            $fecha_devolucion = date('Y-m-d H:i:s');
            $fecha_reentrega_raw = isset($_POST['fecha_reentrega']) ? $_POST['fecha_reentrega'] : '';
            $fecha_reentrega = $fecha_reentrega_raw !== '' ? $fecha_reentrega_raw . ' 23:59:59' : null;

            // Obtener información de la entrega y la actividad
            $sql_get_info = "SELECT e.id_trabajo, e.id_estudiante, e.id_grupo, t.titulo, t.id_curso 
                             FROM entregas e 
                             JOIN trabajo t ON e.id_trabajo = t.id 
                             WHERE e.id_entrega = ?";
            $stmt_get = $conexion->prepare($sql_get_info);
            $stmt_get->bind_param("i", $id_entrega);
            $stmt_get->execute();
            $info_entrega = $stmt_get->get_result()->fetch_assoc();
            
            $id_trabajo = $info_entrega['id_trabajo'];
            $titulo_trabajo = $info_entrega['titulo'];
            $id_curso_grupo_actividad = $info_entrega['id_curso'];

            // Obtener alumnos afectados
            $alumnos_afectados = [];
            if ($id_grupo > 0) {
                $sql_g = "SELECT id_estudiante FROM entregas WHERE id_trabajo = ? AND id_grupo = ?";
                $stmt_g = $conexion->prepare($sql_g);
                $stmt_g->bind_param("ii", $id_trabajo, $id_grupo);
                $stmt_g->execute();
                $res_g = $stmt_g->get_result();
                while ($row = $res_g->fetch_assoc()) {
                    $alumnos_afectados[] = $row['id_estudiante'];
                }
                
                // Actualizar DB
                $sql_eval = "UPDATE entregas SET estado = ?, devolucion = ?, fecha_devolucion = ?, fecha_reentrega = ? WHERE id_trabajo = ? AND id_grupo = ?";
                $stmt_eval = $conexion->prepare($sql_eval);
                $stmt_eval->bind_param("ssssii", $estado, $devolucion, $fecha_devolucion, $fecha_reentrega, $id_trabajo, $id_grupo);
                $stmt_eval->execute();
            } else {
                $alumnos_afectados[] = $info_entrega['id_estudiante'];
                
                // Actualizar DB individual
                $sql_eval = "UPDATE entregas SET estado = ?, devolucion = ?, fecha_devolucion = ?, fecha_reentrega = ? WHERE id_entrega = ?";
                $stmt_eval = $conexion->prepare($sql_eval);
                $stmt_eval->bind_param("ssssi", $estado, $devolucion, $fecha_devolucion, $fecha_reentrega, $id_entrega);
                $stmt_eval->execute();
            }

            // --- NOTIFICACIONES Y CALENDARIO ---
            $fechaHora = date('Y-m-d H:i:s');
            
            // 1. Notificación de campanita
            $titulo_notif = "Entrega evaluada";
            $desarrollo_notif = "Tu entrega para la actividad '$titulo_trabajo' ha sido evaluada.";
            $tipo_notif = "evaluacion";
            $sql_notif = "INSERT INTO notificaciones (id_usuario, titulo, desarrollo, tipo, leida, fecha) VALUES (?, ?, ?, ?, 0, ?)";
            $stmt_notif = $conexion->prepare($sql_notif);
            
            // 2. Evento de calendario si es reentrega
            $stmt_cal = null;
            if ($estado === 'reentrega' && $fecha_reentrega_raw !== '') {
                $evento_cal = "Reentrega de actividad: " . $titulo_trabajo;
                $hora_desde = '00:00:00';
                $hora_hasta = '23:59:59';
                $tipo_recordatorio = 'yo';
                $id_curso_grupo = $id_curso_grupo_actividad ? $id_curso_grupo_actividad : 0; 
                
                $sql_cal = "INSERT INTO calendario (evento, fecha_creado, hora_desde, hora_hasta, id_curso_grupo, tipo_recordatorio, creada_por, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt_cal = $conexion->prepare($sql_cal);
            }

            foreach ($alumnos_afectados as $id_alum) {
                // Notificar
                $stmt_notif->bind_param("issss", $id_alum, $titulo_notif, $desarrollo_notif, $tipo_notif, $fechaHora);
                $stmt_notif->execute();
                
                // Calendario
                if ($stmt_cal) {
                    $stmt_cal->bind_param("ssssisis", $evento_cal, $fechaHora, $hora_desde, $hora_hasta, $id_curso_grupo, $tipo_recordatorio, $id_alum, $fecha_reentrega_raw);
                    $stmt_cal->execute();
                }
            }

            echo json_encode(["error" => false, "mensaje" => "Evaluación guardada exitosamente"]);
            exit;
        }
    }
}
$conexion->close();
?>
