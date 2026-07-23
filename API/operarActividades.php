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
        if (isset($_GET['id_curso_grupo'])) { //consultar las actividades que ya estan asignadas a una clase
            $id_curso_grupo = intval($_GET['id_curso_grupo']);
            $rol = isset($_GET['rol']) ? intval($_GET['rol']) : 0;

            // Consulta base de actividades
            $actividades_query = "SELECT t.*, 
                                    tc.id AS id_trabajo_clase,
                                    tc.id_clase, 
                                    tc.id_usuario, 
                                    tc.fecha_fijacion, 
                                    t.tipo_trabajo AS tipo_trabajo_clase
                                FROM trabajo t
                                LEFT JOIN trabajo_clase tc ON t.id = tc.id_trabajo
                                LEFT JOIN clase c ON tc.id_clase = c.id 
                                WHERE c.id_curso_grupo = ?";
            // Filtro por rol
            if ($rol === 7 || $rol === 8) {
                $actividades_query .= " AND tc.id_clase IS NOT NULL";
            }

            $actividades_query .= " ORDER BY t.id DESC";

            if ($stmt = $conexion->prepare($actividades_query)) {
                $stmt->bind_param("i", $id_curso_grupo);
                $stmt->execute();
                $actividades_result = $stmt->get_result();
                $actividades = $actividades_result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();

                // Por cada actividad, buscamos entregas
                foreach ($actividades as &$actividad) {
                    $id_trabajo = $actividad['id']; // ID del trabajo original
                    $entregas_query = "SELECT e.id_entrega, e.id_estudiante, e.id_grupo, e.fecha_entrega, e.comentario, e.devolucion, e.fecha_devolucion, e.estado, e.visto, ea.adjunto, ea.nombre_archivo 
                                        FROM entregas e
                                        LEFT JOIN entrega_adjunto ea ON e.id_entrega = ea.id_entrega 
                                        WHERE e.id_trabajo = ?
                                        ORDER BY e.id_entrega DESC";
                    
                    if ($entrega_stmt = $conexion->prepare($entregas_query)) {
                        $entrega_stmt->bind_param("i", $id_trabajo);
                        $entrega_stmt->execute();
                        $entrega_result = $entrega_stmt->get_result();
                        $entregas = $entrega_result->fetch_all(MYSQLI_ASSOC);
                        $actividad['entregas'] = $entregas; // Agregamos al resultado
                        $entrega_stmt->close();
                    } else {
                        $actividad['entregas'] = [];
                    }
                }

                echo json_encode(["success" => true, "actividades" => $actividades, 'query'=>$actividades_query]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al preparar la consulta: $actividades_query"]);
            }
        }
        if (isset($_GET['id_curso'])) { 
            $id_curso = intval($_GET['id_curso']);
            $rol = isset($_GET['rol']) ? intval($_GET['rol']) : 0;

            // Consulta base de actividades
            $actividades_query = "SELECT t.*, 
                                    tc.id AS id_trabajo_clase,
                                    tc.id_clase, 
                                    tc.id_usuario, 
                                    tc.fecha_fijacion, 
                                    t.tipo_trabajo AS tipo_trabajo_clase
                                FROM trabajo t
                                LEFT JOIN trabajo_clase tc ON t.id = tc.id_trabajo
                                WHERE t.id_curso = ?";

            $actividades_query .= " ORDER BY t.id DESC";

            if ($stmt = $conexion->prepare($actividades_query)) {
                $stmt->bind_param("i", $id_curso);
                $stmt->execute();
                $actividades_result = $stmt->get_result();
                $actividades = $actividades_result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();

                echo json_encode(["success" => true, "actividades" => $actividades, 'query'=>$actividades_query]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al preparar la consulta: $actividades_query"]);
            }
        }
        break;

    case 'POST':
        
            // Verifica si no hay datos o no hay archivo adjunto
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $id_curso = $_POST['id_curso'];
                $titulo = $_POST['titulo'];
                $desarrollo = $_POST['desarrollo'];
                $forma_presentacion = $_POST['forma_presentacion'];
                $tipo_trabajo = $_POST['tipo_trabajo'];
                $fecha_entrega = $_POST['fecha_entrega'];
                $material = $_POST['material'];
                $fecha_creacion = $_POST['fecha_creacion'];
                $creado_por = $_POST['creado_por'];
        
                // Manejo del archivo adjunto si existe
                $adjunto = null;
                if (isset($_FILES['adjunto']) && $_FILES['adjunto']['error'] === UPLOAD_ERR_OK) {
                    // Definir la carpeta donde se guardarán los archivos
                    $uploadDir = 'uploads/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true); // Crear la carpeta si no existe
                    }
        
                    // Guardar el archivo adjunto
                    $filename = basename($_FILES['adjunto']['name']);
                    $filePath = $uploadDir . $filename;
                    if (move_uploaded_file($_FILES['adjunto']['tmp_name'], $filePath)) {
                        $adjunto = $filePath; // Guardar la ruta del archivo en la base de datos
                    } else {
                        echo json_encode(["success" => false, "message" => "Error al subir el archivo adjunto"]);
                        exit;
                    }
                }
                 $id = $_POST['id'];
                //si el id es nulo es nueva actividad
                if($id=='null'){ 
                    // Insertar la actividad en la base de datos
                    $query = "INSERT INTO trabajo (id_curso, titulo, desarrollo, forma_presentacion, tipo_trabajo, fecha_entrega, material, adjunto, fecha_creacion, creado_por) 
                          VALUES ('$id_curso', '$titulo', '$desarrollo', '$forma_presentacion', '$tipo_trabajo', '$fecha_entrega', '$material', '$adjunto', '$fecha_creacion', '$creado_por')";
                }else{//si el id no es nulo 
                    //actualizo un trabajo
                    $query = "UPDATE `trabajo` SET id_curso='$id_curso', titulo='$titulo', desarrollo='$desarrollo', forma_presentacion='$forma_presentacion', tipo_trabajo='$tipo_trabajo', fecha_entrega='$fecha_entrega', material='$material', adjunto='$adjunto', fecha_creacion='$fecha_creacion', creado_por='$creado_por' WHERE trabajo.id = $id";
                }
                if ($stmt = $conexion->prepare($query)) {
                    $stmt->execute();
                    $id_trabajo_nuevo = $conexion->insert_id;
                    
                    // --- NOTIFICAR A ESTUDIANTES SI ES NUEVA ---
                    if ($id == 'null') {
                        $fechaHora = date('Y-m-d H:i:s');
                        $titulo_notif = "Nueva Actividad";
                        $desarrollo_notif = "El docente ha subido una nueva actividad: $titulo";
                        $tipo_notif = "actividad";
                        
                        $sql_estud = "SELECT ce.id_usuario FROM curso_estudiante ce JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id WHERE cg.id_curso = ?";
                        $stmt_est = $conexion->prepare($sql_estud);
                        $stmt_est->bind_param("i", $id_curso);
                        $stmt_est->execute();
                        $res_est = $stmt_est->get_result();
                        
                        $sql_notif = "INSERT INTO notificaciones (id_usuario, titulo, desarrollo, tipo, leida, fecha) VALUES (?, ?, ?, ?, 0, ?)";
                        $stmt_notif = $conexion->prepare($sql_notif);
                        
                        while ($row = $res_est->fetch_assoc()) {
                            $stmt_notif->bind_param("issss", $row['id_usuario'], $titulo_notif, $desarrollo_notif, $tipo_notif, $fechaHora);
                            $stmt_notif->execute();
                        }
                    }

                    echo json_encode(["success" => true, "message" => "Actividad guardada exitosamente. ". $query]);
                } else {
                    echo json_encode(["success" => false, "message" => "Error al guardar la actividad". $query]);
                }
        
                $stmt->close();
            }
    break;
        
    case 'PUT':    

    break;

    case 'DELETE':

    break;
}
$conexion->close();
?>
                