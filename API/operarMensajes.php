<?php
require_once __DIR__ . '/config_cors.php';
// operarMensajes.php (solo DB, sin push/Firebase)

header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();

//para usar caracteres especiales
$conexion->set_charset("utf8mb4");
$conexion->query("SET NAMES utf8mb4");
$conexion->query("SET CHARACTER SET utf8mb4");

$JSONData = file_get_contents("php://input");
$dataObject = json_decode($JSONData);

// ------------------
// GET: obtener mensajes
// ------------------ 

if (isset($dataObject->id_usuario)) {
    $id_usuario = intval($dataObject->id_usuario);    
    $sql = "(
            SELECT m.id_mensaje, m.de, m.para, me.estado, m.asunto, m.mensaje, m.fecha, 'enviado' AS tipo, m.id_curso,
                u_dest.nombre AS nombre, u_dest.apellido AS apellido
            FROM mensajes m
            INNER JOIN mensajes_enviados me ON me.id_mensaje = m.id_mensaje
            INNER JOIN usuarios u_origen ON u_origen.usuario = m.de
            INNER JOIN usuarios u_dest ON u_dest.usuario = me.usuario
            WHERE u_origen.id = ?
        )
        UNION ALL
        (
            SELECT m.id_mensaje, m.de, m.para, mr.estado, m.asunto, m.mensaje, m.fecha, 'recibido' AS tipo, m.id_curso,
                u_origen.nombre AS nombre, u_origen.apellido AS apellido
            FROM mensajes m
            INNER JOIN mensajes_recibidos mr ON mr.id_mensaje = m.id_mensaje
            INNER JOIN usuarios u_origen ON u_origen.usuario = m.de
            INNER JOIN usuarios u_dest ON u_dest.usuario = mr.usuario
            WHERE u_dest.id = ?
        )
        ORDER BY fecha DESC";

    if ($stmt = $conexion->prepare($sql)) {
        $stmt->bind_param('ii', $id_usuario, $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $out = $res->num_rows >= 1 ? $res->fetch_all(MYSQLI_ASSOC) : [];
        echo json_encode($out);
        $stmt->close();
        exit;
    } else {
        echo json_encode(['resultado' => false, 'error' => 'No se pudo preparar la consulta']);
        exit;
    }
}
if (isset($_GET['id_curso_grupo'])) {
    $id_curso_grupo = intval($_GET['id_curso_grupo']);   
    if($id_curso_grupo >= 0 || (isset($_GET['tipo']) && $_GET['tipo'] === 'C')){
        $sql = "SELECT 
                    u.nombre, 
                    u.apellido,
                    u.id as id_usuario,
                    e.nombre_espacio, 
                    e.orden, 
                    c.nombre AS nombre_curso,
                    c.estado,
                    cg.seccion, 
                    cg.denominacion,
                    '' as imagen, 
                    m.*,
                    mr.estado as estado_recibido,
                    me.estado as estado_enviado,
                    mr.id_mensajeR                   
                FROM mensajes m
                INNER JOIN curso_grupo cg   ON cg.id = m.id_curso
                INNER JOIN curso c          ON c.id = cg.id_curso
                INNER JOIN espacio e        ON e.id = c.espacio
                INNER JOIN usuarios u       ON u.usuario = m.de
                LEFT JOIN mensajes_recibidos mr ON mr.id_mensaje=m.id_mensaje and mr.usuario= m.de
                LEFT JOIN mensajes_enviados me ON me.id_mensaje=m.id_mensaje
                WHERE m.id_curso = ?
                ORDER BY m.fecha ASC";
    }else{
        //grupo personalizado, busco los mensajes asociados al grupo personalizado (id_curso negativo)      
//        $sql="SELECT 
//                    u.nombre, 
//                    u.apellido,
//                    u.id as id_usuario,
//                    mgc.nombre_grupo as nombre_espacio, 
//                    '-' as orden, 
//                    '-' AS nombre_curso,
//                    'Abierto' as estado,
//                    '-' as seccion, 
//                    mgc.descripcion as denominacion, 
//                    mgc.imagen,
//                    m.*
//                FROM mensajes m
//                INNER JOIN mensajes_grupo_creado mgc ON mgc.id = ABS(m.id_curso)
//                INNER JOIN usuarios u ON u.usuario = m.de
//                WHERE m.id_curso = ?
//                ORDER BY m.fecha ASC";
                
        $sql="SELECT 
                    u.nombre, 
                    u.apellido, 
                    u.id AS id_usuario, 
                    mgc.nombre_grupo AS nombre_espacio, 
                    '-' AS orden, 
                    mgc.nombre_grupo AS nombre_curso, 
                    'Abierto' AS estado, 
                    '-' AS seccion, 
                    mgc.descripcion AS denominacion, 
                    mgc.imagen, 
                    m.*,
                    mr.estado as estado_recibido,
                    me.estado as estado_enviado,
                    mr.id_mensajeR
                    
                FROM mensajes_grupo_creado mgc

                LEFT JOIN mensajes m ON mgc.id = ABS(m.id_curso)
                    AND m.id_curso = ?
                LEFT JOIN usuarios u ON u.usuario = m.de
                LEFT JOIN mensajes_recibidos mr ON mr.id_mensaje=m.id_mensaje and mr.usuario= m.de
                LEFT JOIN mensajes_enviados me ON me.id_mensaje=m.id_mensaje
                WHERE mgc.id = ABS(?)

                ORDER BY m.fecha ASC";

    }
    if ($stmt = $conexion->prepare($sql)) {
        if($id_curso_grupo >= 0 || (isset($_GET['tipo']) && $_GET['tipo'] === 'C')){
            $stmt->bind_param('i', $id_curso_grupo);
        }else{
            $stmt->bind_param('ii', $id_curso_grupo, $id_curso_grupo);
        }
        $stmt->execute();
        $res = $stmt->get_result();
        $mensajes = $res->num_rows >= 1 ? $res->fetch_all(MYSQLI_ASSOC) : [];
        //aca marcar como leidos todos los mensajes recibidos por el usuario de este grupo tabla mensajes _recibidos 
        if (!empty($mensajes)) {
            $usuarioActual = intval($_GET['id_usuario']);// o de sesión
            // ejecutar update
            $sqlUpdate = "UPDATE mensajes_recibidos mr
                        INNER JOIN mensajes m ON m.id_mensaje = mr.id_mensaje
                        INNER JOIN usuarios u ON u.usuario = mr.usuario
                        SET mr.estado = 1
                        WHERE u.id = ?
                        AND m.id_curso = ?
                        AND mr.estado = 0";
           
            if ($stmtUpdate = $conexion->prepare($sqlUpdate)) {
                $stmtUpdate->bind_param('ii', $usuarioActual, $id_curso_grupo);
                $stmtUpdate->execute();
                $stmtUpdate->close();
            }
        }

        if($id_curso_grupo >= 0){
            $sqlParticipantes = " SELECT DISTINCT u.usuario, u.nombre, u.apellido, u.id, usuarios_grupo.rolNombre
                                FROM usuarios u
                                INNER JOIN (
                                    SELECT ce.id_usuario, 'estudiante' AS rolNombre
                                    FROM curso_estudiante ce
                                    WHERE ce.id_curso_grupo =  $id_curso_grupo

                                    UNION

                                    SELECT ced.id_usuario, 'docente' AS rolNombre
                                    FROM curso_equipo_docente ced
                                    WHERE ced.id_curso_grupo =  $id_curso_grupo
                                ) AS usuarios_grupo
                                ON u.id = usuarios_grupo.id_usuario
                                order by usuarios_grupo.rolNombre asc, u.apellido ASC, u.nombre ASC";
        }else{
            //grupo personalizado, busco los participantes asociados al grupo personalizado (id_curso negativo)
            $sqlParticipantes = " SELECT DISTINCT u.usuario, u.nombre, u.apellido, u.id, mgp.estado AS rolNombre
                                FROM usuarios u
                                INNER JOIN mensajes_grupo_participantes mgp ON mgp.id_usuario = u.id
                                WHERE mgp.id_mensaje_grupo = ABS( $id_curso_grupo) 
                                order by u.apellido ASC, u.nombre ASC";
        }
        if ($stmtParticipantes = $conexion->prepare($sqlParticipantes)) {
            $stmtParticipantes->execute();
            $resParticipantes = $stmtParticipantes->get_result();
            $participantes = $resParticipantes->num_rows >= 1 ? $resParticipantes->fetch_all(MYSQLI_ASSOC) : [];
        }else {
            echo json_encode(['resultado' => false, 'error' => 'No se pudo preparar la consulta de participantes']);
            exit;
        }
        echo json_encode(['mensajes' => $mensajes, 'participantes' => $participantes]);
        $stmt->close();
        exit;
    } else {
        echo json_encode(['resultado' => false, 'error' => 'No se pudo preparar la consulta']);
        exit;
    }
}

// ------------------
// DELETE: manejo de borrado/ocultado
// ------------------
if ($method == 'DELETE') {
    $raw = file_get_contents("php://input");
    $dataObject = json_decode($raw, true);
    if (!isset($dataObject['id'])) {
        $respuesta = ['error', 'El ID no debe estar vacío'];
    } else {
        $id = intval($dataObject['id']);
        $tabla = $dataObject['tabla'] ?? '';

        // ==========================================
        // ELIMINACIÓN FÍSICA DE ADJUNTOS POR EL CREADOR
        // ==========================================
        $id_mensaje_a_eliminar = null;
        if ($tabla == 'chat') {
            $id_mensaje_a_eliminar = $id;
        } elseif ($tabla == 'mensajes_enviados' || $tabla == 'enviado') {
            $stmt_get = $conexion->prepare("SELECT id_mensaje FROM mensajes_enviados WHERE id_mensajeE=?");
            if ($stmt_get) {
                $stmt_get->bind_param("i", $id);
                $stmt_get->execute();
                $res_get = $stmt_get->get_result();
                if ($row = $res_get->fetch_assoc()) {
                    $id_mensaje_a_eliminar = $row['id_mensaje'];
                }
                $stmt_get->close();
            }
        }

        if ($id_mensaje_a_eliminar !== null) {
            $stmt_adj = $conexion->prepare("SELECT path_archivo FROM mensajes_adjunto WHERE id_mensaje=?");
            if ($stmt_adj) {
                $stmt_adj->bind_param("i", $id_mensaje_a_eliminar);
                $stmt_adj->execute();
                $res_adj = $stmt_adj->get_result();
                while ($adj = $res_adj->fetch_assoc()) {
                    $ruta_archivo = __DIR__ . '/' . $adj['path_archivo'];
                    if (file_exists($ruta_archivo) && is_file($ruta_archivo)) {
                        unlink($ruta_archivo);
                    }
                }
                $stmt_adj->close();
            }
            $stmt_del_adj = $conexion->prepare("DELETE FROM mensajes_adjunto WHERE id_mensaje=?");
            if ($stmt_del_adj) {
                $stmt_del_adj->bind_param("i", $id_mensaje_a_eliminar);
                $stmt_del_adj->execute();
                $stmt_del_adj->close();
            }
        }
        // ==========================================

        if ($tabla == 'mensajes_recibidos') {
            //busco el id del mensaje de la tabla mensajes
            //berifico si es mensaje grupal/curso id_curso<>0
            //marco como eliminado para todos los receptores del mensaje grupal/curso
            $sql_verificacion="SELECT m.* FROM mensajes_recibidos as mr, mensajes as m 
                                WHERE m.id_mensaje=mr.id_mensaje and m.id_curso<>0 and mr.id_mensajeR=?";
            //ejecuto la consulta de verificacion para saber si es mensaje grupal/curso
            if($stmt_verificacion = $conexion->prepare($sql_verificacion)){
                $stmt_verificacion->bind_param("i", $id);
                $stmt_verificacion->execute();
                $res_verificacion = $stmt_verificacion->get_result();
                if($res_verificacion && $res_verificacion->num_rows > 0){
                    //es mensaje grupal/curso, marco como eliminado para todos los receptores del mensaje
                    //obtengo el id_mensaje para marcar como eliminado a todos los receptores de ese mensaje
                    $fila = $res_verificacion->fetch_assoc();
                    $id_mensaje = $fila['id_mensaje'];

                    $query="UPDATE mensajes_recibidos mr SET mr.estado=3 
                            WHERE mr.id_mensaje=?";
                    // pongo $id como el id del mensaje para marcar como eliminado a todos 
                    // los que recivieron el mensaje grupal
                    $id=$id_mensaje;
                }else{
                    //no es mensaje grupal/curso, marco como eliminado solo para el receptor
                    $query="UPDATE mensajes_recibidos SET estado=3 WHERE id_mensajeR=?";
                }
                $stmt_verificacion->close();
            }
        } elseif ($tabla == 'mensajes_enviados') {
            $query = "UPDATE mensajes_enviados SET estado=3 WHERE id_mensajeE=?";
        } elseif ($tabla == 'enviado') {
            $query = "DELETE FROM mensajes_enviados WHERE id_mensajeE=?";
        } elseif ($tabla == 'recibido') {
            $query = "DELETE FROM mensajes_recibidos WHERE id_mensajeR=?";
        } elseif ($tabla == 'chat') {
            $query_enviados = "UPDATE mensajes_enviados SET estado=3 WHERE id_mensaje=?";
            if ($stmt2 = $conexion->prepare($query_enviados)) {
                $stmt2->bind_param("i", $id);
                $stmt2->execute();
                $stmt2->close();
            }
            $query = "UPDATE mensajes_recibidos SET estado=3 WHERE id_mensaje=?";
        } else {
            $query = null;
        }

        if ($query) {
            if ($stmt = $conexion->prepare($query)) {
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $respuesta = ['success', 'Operación realizada'];
                $stmt->close();
            } else {
                $respuesta = ["error", "fallo la operación"];
            }
        } else {
            $respuesta = ["error", "tabla inválida"];
        }
    }
    echo json_encode($respuesta);
    exit;
}

// ------------------
// POST: enviar mensaje (DB)
// ------------------
if ($method == 'POST') {
    if (isset($_POST['modo']) && $_POST['modo'] === 'crear_grupo') {
        $nombreGrupo = isset($_POST['nombre_grupo']) ? $conexion->real_escape_string($_POST['nombre_grupo']) : '';
        $descripcion = isset($_POST['descripcion']) ? $conexion->real_escape_string($_POST['descripcion']) : '';
        $participantes = json_decode($_POST['participantes'], true);

        $id_usuario_creador = isset($_POST['id_usuario_creador']) ? intval($_POST['id_usuario_creador']) : 0;
        $fechaHora = date('Y-m-d H:i:s');

        // INSERT GRUPO
        $queriGrupo="INSERT INTO mensajes_grupo_creado (nombre_grupo, descripcion, creado_por, imagen) VALUES (?, ?, ?, '')";
        
        if($queryGrupoCreado = $conexion->prepare($queriGrupo)){      
            $queryGrupoCreado->bind_param("ssi",$nombreGrupo, $descripcion, $id_usuario_creador);
            $queryGrupoCreado->execute();
            $queryGrupoCreado->close();

            $id_grupo_creado = $conexion->insert_id;

            // =========================
            // MANEJO DE IMAGEN
            // ==========================
            if (isset($_FILES['imagen_grupo']) && $_FILES['imagen_grupo']['error'] === 0) {

                $carpetaDestino = __DIR__ . "/foto_perfil/";
                
                // crear carpeta si no existe
                if (!file_exists($carpetaDestino)) {
                    mkdir($carpetaDestino, 0777, true);
                }

                $nombreOriginal = $_FILES['imagen_grupo']['name'];
                $tmp = $_FILES['imagen_grupo']['tmp_name'];

                // obtener extensión
                $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));

                // validar tipo
                $extPermitidas = ['jpg', 'jpeg', 'png', 'webp'];
                if (in_array($extension, $extPermitidas)) {
                    $nuevoNombre = "grupoPerfil" . $id_grupo_creado . "." . $extension;
                    $rutaFinal = $carpetaDestino . $nuevoNombre;

                    if (move_uploaded_file($tmp, $rutaFinal)) {
                        // guardar ruta en BD
                        $rutaBD = "foto_perfil/" . $nuevoNombre;
                        $updateImg = $conexion->prepare("UPDATE mensajes_grupo_creado SET imagen = ? WHERE id = ?");
                        $updateImg->bind_param("si", $rutaBD, $id_grupo_creado);
                        $updateImg->execute();
                        $updateImg->close();
                    }
                }
            }

            // =========================
            // PARTICIPANTES
            // ==========================
            $estado='participante';
            foreach($participantes as $idUsuario){
                $sqlParticipntes="INSERT INTO mensajes_grupo_participantes (id_mensaje_grupo, id_usuario, fecha_ingreso, ingresado_por, estado) VALUES (?, ?, ?, ?,?)";
                $queryGrupoParticipantes = $conexion->prepare($sqlParticipntes);
                $queryGrupoParticipantes->bind_param("iisis", $id_grupo_creado, $idUsuario, $fechaHora, $id_usuario_creador, $estado);
                $queryGrupoParticipantes->execute();
                $queryGrupoParticipantes->close();
            }

            // creador como admin
            $estado='administrador';
            $queryGrupoParticipantes = $conexion->prepare("INSERT INTO mensajes_grupo_participantes (id_mensaje_grupo, id_usuario, fecha_ingreso, ingresado_por, estado) VALUES (?, ?, ?, ?,?)");
            $queryGrupoParticipantes->bind_param("iisis", $id_grupo_creado, $id_usuario_creador, $fechaHora, $id_usuario_creador,$estado);
            $queryGrupoParticipantes->execute();
            $queryGrupoParticipantes->close();
        
            echo json_encode(['success' => true, 'id_grupo_creado' => $id_grupo_creado]);
            exit;
        } else {
            echo json_encode(['success' => false, 'error' => 'No se pudo crear el grupo']);
            exit;
        }
    }else{
        // si es editar  grupo de mensajes ingreso aqui
        if (isset($_POST['modo']) && $_POST['modo'] === 'edita_grupo') {
            $nombreGrupo = isset($_POST['nombre_grupo']) ? $conexion->real_escape_string($_POST['nombre_grupo']) : '';
            $descripcion = isset($_POST['descripcion']) ? $conexion->real_escape_string($_POST['descripcion']) : '';
            
            $id_usuario_creador = isset($_POST['id_usuario_creador']) ? intval($_POST['id_usuario_creador']) : 0;
            $fechaHora = date('Y-m-d H:i:s');

            $id_grupo=$_POST['id'];

            // actualizar el GRUPO
            //$queriGrupo="UPDATE INTO mensajes_grupo_creado (nombre_grupo, descripcion, creado_por) VALUES (?, ?, ?)";
            $queriGrupo="UPDATE mensajes_grupo_creado 
                            SET nombre_grupo=?,
                                descripcion=?,
                                creado_por=?
                            WHERE id=?";
            if($queryGrupoCreado = $conexion->prepare($queriGrupo)){      
                $queryGrupoCreado->bind_param("ssii",$nombreGrupo, $descripcion, $id_usuario_creador,$id_grupo);
                $queryGrupoCreado->execute();
                $queryGrupoCreado->close();

                // =========================
                // MANEJO DE IMAGEN
                // ==========================
                if (isset($_FILES['imagen_grupo']) && $_FILES['imagen_grupo']['error'] === 0) {

                    $carpetaDestino = __DIR__ . "/foto_perfil/";

                    if (!file_exists($carpetaDestino)) {
                        mkdir($carpetaDestino, 0777, true);
                    }

                    // 🔹 1. BUSCAR IMAGEN ACTUAL
                    $stmtImg = $conexion->prepare("SELECT imagen FROM mensajes_grupo_creado WHERE id = ?");
                    $stmtImg->bind_param("i", $id_grupo);
                    $stmtImg->execute();
                    $resImg = $stmtImg->get_result();
                    $imgActual = $resImg->fetch_assoc();
                    $stmtImg->close();

                    // 🔹 2. ELIMINAR IMAGEN ANTERIOR SI EXISTE
                    if (!empty($imgActual['imagen'])) {
                        $rutaAnterior = __DIR__ . "/" . $imgActual['imagen'];

                        if (file_exists($rutaAnterior)) {
                            unlink($rutaAnterior); // borra archivo viejo
                        }
                    }
                    // 🔹 3. SUBIR NUEVA IMAGEN
                    $nombreOriginal = $_FILES['imagen_grupo']['name'];
                    $tmp = $_FILES['imagen_grupo']['tmp_name'];

                    $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));
                    $extPermitidas = ['jpg', 'jpeg', 'png', 'webp'];

                    if (in_array($extension, $extPermitidas)) {
                        $timestamp = date('YmdHis'); // más prolijo que time()
                        $nuevoNombre = "grupoPerfil_" . $id_grupo . "_" . $timestamp . "." . $extension;
                        //$nuevoNombre = "grupoPerfil" . $id_grupo . "." . $extension;
                        $rutaFinal = $carpetaDestino . $nuevoNombre;

                        if (move_uploaded_file($tmp, $rutaFinal)) {
                            $rutaBD = "foto_perfil/" . $nuevoNombre;
                            $updateImg = $conexion->prepare("UPDATE mensajes_grupo_creado SET imagen = ? WHERE id = ?");
                            $updateImg->bind_param("si", $rutaBD, $id_grupo);
                            $updateImg->execute();
                            $updateImg->close();
                        }
                    }
                }
                echo json_encode(['success' => true, 'id_grupo' => $id_grupo]);
                exit;
            } else {
                echo json_encode(['success' => false, 'error' => 'No se pudo actualizar el grupo'. $queriGrupo."-".$nombreGrupo."-".$descripcion."-".$id_usuario_creador."-".$id_grupo]);
                exit;
            }    
        }else{
        // Es insertar mensaje en la tabla mensajes, 
        // luego insertar en mensajes_enviados y mensajes_recibidos, 
        // y retorna datos para notificación

            // CONTROL GLOBAL DE TAMAÑO DEL POST
            $maxPostSize = 100 * 1024 * 1024; // 100MB

            if ( isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > $maxPostSize) {
                echo json_encode(['error' => 'El tamaño total de los archivos supera el máximo permitido de 100MB']);
                exit;
            }
            $de = isset($_POST['de']) ? $conexion->real_escape_string($_POST['de']) : '';
            $para = isset($_POST['para']) ? $conexion->real_escape_string($_POST['para']) : '';
            $asunto = isset($_POST['asunto']) ? $conexion->real_escape_string($_POST['asunto']) : '';
            $mensaje = isset($_POST['mensaje']) ? $conexion->real_escape_string($_POST['mensaje']) : '';
            $id_mensajeR = isset($_POST['respuesta_a']) ? intval($_POST['respuesta_a']) : 0;

            if (is_object($dataObject) && empty($_POST)) {
                if (isset($dataObject->de)) $de = $conexion->real_escape_string($dataObject->de);
                if (isset($dataObject->para)) $para = $conexion->real_escape_string($dataObject->para);
                if (isset($dataObject->asunto)) $asunto = $conexion->real_escape_string($dataObject->asunto);
                if (isset($dataObject->mensaje)) $mensaje = $conexion->real_escape_string($dataObject->mensaje);
                if (isset($dataObject->respuesta_a)) $id_mensajeR = intval($dataObject->respuesta_a);
            }

            $respuesta_a = 0;
            if ($id_mensajeR > 0) {
                $sql_u = "SELECT id_mensaje FROM mensajes_recibidos WHERE id_mensajeR=? LIMIT 1";
                if ($stmt = $conexion->prepare($sql_u)) {
                    $stmt->bind_param("i", $id_mensajeR);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    $msj = $res->fetch_assoc();
                    $respuesta_a = isset($msj['id_mensaje']) ? intval($msj['id_mensaje']) : 0;
                    $stmt->close();
                }
            }

            // Adjuntos
            //si hay adjunto archivos desde file
            $adjunto = (count($_FILES) > 0) ? 'Si' : 'NO';
            $cantidad = count($_FILES);
            //si hay adjunto un audio lo considero adjunto 
             if (isset($_FILES['audio'])) {
                $adjunto='Si';
             }

            $fechaHora = date('Y-m-d H:i:s');
            $error = "";
            $id_curso=0; // manejo de mensajes individuales o a grupos de un curso 0=individual, >0 curso específico

            //analizo para si es individual o grupal 
            // y lo preparo para la insercion en la tabla mensajes, 
            // para luego insertar en mensajes_enviados y mensajes_recibidos
            //$para = trim($para);
            
            // limpiamos el formato que envía el autocompletado (ej: "admin2 <<admin2 admin2>>")
            // Nos quedamos solo con la primera palabra (el username), sin romper el formato de grupos (@Grupo, #id)
            $para = preg_replace('/\s*<<.*?>>/', '', $para);
            $para = trim($para);

            if (preg_match('/^@/', $para)) {
                // envio a un grupo
                // ---- CASO @formacion, año, #grupo ----
                // Separar por coma
                $partes = explode(',', $para);
                $grupo = null;
                foreach ($partes as $p) {
                    $p = trim($p);
                    if (preg_match('/#(-?\d+)/', $p, $match)) {
                        $grupo = (int) $match[1]; // número después de #
                        $id_curso=$grupo;
                        break;
                    }
                }
                if ($grupo !== null) {
                //si es mayor que 0 es un grupo de un curso es específico, 
                //si es negativo es un grupo personalizado (negativo para diferenciar)
                    if ($grupo > 0) {
                        $sql = " SELECT DISTINCT u.usuario
                            FROM usuarios u
                            INNER JOIN (
                                SELECT ce.id_usuario
                                FROM curso_estudiante ce
                                WHERE ce.id_curso_grupo = ?
                                UNION
                                SELECT ced.id_usuario
                                FROM curso_equipo_docente ced
                                WHERE ced.id_curso_grupo = ?
                            ) AS usuarios_grupo
                            ON u.id = usuarios_grupo.id_usuario";
                        if ($stmt = $conexion->prepare($sql)) {
                            $stmt->bind_param("ii", $grupo, $grupo);
                            $stmt->execute();
                            $resultado = $stmt->get_result();
                            $usuarios = [];
                            while ($row = $resultado->fetch_assoc()) {
                                $usuarios[] = $row['usuario'];
                            }
                            $para = implode(', ', $usuarios);
                            $stmt->close();
                        }
                    } else {
                        //grupo personalizado, busco los usuarios asociados al grupo personalizado
                        //busco por grupo pero en positivo en la tabla de mensajes_grupo_participantes 
                        // los participantes para enviar mensaje
                    $sql = " SELECT DISTINCT u.usuario
                                FROM usuarios u
                                INNER JOIN mensajes_grupo_participantes mgp ON mgp.id_usuario = u.id
                                WHERE mgp.id_mensaje_grupo = ?";
                        if ($stmt = $conexion->prepare($sql)) {
                            $grupoPersonalizadoId = abs($grupo); // uso el valor absoluto para buscar en la tabla
                            $stmt->bind_param("i", $grupoPersonalizadoId);
                            $stmt->execute();
                            $resultado = $stmt->get_result();
                            $usuarios = [];
                            while ($row = $resultado->fetch_assoc()) {
                                $usuarios[] = $row['usuario'];
                            }
                            $para = implode(', ', $usuarios);
                            $stmt->close();
                        }
                    }
                }
            } else {
                // Destinatarios individuales o difusión
                $para_arreglo = explode(",", $para);
                $usuarios_limpios = [];
                foreach ($para_arreglo as $usuario) {
                    $usuario = trim($usuario);
                    if ($usuario !== '') {
                        $usuarios_limpios[] = $usuario;
                    }
                }
                $para = implode(', ', $usuarios_limpios);
                $id_curso = 0;
            }

            // Inserto mensaje
            $query1 = $conexion->prepare("INSERT INTO mensajes (de, para, id_curso, asunto, mensaje, adjunto, fecha, respuesta_a) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $query1->bind_param("ssissssi", $de, $para, $id_curso, $asunto, $mensaje, $adjunto, $fechaHora, $respuesta_a);
            $query1->execute();
            $id_insertado = $conexion->insert_id;
            $query1->close();

            // Manejo adjuntos
            if ($adjunto == 'Si') {
                //Tamaño máximo permitido (50 MB)
                $maxSize = 50 * 1024 * 1024;

                //chequeo si adjunto es un audio
                if (isset($_FILES['audio'])) {
                    if ($_FILES['audio']['size'] > $maxSize) {
                        $error .= ' - El audio supera el tamaño máximo permitido de 50MB';
                    } else {
                        $nombrePath = "audio_" . time() . "_" . uniqid() . ".webm";
                        
                        $directorio = 'adjuntos';
                        if (!file_exists($directorio)) mkdir($directorio, 0777); //lo cro si no existe

                        $target_path = $directorio . '/' . $nombrePath;
                        $fuente = $_FILES['audio']['tmp_name'];
                        if (move_uploaded_file($fuente, $target_path)) {
                            // guardás en BD 
                            //insertar los datos en la tabla
                            $query2 = $conexion->prepare("INSERT INTO mensajes_adjunto (id_mensaje, path_archivo, nombre_archivo) VALUES (?, ?, ?)");
                            $query2->bind_param("iss", $id_insertado, $target_path, $nombrePath);
                            $query2->execute();
                            $query2->close();
                        } else $error .= ' - Error adjuntando archivo de audio';
                    }
                }else{
                    //No es audio
                    for ($i = 0; $i < $cantidad; $i++) {
                        if (isset($_FILES["file" . $i]) && $_FILES["file" . $i]["name"]) {

                            if ($_FILES["file" . $i]["size"] > $maxSize) {
                                $error .= ' - El archivo ' . $_FILES["file" . $i]["name"] . ' supera el tamaño máximo permitido de 50MB';
                                continue;
                            }
                            //Preparo el nombre
                            $file_parts = explode(".", $_FILES["file" . $i]["name"]);
                            $extension = strtolower(end($file_parts));
                            
                            // VALIDAMOS QUE NO NOS QUIERAN INYECTAR UN ARCHIVO MALICIOSO 
                            $extPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'mp4', 'webm', 'ogg', 'mp3', 'wav'];
                            if (!in_array($extension, $extPermitidas)) {
                                $error .= ' - Extensión no permitida: ' . $_FILES["file" . $i]["name"];
                                continue;
                            }

                            $nombreOriginal = $_FILES["file" . $i]["name"];
                            $nombrePath = $id_insertado . "_adjunto_n" . $i . "." . $extension;
                            $fuente = $_FILES["file" . $i]["tmp_name"];
                            //directorio donde lo guardo
                            $directorio = 'adjuntos';
                            if (!file_exists($directorio)) mkdir($directorio, 0777); //lo cro si no existe

                            $target_path = $directorio . '/' . $nombrePath;

                            //# # # # # # # # # # # # # # # # # # # # # # # # #
                            //# Preparo el thumb                              #
                            //# Lo anule porque Se necesita ffmpeg instalado  #
                            //# # # # # # # # # # # # # # # # # # # # # # # # #
                            //# El nombre del thumb es el nombre de archivo con el texto thumb_ delate y la extencion jpg
                            //$nombreThumb = "thumb_" . pathinfo($nombrePath, PATHINFO_FILENAME) . ".jpg";
                            //$pathThumb = $directorio . '/' . $nombreThumb;
                            //$esVideo = preg_match('/\.(mp4|mov|avi|webm|ogg)$/i', $nombreOriginal);
                            //# Controlar que el archivo si es de video no supere los 30 MB 
                            //$maxSize = 30 * 1024 * 1024; // variable que limita a 30MB
                            //if ($esVideo && filesize($target_path) > $maxSize) {
                            //    $comprimido = $directorio . '/cmp_' . $nombrePath;
                                //# Parámetros importantes ffmpeg
                                //# -crf 28 👉 más alto = más compresión (25–32 ideal)
                                //# -preset fast 👉 velocidad vs calidad
                                //# libx264 👉 estándar moderno
                            //    $comando = "ffmpeg -i \"$target_path\" -vcodec libx264 -crf 28 -preset fast -acodec aac \"$comprimido\" 2>&1";
                            //    exec($comando, $output, $return_var);
                            //    if ($return_var === 0 && file_exists($comprimido)) {
                            //        unlink($target_path); // borrar original
                            //        $target_path = $comprimido; // usar comprimido
                            //    } else {
                            //        error_log("Error al comprimir video");
                            //    }
                            //}

                            if (move_uploaded_file($fuente, $target_path)) {
                            //###### SI ES VIDEO -> GENERAR THUMB
                                //  if ($esVideo) {
                                        //  tomo el segundo frame para la imagen thumb
                                //      $comando = "ffmpeg -i \"$target_path\" -ss 00:00:02 -vframes 1 \"$pathThumb\" 2>&1";
                                //      exec($comando, $output, $return_var);
                                //      if ($return_var !== 0) {
                                //            error_log("Error generando thumbnail: " . implode("\n", $output));
                                //            $pathThumb = null;
                                //      }
                                //  } else {
                                //      $pathThumb = null;
                                // }
                            
                                //insertar los datos en la tabla
                                $query2 = $conexion->prepare("INSERT INTO mensajes_adjunto (id_mensaje, path_archivo, nombre_archivo) VALUES (?, ?, ?)");
                                $query2->bind_param("iss", $id_insertado, $target_path, $nombreOriginal);
                                $query2->execute();
                                $query2->close();
                            } else $error .= ' - Error adjuntando archivo';
                        }
                    } //fin for
                }

            }

            // Inserciones en tablas de control
            $query3 = $conexion->prepare("INSERT INTO mensajes_enviados (id_mensaje, usuario, estado) VALUES (?, ?, '0')");
            $query3->bind_param("is", $id_insertado, $de);
            $query3->execute();
            $query3->close();

            $para_arreglo = explode(",", $para);
            $recipient_usernames = [];
            foreach ($para_arreglo as $usuario) {
                $usuario = trim($usuario);
                if ($usuario) {
                    $query4 = $conexion->prepare("INSERT INTO mensajes_recibidos (id_mensaje, usuario, estado) VALUES (?, ?, '0')");
                    $query4->bind_param("is", $id_insertado, $usuario);
                    $query4->execute();
                    $query4->close();
                    $recipient_usernames[] = $usuario;
                }
            }

            // Retornamos datos para notificación
            $respuesta = ($error == "") 
                ? [
                    'success' => true,
                    'id_insertado' => $id_insertado,
                    'recipient_usernames' => $recipient_usernames,
                    'mensaje' => $mensaje,
                    'asunto' => $asunto,
                    'respuesta_a' => $respuesta_a
                ]
                : ['error' => $error];

            echo json_encode($respuesta);
            exit;
        }
    }
}
$conexion->close();
?>