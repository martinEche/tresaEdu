
<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";
$conexion = conectarDB(); //ejecuta la funcion del conectar

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

if ($conexion === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al conectar a la base de datos']);
    exit;
}

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData, true);    //convierte el formato json a un formato php
    
$conexion->set_charset('utf8mb4');

//$dataObject = json_decode(file_get_contents('php://input'), true);
switch($method){
    case 'GET':
        if(isset($_GET['id_usiario'])){
            $id_usuario=$_GET['id_usiario'];
            if(isset($_GET['rol_usuario']) && $_GET['rol_usuario'] == '8'){
                $rol_usuario=$_GET['rol_usuario'];
                $sql="SELECT DISTINCT c.*, u.nombre as nombre_creador, u.apellido as apellido_creador, e.nombre_espacio as espacio, e.orden 
                FROM calendario c
                LEFT JOIN curso_grupo cg ON c.id_curso_grupo = cg.id
                LEFT JOIN usuarios u ON c.creada_por = u.id
                LEFT JOIN curso cu ON cg.id_curso = cu.id
                LEFT JOIN espacio e ON cu.espacio = e.id
                WHERE c.id_curso_grupo = 0 
                OR c.id_curso_grupo IN (
                    SELECT ce.id_curso_grupo FROM curso_estudiante ce 
                    JOIN vinculo v ON v.id_estudiante = ce.id_usuario 
                    WHERE v.id_tutor = $id_usuario
                )";
            }else{
                if(isset($_GET['id_curso_grupo'])){
                    $id_curso_grupo=$_GET['id_curso_grupo'];
                    $sql="SELECT DISTINCT c.*, u.nombre as nombre_creador, u.apellido as apellido_creador, e.nombre_espacio as espacio, e.orden FROM calendario c
                    LEFT JOIN curso_grupo cg ON c.id_curso_grupo = cg.id
                    LEFT JOIN curso_equipo_docente ced ON cg.id = ced.id_curso_grupo
                    LEFT JOIN usuarios u ON c.creada_por = u.id
                    LEFT JOIN curso cu ON cg.id_curso = cu.id
                    LEFT JOIN espacio e ON cu.espacio = e.id
                    WHERE 
                    (c.id_curso_grupo = $id_curso_grupo OR c.id_curso_grupo = 0)
                    AND (
                        EXISTS (
                            SELECT 1
                            FROM curso_equipo_docente ced
                            WHERE ced.id_curso_grupo = $id_curso_grupo
                            AND ced.id_usuario = $id_usuario
                            AND (ced.fecha_baja IS NULL OR ced.fecha_baja > NOW())
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM curso_estudiante ce
                            WHERE ce.id_curso_grupo = $id_curso_grupo
                            AND ce.id_usuario = $id_usuario
                        )
                        OR c.creada_por = $id_usuario
                    )";
                }else{
                    //si no viene un curso especifico busco todos los cursos en donde esta el usuario es docente 
                    // o el curso_grupo es 0 (eventos generales) 
                    // y lo filtro en la consulta para que no traiga eventos de cursos a los que no pertenece el usuario 
                    $sql="SELECT DISTINCT
                        c.*, 
                        u.nombre AS nombre_creador, 
                        u.apellido AS apellido_creador, 
                        e.nombre_espacio AS espacio, 
                        e.orden 
                        FROM calendario c
                        LEFT JOIN curso_grupo cg ON c.id_curso_grupo = cg.id
                        LEFT JOIN curso cu ON cg.id_curso = cu.id
                        LEFT JOIN espacio e ON cu.espacio = e.id
                        LEFT JOIN usuarios u ON c.creada_por = u.id
                        WHERE 
                        c.id_curso_grupo = 0
                        OR EXISTS (
                            SELECT 1 
                            FROM curso_equipo_docente ced
                            WHERE ced.id_curso_grupo = cg.id
                            AND ced.id_usuario = $id_usuario
                            AND (ced.fecha_baja IS NULL OR ced.fecha_baja > NOW())
                        )
                        OR EXISTS (
                            SELECT 1 
                            FROM curso_estudiante ce
                            WHERE ce.id_curso_grupo = cg.id
                            AND ce.id_usuario = $id_usuario
                        )
                        OR c.creada_por = $id_usuario
                        ";
                }
            }
        }else{
            $sql="SELECT id_evento, evento, fecha, hora_desde, hora_hasta, id_curso_grupo, tipo_recordatorio, creada_por, fecha_creado FROM calendario";
        }

        if($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $resultado = $nueva_consulta->get_result();
            if ($resultado->num_rows >= 1) {
                echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
            }else {
                echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
            }
        }else{
            echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
        }
        $nueva_consulta->close();
    break;

    case 'POST': 
            if (
                isset($dataObject['evento']) &&
                isset($dataObject['fecha']) &&
                isset($dataObject['hora_desde']) &&
                isset($dataObject['hora_hasta']) &&
                isset($dataObject['tipo_recordatorio']) &&
                isset($dataObject['creada_por'])
            ) {

                $evento = $dataObject['evento'];
                $fecha = $dataObject['fecha'];
                $hora_desde = $dataObject['hora_desde'];
                $hora_hasta = $dataObject['hora_hasta'];
                $id_curso_grupo = $dataObject['id_curso_grupo'];
                $tipo_recordatorio = $dataObject['tipo_recordatorio'];
                $creada_por = $dataObject['creada_por'];

                $respuesta = ['error', 'No se ejecuto consulta'];
                $fechaHora=date('Y-m-d H:i:s'); 
                    
                $sql2="INSERT INTO calendario(`evento`, `fecha_creado`, `hora_desde`, `hora_hasta`, `id_curso_grupo`, `tipo_recordatorio`, `creada_por`, `fecha`) VALUES ('$evento','$fechaHora','$hora_desde','$hora_hasta','$id_curso_grupo','$tipo_recordatorio','$creada_por','$fecha')";
                $msg='Se creo el evento';
                $error='No se pudo crear el evento';           
                          if($nueva_consulta = $conexion->prepare($sql2)){
                    $nueva_consulta->execute();
                    $id_insertado = $conexion->insert_id;
                    $respuesta = ['success',  $msg];
                    
                    // --- NOTIFICAR SI EL EVENTO ES PARA HOY ---
                    if ($fecha === date('Y-m-d')) {
                        require_once __DIR__ . '/enviar_push.php';
                        require_once __DIR__ . '/enviar_email.php';
                        
                        // 1. Buscar destinatarios
                        if ($id_curso_grupo > 0) {
                            $sql_users = "
                                SELECT DISTINCT u.id, u.usuario, up.email, t.token, r.rol, u.nombre, u.apellido
                                FROM usuarios u
                                INNER JOIN rol r ON u.id = r.id_usuario
                                LEFT JOIN usuario_perfil up ON u.id = up.id_usuario
                                LEFT JOIN fcm_tokens t ON u.id = t.usuario_id
                                WHERE u.id IN (
                                    SELECT id_usuario FROM curso_estudiante WHERE id_curso_grupo = ?
                                    UNION
                                    SELECT id_usuario FROM curso_equipo_docente WHERE id_curso_grupo = ? AND (fecha_baja IS NULL OR fecha_baja > NOW())
                                )
                            ";
                            $stmt_users = $conexion->prepare($sql_users);
                            if ($stmt_users) {
                                $stmt_users->bind_param("ii", $id_curso_grupo, $id_curso_grupo);
                            }
                        } else {
                            $sql_users = "
                                SELECT DISTINCT u.id, u.usuario, up.email, t.token, r.rol, u.nombre, u.apellido
                                FROM usuarios u
                                INNER JOIN rol r ON u.id = r.id_usuario
                                LEFT JOIN usuario_perfil up ON u.id = up.id_usuario
                                LEFT JOIN fcm_tokens t ON u.id = t.usuario_id
                            ";
                            $stmt_users = $conexion->prepare($sql_users);
                        }
                        
                        if ($stmt_users) {
                            $stmt_users->execute();
                            $res_users = $stmt_users->get_result();
                            
                            $recipients = [];
                            $matchesRole = function($userRol, $tr) {
                                $userRol = intval($userRol);
                                if ($tr === 'todos' || $tr === 'todosDETC') return true;
                                if ($userRol === 1 || $userRol === 2 || $userRol === 3 || $userRol === 4) return in_array($tr, ['todosA']);
                                if ($userRol === 5 || $userRol === 6) return in_array($tr, ['todosD', 'todosDC']);
                                if ($userRol === 7) return in_array($tr, ['todosE', 'todosEC']);
                                if ($userRol === 8) return in_array($tr, ['todosT', 'todoTC']);
                                if ($userRol === 12) return in_array($tr, ['todosM']);
                                return false;
                            };
                            
                            while ($row = $res_users->fetch_assoc()) {
                                $uid = intval($row['id']);
                                if ($uid == $creada_por) continue;
                                
                                if ($matchesRole($row['rol'], $tipo_recordatorio)) {
                                    if (!isset($recipients[$uid])) {
                                        $recipients[$uid] = [
                                            'id' => $uid,
                                            'usuario' => $row['usuario'],
                                            'email' => $row['email'],
                                            'nombre' => trim(($row['nombre'] ?? '') . ' ' . ($row['apellido'] ?? '')),
                                            'tokens' => []
                                        ];
                                    }
                                    if (!empty($row['token'])) {
                                        $recipients[$uid]['tokens'][] = $row['token'];
                                    }
                                }
                            }
                            $stmt_users->close();
                            
                            // Enviar notificaciones
                            $uniqueValue = microtime(true) . '_' . uniqid();
                            $title = "Evento hoy en la agenda";
                            $body = "Hoy: " . $evento . " (" . $hora_desde . " a " . $hora_hasta . ")";
                            
                            $patchRTDB = function($path, $payload) {
                                $opts = [
                                    "http" => ["method" => "PATCH", "header" => "Content-Type: application/json\r\n", "content" => json_encode($payload)]
                                ];
                                $context = stream_context_create($opts);
                                @file_get_contents(FIREBASE_DB_URL . "/$path.json", false, $context);
                            };
                            
                            foreach ($recipients as $uid => $rec) {
                                // A. Firebase RTDB
                                $patchRTDB("agenda/user_$uid", ["lastUpdate" => $uniqueValue]);
                                
                                // B. FCM Push
                                foreach ($rec['tokens'] as $token) {
                                    $dataPush = [
                                        'url' => obtenerFrontendUrlDinamico() . "/Agenda"
                                    ];
                                    $dataPushFormateada = [];
                                    foreach ($dataPush as $k => $v) {
                                        $dataPushFormateada[(string)$k] = (string)$v;
                                    }
                                    enviarPushFirebase($token, $title, $body, $dataPushFormateada);
                                }
                                
                                // C. Correo Electrónico
                                if (!empty($rec['email'])) {
                                    $asuntoEmail = "Evento programado para hoy: " . $evento;
                                    $cuerpoEmail = "Hola " . htmlspecialchars($rec['nombre']) . ",<br><br>Te recordamos que tienes un evento programado para el día de hoy en el calendario:<br><br><strong>Evento:</strong> " . htmlspecialchars($evento) . "<br><strong>Horario:</strong> " . htmlspecialchars($hora_desde) . " a " . htmlspecialchars($hora_hasta) . "<br><br>¡Que tengas un excelente día!";
                                    $urlAcceso = obtenerFrontendUrlDinamico() . "/Agenda";
                                    $htmlEmail = obtenerPlantillaEmail("Recordatorio de Evento", $cuerpoEmail, $urlAcceso);
                                    enviarEmailPlataforma($rec['email'], $asuntoEmail, $htmlEmail);
                                }
                            }
                        }
                    }
                }else{
                    $respuesta = ['error', $error];
                }
                $nueva_consulta->close();
                echo json_encode($respuesta);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos']);
            } 
        break;

   case 'PUT':
        break;

    case 'DELETE';
    if(!isset($dataObject['id'])){
        $respuesta= ['error','El ID no debe estar vacío'];
    }else{
        $id = $dataObject['id'];
        if($dataObject['tabla']){
            $tabla = $dataObject['tabla'];
            if($tabla=="calendario"){
                 $mensaje='Evento eliminado';
                 $sql_delete= "DELETE FROM ".$tabla." where id_evento='$id'";
            }else{
                $sql_delete= "DELETE FROM ".$tabla." where id='$id'";
            }
            if($tabla=="trabajo_clase") $mensaje='actividad quitada de la clase';
            if($tabla=="material_clase") $mensaje='material quitado de la clase';
        }else{
            $sql_delete= "DELETE FROM Clase where id='$id'";
            $mensaje='Clase eliminada';
        }
        if ($nueva_consulta = $conexion->prepare($sql_delete)) {
            $nueva_consulta->execute();

           $respuesta = ['success',$mensaje];
        }else{
            $respuesta = ['error','fallo la eliminación'];
        }
        $nueva_consulta->close();       
    }
    echo json_encode($respuesta);
    break;
}
$conexion->close();
?>            