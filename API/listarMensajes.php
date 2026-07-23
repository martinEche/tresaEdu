<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config_cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset("utf8mb4");
$conexion->query("SET NAMES utf8mb4");
$conexion->query("SET CHARACTER SET utf8mb4");

//recupero de informacion
$method = $_SERVER['REQUEST_METHOD'];

//$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
//$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$id = $dataObject-> id;
//$tipo_mensaje = $dataObject-> tipo;

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$raw = file_get_contents("php://input");
$dataObject = json_decode($raw);

if (!$dataObject) {
    echo json_encode([
        'resultado' => false,
        'error' => 'JSON inválido o vacío'
    ]);
    exit;
}

//datos pasados
$id = isset($dataObject->id) ? $dataObject->id : null;
$tipo_mensaje = isset($dataObject->tipo) ? $dataObject->tipo : null;

if (!$id || !$tipo_mensaje) {
    echo json_encode([
        'resultado' => false,
        'error' => 'Datos incompletos'.$id."-".$tipo_mensaje
    ]);
    exit;
}

$sql=""; //inicializo variable sql

//swith de consultas segun $tipo_mensaje
if($tipo_mensaje=='RECIBIDOS'){
    //obtener nombre de usuario
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);
    $usuarioN=$usr['usuario'];
    //busco mensajes del usuario
    $sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, mr.* 
            FROM mensajes_recibidos as mr, mensajes as m, usuarios as u 
            WHERE u.usuario= m.de 
                and mr.id_mensaje= m.id_mensaje 
                and mr.usuario='$usuarioN' 
                and mr.estado<>3
                 and m.id_curso=0 
            ORDER BY `m`.`fecha` DESC";
}

if($tipo_mensaje=='RECIBIDOSG'){
    //obtener nombre de usuario
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);
    $usuarioN=$usr['usuario'];
    //busco mensajes del usuario
    $sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, mr.* 
            FROM mensajes_recibidos as mr, mensajes as m, usuarios as u 
            WHERE u.usuario= m.de 
                and mr.id_mensaje= m.id_mensaje 
                and mr.usuario='$usuarioN' 
                and mr.estado<>3 
                and m.id_curso<>0
            ORDER BY `m`.`fecha` DESC";
}

if($tipo_mensaje=='SIN_LEER'){
    //obtener nombre de usuario
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);
    $usuarioN=$usr['usuario'];

    //$sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, mr.* FROM mensajes_recibidos as mr, mensajes as m, usuarios as u WHERE u.usuario= m.de and mr.id_mensaje= m.id_mensaje and mr.usuario='$usuarioN' and mr.estado=0 ORDER BY `m`.`fecha` DESC";
    $sql="SELECT count(mr.id_mensajeR) as cantidad FROM mensajes_recibidos as mr WHERE mr.usuario='$usuarioN' and mr.estado=0";
}
if($tipo_mensaje=='ENVIADOS'){
    //obtener nombre de usuario
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);
    $usuarioN=$usr['usuario'];

    $sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, me.* FROM mensajes_enviados as me, mensajes as m, usuarios as u WHERE u.usuario= m.de and me.id_mensaje= m.id_mensaje and me.usuario='$usuarioN' and me.estado<>3 ORDER BY `m`.`fecha` DESC";
}
if($tipo_mensaje=='ELIMINADOS'){
    //obtener nombre de usuario
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);
    $usuarioN=$usr['usuario'];

    //$sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, me.*, mr.* FROM mensajes_enviados as me, mensajes as m, usuarios as u WHERE u.usuario= m.de and me.id_mensaje= m.id_mensaje and me.usuario and me.usuario='$usuarioN' and me.estado='3' UNION ALL SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, mr.* FROM mensajes_recibidos as mr, mensajes as m, usuarios as u WHERE u.usuario= m.de and mr.id_mensaje= m.id_mensaje and mr.usuario and mr.usuario='$usuarioN' and mr.estado='3'";
    $sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.id_mensaje, m.asunto, m.mensaje, m.adjunto, me.estado, me.id_mensajeE as id_me, 'enviado' as tipo FROM mensajes_enviados as me JOIN mensajes as m ON me.id_mensaje = m.id_mensaje JOIN usuarios as u ON u.usuario = m.de WHERE me.usuario = '$usuarioN' AND me.estado = '3' UNION ALL SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.id_mensaje, m.asunto, m.mensaje, m.adjunto, mr.estado, mr.id_mensajeR as id_mr, 'recibido' as tipo FROM mensajes_recibidos as mr JOIN mensajes as m ON mr.id_mensaje = m.id_mensaje JOIN usuarios as u ON u.usuario = m.de WHERE mr.usuario = '$usuarioN' AND mr.estado = '3'";
}
if($tipo_mensaje=='ADJUNTOS'){
    $sql="SELECT * FROM `mensajes_adjunto` WHERE `id_mensaje` = '$id'";
}
if($tipo_mensaje=='enRecibidos'){
    // obtener id del mensaje
    //si $id es negativo es un id_curso no evaluo mensajes
    if($id>0){
        //el mas simple llega id del mensaje recibido y se localiza el id del mensaje original
        $sql_u="SELECT id_mensaje FROM mensajes_recibidos WHERE id_mensajeR='$id'";
        $consulta = mysqli_query($conexion,$sql_u);
        $msj = mysqli_fetch_array($consulta);

        $id_mensaje=$msj['id_mensaje'];
        //crea sql con la busqueda del mensaje a partir del id del mensaje original
        $sql="SELECT u.nombre, u.apellido, u.id as id_usuario, m.* FROM mensajes as m, usuarios as u WHERE m.de = u.usuario and m.id_mensaje = '$id_mensaje'";
        //marca el mensaje como leido
        $query = $conexion->prepare("UPDATE `mensajes_recibidos` SET `estado` = '1' WHERE `mensajes_recibidos`.`id_mensajeR` = '$id'");
        $query->execute();
    }
}
if($tipo_mensaje=='RESPUESTAS'){
    //obtener nombre de usuario
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);
    $usuarioN=$usr['usuario'];
    
    $id_mensajeR = $dataObject-> id_mensaje;

     //obtener id del mensaje
     $sql_u="SELECT mr.id_mensaje, m.respuesta_a FROM mensajes_recibidos as mr, mensajes as m WHERE m.id_mensaje = mr.id_mensaje and id_mensajeR='$id_mensajeR'";
     $consulta = mysqli_query($conexion,$sql_u);
     $msj = mysqli_fetch_array($consulta);
     $id_mensaje=$msj['id_mensaje'];
     $respuesta_a=$msj['respuesta_a'];
     if($respuesta_a<>0){
        $id_mensaje=$respuesta_a;
     }

    //$sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, mr.* FROM mensajes_recibidos as mr, mensajes as m, usuarios as u WHERE u.usuario= m.de and mr.id_mensaje= m.id_mensaje and mr.usuario='$usuarioN'  and m.respuesta_a ='$id_mensaje' and mr.estado<>3 ORDER BY `m`.`fecha` DESC";
    $sql="SELECT u.nombre, u.apellido, u.documento, u.id as id_u, m.*, mr.*, me.* FROM mensajes m LEFT JOIN mensajes_recibidos mr ON mr.id_mensaje = m.id_mensaje LEFT JOIN mensajes_enviados me ON me.id_mensaje = m.id_mensaje JOIN usuarios u ON u.usuario = m.de WHERE (mr.usuario = '$usuarioN' OR me.usuario = '$usuarioN') AND(m.respuesta_a = '$id_mensaje' or m.id_mensaje='$id_mensaje') AND (mr.estado <> 3 OR mr.estado IS NULL) ORDER BY m.fecha ASC";

}
if($tipo_mensaje=='RESPUESTAS_2'){
    // obtener nombre de usuairio de quien llama a partir del id
    // el id lo recpero del objeto dataObject al princiio del script
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);

    $usuarioN=$usr['usuario']; 

    //obtener del mensaje a partir del id_mensaje
    $id_mensajeR = $dataObject-> id_mensaje;
    //obtenerel mensaje
    $sql_u="SELECT mr.id_mensaje, m.respuesta_a FROM mensajes_recibidos as mr, mensajes as m WHERE m.id_mensaje = mr.id_mensaje and id_mensajeR='$id_mensajeR'";
    $consulta = mysqli_query($conexion,$sql_u);
    $msj = mysqli_fetch_array($consulta);
    $respuesta_a=$msj['respuesta_a'];
    //verificar si el mensaje es original ($respuesta_a===0) o es una respuesta a otro mensaje ($respuesta_a<>0)
    if($respuesta_a==0){ //es un mensaje original
        $id_mensaje=$msj['id_mensaje']; //tomo el id del mensaje original
        //es mensaje original traer todas las respuestas, los mensajes que tengan como respuesta_a el id del mensaje original
        //ordenar por fecha ascendente
        $sql="SELECT 
                u.nombre, 
                u.apellido, 
                u.documento, 
                u.id as id_u, 
                m.*, 
                mr.*, 
                me.* 
            FROM mensajes m 
            LEFT JOIN mensajes_recibidos mr ON mr.id_mensaje = m.id_mensaje 
            LEFT JOIN mensajes_enviados me ON me.id_mensaje = m.id_mensaje 
            JOIN usuarios u ON u.usuario = m.de 
            WHERE (mr.usuario = '$usuarioN' OR me.usuario = '$usuarioN') 
                AND (m.respuesta_a = '$id_mensaje') 
                AND (mr.estado <> 3 OR mr.estado IS NULL) 
            ORDER BY m.fecha ASC";
     }
    
     if($respuesta_a<>0){ //es una respuesta a otro mensaje
        //$id_mensaje=$respuesta_a;
        //si es una respuesta a un mensaje original traer el mensaje original y todas las respuestas
        $id_mensaje=$respuesta_a;
        $sql="SELECT DISTINCT 
                u.nombre, 
                u.apellido, 
                u.documento, 
                u.id as id_u, 
                m.*, 
                mr.estado as estado_recibido,
                me.estado as estado_enviado
            FROM mensajes m 
            LEFT JOIN mensajes_recibidos mr ON mr.id_mensaje = m.id_mensaje AND mr.usuario = '$usuarioN'
            LEFT JOIN mensajes_enviados me ON me.id_mensaje = m.id_mensaje AND me.usuario = '$usuarioN'
            JOIN usuarios u ON u.usuario = m.de 
            WHERE 
                (mr.usuario = '$usuarioN' OR me.usuario = '$usuarioN') 
                AND (m.respuesta_a = '$id_mensaje' OR m.id_mensaje = '$id_mensaje') 
                AND (mr.estado <> 3 OR mr.estado IS NULL) 
            ORDER BY m.fecha ASC";
     }
}
if($tipo_mensaje == 'RESPUESTAS_GRUPO') {
    // obtener nombre de usuairio de quien llama a partir del id
    // el id lo recpero del objeto dataObject al princiio del script
    $sql_u="SELECT u.usuario FROM usuarios as u WHERE u.id='$id'";
    $consulta = mysqli_query($conexion,$sql_u);
    $usr = mysqli_fetch_array($consulta);

    $usuarioN=$usr['usuario'];

    //preguntar si llego y existe esgrupogrupo_personalizado y si  el valor es si
   // if(isset($dataObject->grupo_personalizado) && $dataObject->grupo_personalizado === 'Si'){
   //     $id_curso_grupo =abs($dataObject-> id_mensaje);
   // }else{
        //obtener el grupo a partir del id_mensaje por ser negativo trae el id del curso grupo
        //pasarlo a positivo para la consulta
        $id_curso_grupo = abs($dataObject-> id_mensaje);
    //}
    //obtener mensajes del grupo, traer el mensaje original y todas las respuestas
    $sql_u="SELECT m.id_mensaje FROM mensajes as m WHERE m.id_curso = '$id_curso_grupo' ORDER BY m.fecha DESC LIMIT 1";
    $consulta = mysqli_query($conexion,$sql_u);
    //si no hay mensajes en el grupo, devolver mensaje vacío
    if(mysqli_num_rows($consulta) == 0) {
        echo json_encode([
            'resultado' => true,
            'data' => []
        ]);
        exit;
    }
    $msj = mysqli_fetch_array($consulta);
    $id_mensaje=$msj['id_mensaje'];

    //si el mensaje es original traer todas las respuestas, los mensajes que tengan como respuesta_a el id del mensaje original
    //ordenar por fecha ascendente
    $sql="SELECT 
            u.nombre, 
            u.apellido, 
            u.documento, 
            u.id as id_u, 
            m.*, 
            mr.*, 
            me.* 
        FROM mensajes m 
        LEFT JOIN mensajes_recibidos mr ON mr.id_mensaje = m.id_mensaje 
        LEFT JOIN mensajes_enviados me ON me.id_mensaje = m.id_mensaje 
        JOIN usuarios u ON u.usuario = m.de 
        WHERE (mr.usuario = '$usuarioN' OR me.usuario = '$usuarioN') 
            AND (m.respuesta_a = '$id_mensaje' OR m.id_mensaje='$id_mensaje') 
            AND (mr.estado <> 3 OR mr.estado IS NULL) 
        ORDER BY m.fecha ASC";
}

//**********************************************
// Buscar  grupos y conversaciones agrupadas ***
if($tipo_mensaje == 'conversaciones' ){
    // obtener el nombre de usuario a partir del id
    $sqlUsuario = "SELECT usuario FROM usuarios WHERE id=?";
    if ($nueva_consulta = $conexion->prepare($sqlUsuario)) {
        $nueva_consulta->bind_param('i', $id);
        $nueva_consulta->execute();
        $res = $nueva_consulta->get_result();
        if ($res->num_rows > 0) {
            $fila = $res->fetch_assoc();
            $usuario = $fila['usuario']; //nobre de usuario
        } else {
            echo json_encode([
                'resultado' => false,
                'mensaje' => 'Usuario no encontrado'
            ]);
            exit;
        }
    }

    
    //Vieja consulta busca todo y arma los grupos de chat a partir de los mensajes pero ignoraba los grupos sin mensajes
    // $sql_especial="SELECT chats.tipo_chat, chats.conversacion, chats.id_usuario, chats.usuario_conversacion, m.id_mensaje, m.de, m.para, m.mensaje AS ultimo_mensaje, m.fecha AS ultima_fecha,
                    /* cantidad sin leer */
    /*                COALESCE(
                        (SELECT COUNT(*)
                            FROM mensajes_recibidos mr
                            WHERE mr.id_mensaje = m.id_mensaje
                            AND mr.usuario = '$usuario'
                            AND mr.estado = 0),
                            0
                        ) AS sin_leer,
      
      */                  /* datos usuario */
       //             u.nombre,u.apellido, up.imagen_perfil AS foto_perfil,
                    /* grupo personalizado */
        //            gp.nombre_grupo, gp.imagen AS imagen_grupo,
                    /* curso */
        //            CONCAT(cg.denominacion,' ', cu.nombre,' ', cg.seccion,' (',cu.id_cohorte, ')') AS nombre_curso,
                    /* nombre chat */
        /*            CASE
                        WHEN chats.tipo_chat = 'USR'
                            THEN CONCAT(u.apellido, ', ', u.nombre)
                        WHEN chats.tipo_chat = 'GRUPOP'
                            THEN gp.nombre_grupo
                        WHEN chats.tipo_chat = 'GRUPOC'
                            THEN CONCAT(
                                cg.denominacion,
                                ' ',
                                cu.nombre
                            )
                        WHEN chats.tipo_chat = 'DIFUSION'
                            THEN 'Mensaje de difusión'
                    END AS nombre_chat
                FROM
                (
                    SELECT
                        CASE
                            WHEN m.id_curso < 0 THEN 'GRUPOP'
                            WHEN m.id_curso > 0 THEN 'GRUPOC'
                            WHEN m.id_curso = 0 AND m.para LIKE '%,%' THEN 'DIFUSION'
                            ELSE 'USR'
                        END AS tipo_chat,
                        CASE
                            WHEN m.id_curso < 0 THEN
                                CONCAT('GRUPOP_', ABS(m.id_curso))
                            WHEN m.id_curso > 0 THEN
                                CONCAT('GRUPOC_', m.id_curso)
                            WHEN m.id_curso = 0
                                AND m.para LIKE '%,%' THEN
                                CONCAT('DIFUSION_', m.id_mensaje)
                            WHEN m.de = '$usuario' THEN
                                CONCAT('USR_', m.para)
                            ELSE
                                CONCAT('USR_', m.de)
                        END AS conversacion,
                        CASE
                            WHEN m.id_curso = 0
                                AND m.para NOT LIKE '%,%' THEN
                                CASE
                                    WHEN m.de = '$usuario'
                                        THEN m.para
                                    ELSE m.de
                                END
                            ELSE NULL
                        END AS usuario_conversacion,
                        CASE
                            WHEN m.id_curso = 0
                                AND m.para NOT LIKE '%,%' THEN
                                u.id
                            ELSE NULL
                        END AS id_usuario,
                        MAX(m.fecha) AS ultima_fecha
                    FROM mensajes m
                    LEFT JOIN usuarios u
                        ON u.usuario =
                            CASE
                                WHEN m.de = '$usuario'
                                    THEN m.para
                                ELSE m.de
                            END
                    WHERE
                    (
                        m.de = '$usuario'
                        OR FIND_IN_SET(
                                '$usuario',
                                REPLACE(m.para,' ','')
                        )
                    )
                    GROUP BY
                        tipo_chat,
                        conversacion,
                        usuario_conversacion,
                        id_usuario
                ) chats
                INNER JOIN mensajes m
                    ON m.fecha = chats.ultima_fecha
        */        
                    /* usuario */
        //        LEFT JOIN usuarios u
        //            ON u.id = chats.id_usuario
        //        LEFT JOIN usuario_perfil up
        //            ON up.id_usuario = u.id
                /* grupo personalizado */
        //        LEFT JOIN mensajes_grupo_creado gp
        //            ON gp.id = ABS(m.id_curso)
        //            AND m.id_curso < 0
                /* curso */
        //        LEFT JOIN curso_grupo cg
        //            ON cg.id_curso = m.id_curso
        //            AND m.id_curso > 0
        //        LEFT JOIN curso cu
        //            ON cu.id = cg.id_curso
        //        ORDER BY
        //            m.fecha DESC";                    

        // buscar chats de conversaciones usuario a usuario
    $SQL_USR="SELECT
            'USR' AS tipo_chat,
            CONCAT(
                'USR_',
                CASE
                    WHEN m.de = '$usuario'
                        THEN m.para
                    ELSE m.de
                END
            ) AS conversacion,
            u.id AS id_usuario,
            CASE
                WHEN m.de = '$usuario'
                    THEN m.para
                ELSE m.de
            END AS usuario_conversacion,
            m.id_mensaje,
            m.de,
            m.para,
            m.mensaje AS ultimo_mensaje,
            m.fecha AS ultima_fecha,
            COALESCE(
                (
                    SELECT COUNT(*)
                    FROM mensajes_recibidos mr
                    INNER JOIN mensajes m_unread ON mr.id_mensaje = m_unread.id_mensaje
                    WHERE mr.usuario = '$usuario'
                    AND mr.estado = 0
                    AND m_unread.id_curso = 0
                    AND m_unread.para NOT LIKE '%,%'
                    AND m_unread.de = CASE WHEN m.de = '$usuario' THEN m.para ELSE m.de END
                ),
                0
            ) AS sin_leer,
            u.nombre,
            u.apellido,
            up.imagen_perfil AS foto_perfil,
            NULL AS nombre_grupo,
            NULL AS imagen_grupo,
            NULL AS nombre_curso
        FROM mensajes m
        INNER JOIN
        (
            SELECT
                CASE
                    WHEN de='$usuario' THEN para
                    ELSE de
                END AS otro_usuario,
                MAX(fecha) ultima_fecha
            FROM mensajes
            WHERE
                id_curso = 0
                AND para NOT LIKE '%,%'
                AND (
                    de='$usuario'
                    OR para='$usuario'
                )
            GROUP BY otro_usuario
        ) ult
        ON ult.ultima_fecha = m.fecha
        LEFT JOIN usuarios u
            ON u.usuario =
                CASE
                    WHEN m.de='$usuario'
                        THEN m.para
                    ELSE m.de
                END
        LEFT JOIN usuario_perfil up
            ON up.id_usuario = u.id";

    $chats=[];
    if ($nueva_consulta = $conexion->prepare($SQL_USR)) {
        $nueva_consulta->execute();
        $resChats = $nueva_consulta->get_result();
        $chats = $resChats->num_rows > 0
            ? $resChats->fetch_all(MYSQLI_ASSOC)
            : [];
    }
    //difusion
    $SQL_Difusion="SELECT
                    'DIFUSION' AS tipo_chat,
                    CONCAT(
                        'DIFUSION_',
                        m.id_mensaje
                    ) AS conversacion,
                    NULL AS id_usuario,
                    NULL AS usuario_conversacion,
                    m.id_mensaje,
                    m.de,
                    m.para,
                    m.mensaje AS ultimo_mensaje,
                    m.fecha AS ultima_fecha,
                    COALESCE(
                        (
                            SELECT COUNT(*)
                            FROM mensajes_recibidos mr
                            WHERE mr.id_mensaje = m.id_mensaje
                            AND mr.usuario = '$usuario'
                            AND mr.estado = 0
                        ),
                        0
                    ) AS sin_leer,
                    NULL AS nombre,
                    NULL AS apellido,
                    NULL AS foto_perfil,
                    NULL AS nombre_grupo,
                    NULL AS imagen_grupo,
                    NULL AS nombre_curso
                FROM mensajes m
                WHERE
                    id_curso = 0
                    AND para LIKE '%,%'
                    AND (
                        de = '$usuario'
                        OR FIND_IN_SET(
                            '$usuario',
                            REPLACE(para,' ','')
                        )
                    )";
    $difusion=[];
    if ($nueva_consultaD = $conexion->prepare($SQL_Difusion)) {
        $nueva_consultaD->execute();
        $resDIFUSION = $nueva_consultaD->get_result();
        $difusion = $resDIFUSION->num_rows > 0
            ? $resDIFUSION->fetch_all(MYSQLI_ASSOC)
            : [];
    }

    //grupos Personalizados
    $SQL_GRUPOSP="SELECT
                'GRUPOP' AS tipo_chat,
                CONCAT(
                    'GRUPOP_',
                    gp.id
                ) AS conversacion,
                NULL AS id_usuario,
                NULL AS usuario_conversacion,
                m.id_mensaje,
                m.de,
                m.para,
                m.mensaje AS ultimo_mensaje,
                m.fecha AS ultima_fecha,
                COALESCE(
                    (
                        SELECT COUNT(*)
                        FROM mensajes_recibidos mr
                        INNER JOIN mensajes m_unread ON mr.id_mensaje = m_unread.id_mensaje
                        WHERE m_unread.id_curso = -gp.id
                        AND mr.usuario = '$usuario'
                        AND mr.estado = 0
                    ),
                    0
                ) AS sin_leer,
                NULL AS nombre,
                NULL AS apellido,
                NULL AS foto_perfil,
                gp.nombre_grupo,
                gp.descripcion AS descripcion_grupo,
                gp.imagen AS imagen_grupo,
                NULL AS nombre_curso
            FROM mensajes_grupo_creado gp
            INNER JOIN mensajes_grupo_participantes gpp
                ON gpp.id_mensaje_grupo = gp.id
            INNER JOIN usuarios u
                ON u.id = gpp.id_usuario
            LEFT JOIN
            (
                SELECT
                    id_curso,
                    MAX(fecha) ultima_fecha
                FROM mensajes
                WHERE id_curso < 0
                GROUP BY id_curso
            ) ult
            ON ult.id_curso = -gp.id
            LEFT JOIN mensajes m
                ON m.id_curso = ult.id_curso
                AND m.fecha = ult.ultima_fecha
            WHERE
                u.usuario = '$usuario'";
    $grupoP=[];
    if ($nueva_consultaP = $conexion->prepare($SQL_GRUPOSP)) {
        $nueva_consultaP->execute();
        $resGRUPOSP = $nueva_consultaP->get_result();
        $grupoP = $resGRUPOSP->num_rows > 0
            ? $resGRUPOSP->fetch_all(MYSQLI_ASSOC)
            : [];
    }
    //GRUPOSC
    $SQL_GRUPOSC="SELECT
            'GRUPOC' AS tipo_chat,
            CONCAT(
                'GRUPOC_',
                cg.id
            ) AS conversacion,
            NULL AS id_usuario,
            NULL AS usuario_conversacion,
            m.id_mensaje,
            m.de,
            m.para,
            m.mensaje AS ultimo_mensaje,
            m.fecha AS ultima_fecha,
            COALESCE(
                (
                    SELECT COUNT(*)
                    FROM mensajes_recibidos mr
                    INNER JOIN mensajes m_unread ON mr.id_mensaje = m_unread.id_mensaje
                    WHERE m_unread.id_curso = cg.id
                    AND mr.usuario = '$usuario'
                    AND mr.estado = 0
                ),
                0
            ) AS sin_leer,
            NULL AS nombre,
            NULL AS apellido,
            NULL AS foto_perfil,
            NULL AS nombre_grupo,
            NULL AS descripcion_grupo,
            NULL AS imagen_grupo,
            CONCAT(
                cg.denominacion,
                ' ',
                cu.nombre,
                ' ',
                cg.seccion,
                ' (',
                cu.id_cohorte,
                ')'
            ) AS nombre_curso
        FROM curso_grupo cg
        INNER JOIN curso cu
            ON cu.id = cg.id_curso
        LEFT JOIN
        (
            SELECT
                id_curso,
                MAX(fecha) ultima_fecha
            FROM mensajes
            WHERE id_curso > 0
            GROUP BY id_curso
        ) ult
        ON ult.id_curso = cg.id
        LEFT JOIN mensajes m
            ON m.id_curso = ult.id_curso
            AND m.fecha = ult.ultima_fecha
        WHERE cg.id IN
        (
            SELECT ced.id_curso_grupo
            FROM curso_equipo_docente ced
            INNER JOIN usuarios u
                ON u.id = ced.id_usuario
            WHERE u.usuario = '$usuario'

            UNION

            SELECT ce.id_curso_grupo
            FROM curso_estudiante ce
            INNER JOIN usuarios u
                ON u.id = ce.id_usuario
            WHERE u.usuario = '$usuario'
        )";
    $grupoC=[];
    if ($nueva_consultaC = $conexion->prepare($SQL_GRUPOSC)) {
        $nueva_consultaC->execute();
        $resGRUPOSC = $nueva_consultaC->get_result();
        $grupoC = $resGRUPOSC->num_rows > 0
            ? $resGRUPOSC->fetch_all(MYSQLI_ASSOC)
            : [];
    }
    echo json_encode([
            'resultado' => true,
            'usuario' => $usuario,
            'chats' => $chats,
            'difusion'=> $difusion,
            'gruposP'=> $grupoP,
            'gruposC'=> $grupoC
    ]);
    
    exit;
}

//*****************************************
//  busca las conversaciones de un chat****

$id = isset($dataObject->id) ? $dataObject->id : null;
$tipo_mensaje = isset($dataObject->tipo) ? $dataObject->tipo : null;
if(
    isset($dataObject->tipo) &&
    isset($dataObject->conversacion) &&
    isset($dataObject->id)
){

    $tipo_chat     = $dataObject->tipo;
    $conversacion  = $dataObject->conversacion;
    $id_usuario    = $dataObject->id;
    $id_mensaje    = $dataObject->id_mensaje;

    $esGrupo = 'NO';

    // Obtener nombre del usuario actual
    $usuarioActual = '';
    $sqlUsuario = "SELECT usuario FROM usuarios WHERE id=?";
    if ($stmtUser = $conexion->prepare($sqlUsuario)) {
        $stmtUser->bind_param("i", $id_usuario);
        $stmtUser->execute();
        $resUser = $stmtUser->get_result();
        if ($resUser->num_rows > 0) {
            $usuarioActual = $resUser->fetch_assoc()['usuario'];
        }
        $stmtUser->close();
    }

    /* ==========================================
       CONVERSACIÓN USUARIO-USUARIO
       Ej: USR_58228579
       ========================================== */
    if(strpos($conversacion,'USR_') === 0){
        $esGrupo = 'NO';
         /* ==========================================
       OBTENER NOMBRE DE USUARIO
        ========================================== */
        if(empty($usuarioActual)){
            echo json_encode([
                'resultado' => false,
                'mensaje'   => 'Usuario inexistente'
            ]);
            exit;
        }

        $usuarioDestino = str_replace('USR_','',$conversacion);

        $sql = "SELECT
                m.*,
                u.id AS id_usuario,
                (SELECT estado FROM mensajes_enviados WHERE id_mensaje = m.id_mensaje LIMIT 1) as estado_enviado,
                (SELECT estado FROM mensajes_recibidos WHERE id_mensaje = m.id_mensaje LIMIT 1) as estado_recibido
            FROM mensajes m

            LEFT JOIN usuarios u
                ON u.usuario = m.de

            WHERE
            (
                m.de = ?
                AND m.para = ?
                AND m.id_curso = 0
            )
            OR
            (
                m.de = ?
                AND m.para = ?
                AND m.id_curso = 0
            )

            ORDER BY m.fecha ASC";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param(
            "ssss",
            $usuarioActual,
            $usuarioDestino,
            $usuarioDestino,
            $usuarioActual
        );
    }
    
    /* ==========================================
       CHAT DE CURSO
       Ej: GRUPOC_15
       ========================================== */
    elseif(strpos($conversacion,'GRUPOC_') === 0){
        $esGrupo = 'SI';
        $idCurso = intval(
            str_replace('GRUPOC_','',$conversacion)
        );

        $sql = "SELECT 
                    m.*,
                    u.id as id_usuario,
                    (SELECT estado FROM mensajes_enviados WHERE id_mensaje = m.id_mensaje LIMIT 1) as estado_enviado,
                    (SELECT estado FROM mensajes_recibidos WHERE id_mensaje = m.id_mensaje LIMIT 1) as estado_recibido
                FROM mensajes as m
                LEFT JOIN usuarios u
                    ON u.usuario = m.de

                WHERE m.id_curso = ?
                ORDER BY m.fecha ASC
        ";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i",$idCurso);
    }

    /* ==========================================
       GRUPO PERSONALIZADO
       Ej: GRUPOP_8
       En BD se guarda como -8
       ========================================== */
    elseif(strpos($conversacion,'GRUPOP_') === 0){
        $esGrupo = 'SI';
        $idGrupo = intval(
            str_replace('GRUPOP_','',$conversacion)
        );

        $idGrupo = -$idGrupo;

        $sql = "SELECT 
                    m.*,
                    u.id as id_usuario,
                    (SELECT estado FROM mensajes_enviados WHERE id_mensaje = m.id_mensaje LIMIT 1) as estado_enviado,
                    (SELECT estado FROM mensajes_recibidos WHERE id_mensaje = m.id_mensaje LIMIT 1) as estado_recibido
                FROM mensajes as m
                LEFT JOIN usuarios u
                    ON u.usuario = m.de

                WHERE m.id_curso = ?
                ORDER BY m.fecha ASC
        ";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i",$idGrupo);
    }

    /* ==========================================
       DIFUSIÓN
       Ej: DIFUSION_233
       ========================================== */
    elseif(strpos($conversacion,'DIFUSION_') === 0){

        $idMensajeDifusion = intval(
            str_replace('DIFUSION_','',$conversacion)
        );

        $sql = "
            SELECT *
            FROM mensajes
            WHERE id_mensaje = ?
            ORDER BY fecha ASC
        ";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i",$idMensajeDifusion);
    }

    else{
        echo json_encode([
            'resultado' => false,
            'mensaje' => 'Tipo de conversación no válido'
        ]);
        exit;
    }

    /* ==========================================
       EJECUTAR CONSULTA
       ========================================== */

    $stmt->execute();
    $res = $stmt->get_result();

    $mensajes = [];

    // Preparar consulta para marcar como leído en mensajes_recibidos
    $query_read = null;
    if (!empty($usuarioActual)) {
        $query_read = $conexion->prepare("UPDATE `mensajes_recibidos` SET `estado` = '1' WHERE `id_mensaje` = ? AND `usuario` = ? AND `estado` = '0'");
    }

    while($fila = $res->fetch_assoc()){
        $mensajes[] = $fila;
        //poner cada mensaje que este en mensajes recibidos para el usuario actual como leido
        if ($query_read) {
            $id_msg = $fila['id_mensaje'];
            $query_read->bind_param("is", $id_msg, $usuarioActual);
            $query_read->execute();
        }
    }
    $query_read->close();

    //buscar los participantes cuando es grupo (already fetched above)
    $participantes = [];
    if ($esGrupo === 'SI') {
        // Fetch participants for group chats
        if (strpos($conversacion,'GRUPOC_') === 0) {
            $sqlPart = "SELECT
                            u.id,
                            u.nombre,
                            u.apellido,
                            gp.estado
                        FROM usuarios u
                        INNER JOIN (
                            SELECT
                                id_usuario,
                                'administrador' AS estado
                            FROM curso_equipo_docente
                            WHERE id_curso_grupo = ?

                            UNION ALL

                            SELECT
                                id_usuario,
                                'participante' AS estado
                            FROM curso_estudiante
                            WHERE id_curso_grupo = ?
                        ) gp
                            ON gp.id_usuario = u.id
                        ORDER BY gp.estado, u.apellido, u.nombre";
            $stmtPart = $conexion->prepare($sqlPart);
            $stmtPart->bind_param('ii', $idCurso, $idCurso);
            $stmtPart->execute();
            $participantes = $stmtPart->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmtPart->close();
        } elseif (strpos($conversacion,'GRUPOP_') === 0) {
            $idGrupo = intval(
                str_replace('GRUPOP_','',$conversacion)
            );
            $sqlPart = "SELECT 
                            u.id,
                            u.nombre,
                            u.apellido,
                            gp.estado
                        FROM usuarios u
                        INNER JOIN mensajes_grupo_participantes gp
                            ON gp.id_usuario = u.id
                        WHERE gp.id_mensaje_grupo = ?
                        ORDER BY gp.estado, u.apellido, u.nombre";
            $stmtPart = $conexion->prepare($sqlPart);
            $stmtPart->bind_param('i', $idGrupo);
            $stmtPart->execute();
            $participantes = $stmtPart->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmtPart->close();
        }
    }

    echo json_encode([
        'resultado'    => true,
        'tipo_chat'    => $tipo_chat,
        'conversacion' => $conversacion,
        'mensajes'     => $mensajes,
        'participantes' => $participantes
    ]);

    exit();
}

//#### FIN IF PRINCIPAL DE CONSULTAS

if ($sql != "") {
    if ($nueva_consulta = $conexion->prepare($sql)) {
        $nueva_consulta->execute();
        // Obtener metadata
        $meta = $nueva_consulta->result_metadata();
        if (!$meta) {
            echo json_encode(['resultado' => false, 'error' => 'No hay metadata']);
            exit;
        }
        $row = [];
        $params = [];
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        call_user_func_array([$nueva_consulta, 'bind_result'], $params);
        $data = [];
        while ($nueva_consulta->fetch()) {
            $data[] = array_map(fn($v) => $v, $row);
        }
        if (count($data) >= 1) {
            if ($tipo_mensaje == 'SIN_LEER') {
                echo json_encode([
                    'resultado' => true,
                    'cantidad'  => $data[0]['cantidad']
                ]);
            } else {
                if ($tipo_mensaje == 'enRecibidos') {
                    echo json_encode([
                        'resultado' => true,
                        'dato' => $data[0]
                    ]);
                } else {
                    //envio todos los datos directamente
                    echo json_encode($data);
                }
            }
        } else {
            echo json_encode([
                'resultado' => false,
                'error' => 'No existen Resultados.'
            ]);
        }
        $nueva_consulta->close();
    } else {
        echo json_encode([
            'resultado' => false,
            'error' => 'No se pudo preparar la consulta SQL'
        ]);
    }
} else {
    echo json_encode([
        'resultado' => false,
        'error' => 'No se definió consulta SQL.'
    ]);
}

$conexion->close();

?>