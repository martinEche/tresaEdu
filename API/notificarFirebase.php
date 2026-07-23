<?php
require_once __DIR__ . '/config_cors.php';
require_once __DIR__ . '/enviar_push.php';
header('Content-Type: application/json; charset=utf-8');

include "conectar.php";
header("Content-Type: application/json; charset=utf-8");

$raw = file_get_contents('php://input');

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$data = json_decode($raw, true);

$id_insertado = intval($data['id_insertado'] ?? 0);
$recipient_usernames = $data['recipient_usernames'] ?? [];
$mensaje = $data['mensaje'] ?? '';
$asunto = $data['asunto'] ?? '';
$respuesta_a = intval($data['respuesta_a'] ?? 0);

// ============================
// Funciones Auxiliares
// ============================

/**
 * Avisa a Firebase Realtime Database que hubo un cambio.
 * Esta función es clave para el "Tiempo Real": le envía una señal (HTTP PATCH) a Firebase para actualizar una fecha o valor.
 * Cuando Firebase recibe esto, notifica inmediatamente a todos los usuarios que tengan la app abierta
 * para que sus pantallas recarguen los mensajes automáticamente (sin necesidad de presionar F5).
 */
function patchFirebaseRTDB($path, $dataPayload) {
    $opts = [
        "http" => ["method" => "PATCH", "header" => "Content-Type: application/json\r\n", "content" => json_encode($dataPayload)]
    ];
    $context = stream_context_create($opts);
    @file_get_contents(FIREBASE_DB_URL . "/$path.json", false, $context);
}

/**
 * Prepara los datos adicionales (carga útil) para la notificación Push.
 * Firebase Cloud Messaging (FCM) requiere que todos los valores adicionales sean texto (strings).
 * Esta función toma cualquier dato y lo convierte al formato estricto que exige FCM.
 */
function formatearDatosPushFCM($data = []) {
    if (empty($data) || !is_array($data)) {
        return null;
    }
    
    $dataPayload = [];
    foreach ($data as $k => $v) {
        $dataPayload[(string)$k] = is_array($v) ? json_encode($v) : (string)$v;
    }
    return $dataPayload;
}

// ============================
// 1. Consultar información del remitente
// ============================
$nombre_remitente = "Usuario";
$usuario_remitente = "";
$stmtRem = $conexion->prepare("SELECT nombre, apellido, usuario FROM usuarios WHERE id = ? LIMIT 1");
if ($stmtRem) {
    $stmtRem->bind_param('i', $tokenData->id);
    $stmtRem->execute();
    $resRem = $stmtRem->get_result();
    if ($rowRem = $resRem->fetch_assoc()) {
        $nombre_remitente = trim($rowRem['nombre'] . ' ' . $rowRem['apellido']);
        $usuario_remitente = trim($rowRem['usuario']);
    }
    $stmtRem->close();
}

// ============================
// 2. Detectar Grupo
// ============================
$id_curso_grupo = 0;
if ($id_insertado > 0) {
    $stmtGrupo = $conexion->prepare("SELECT id_curso FROM mensajes WHERE id_mensaje = ? LIMIT 1");
    if ($stmtGrupo) {
        $stmtGrupo->bind_param("i", $id_insertado);
        $stmtGrupo->execute();
        $resGrupo = $stmtGrupo->get_result();
        if ($resGrupo && $rowG = $resGrupo->fetch_assoc()) {
            $id_curso_grupo = intval($rowG['id_curso']);
        }
        $stmtGrupo->close();
    }
}

// ============================
// 3. Actualización de nodos en Firebase Realtime Database (Hilos y Grupos)
// ============================
$uniqueValue = microtime(true) . '_' . uniqid();

if ($respuesta_a > 0) {
    patchFirebaseRTDB("mensajes/thread_$respuesta_a", ["lastUpdate" => $uniqueValue]);
}

if ($id_curso_grupo > 0) {
    patchFirebaseRTDB("mensajes_grupo/curso_$id_curso_grupo", ["lastUpdate" => $uniqueValue]);
}

// ============================
// 4. Recolección de tokens FCM y actualización de nodos por usuario destinatario
// ============================
$allTokensAndData = [];
if (!empty($recipient_usernames)) {
    // Saneamiento de los nombres de usuario para prevenir inyecciones SQL en la cláusula IN
    $escaped_users = array_map(function($u) use ($conexion) {
        return "'" . $conexion->real_escape_string(trim($u)) . "'";
    }, array_filter($recipient_usernames));

    if (count($escaped_users) > 0) {
        $in_clause = implode(",", $escaped_users);
        $sql = "
            SELECT u.id, u.usuario, t.token, mr.id_mensajeR, up.email, up.email2, u.nombre, u.apellido
            FROM usuarios u
            LEFT JOIN fcm_tokens t ON u.id = t.usuario_id
            LEFT JOIN mensajes_recibidos mr ON mr.usuario = u.usuario AND mr.id_mensaje = $id_insertado
            LEFT JOIN usuario_perfil up ON u.id = up.id_usuario
            WHERE u.usuario IN ($in_clause)
        ";
        
        $res = $conexion->query($sql);
        if ($res) {
            $processed_rtdb_users = [];
            
            while ($row = $res->fetch_assoc()) {
                $uid = intval($row['id']);
                $uname = $row['usuario'];
                $token = $row['token'];
                $idR = $row['id_mensajeR'] ?? $id_insertado;
                $email = $row['email'] ?? '';
                $email2 = $row['email2'] ?? '';
                $nombre_dest = trim(($row['nombre'] ?? '') . ' ' . ($row['apellido'] ?? ''));

                // Actualizar el nodo del usuario en Firebase RTDB para notificar a su cliente web (se ejecuta solo la primera vez por usuario)
                if (!isset($processed_rtdb_users[$uid])) {
                    patchFirebaseRTDB("mensajes/user_$uid", ["lastUpdate" => $uniqueValue]);
                    
                    // Enviar email si tiene correo registrado, pero NO si es el mismo remitente
                    if ($uname !== $usuario_remitente) {
                        if (!empty($email) || !empty($email2)) {
                            require_once __DIR__ . '/enviar_email.php';
                            $asuntoEmail = "Nuevo mensaje en la plataforma: " . $asunto;
                            $cuerpo = "Hola " . htmlspecialchars($nombre_dest) . ",<br><br>Has recibido un nuevo mensaje de <strong>" . htmlspecialchars($nombre_remitente) . "</strong> en la plataforma educativa.<br><br><strong>Asunto:</strong> " . htmlspecialchars($asunto) . "<br><strong>Mensaje:</strong><br>" . nl2br(htmlspecialchars(strip_tags($mensaje)));
                            
                            $webviewUrl = obtenerFrontendUrlDinamico() . "/Mensajes";

                            $html = obtenerPlantillaEmail("Nuevo Mensaje Recibido", $cuerpo, $webviewUrl);
                            if (!empty($email)) {
                                enviarEmailPlataforma($email, $asuntoEmail, $html);
                            }
                            if (!empty($email2)) {
                                enviarEmailPlataforma($email2, $asuntoEmail, $html);
                            }
                        }
                    }

                    $processed_rtdb_users[$uid] = true;
                }

                // Omitir el envío de notificación push si el destinatario es el mismo remitente
                if ($uname === $usuario_remitente) continue;

                if (!empty($token)) {
                    $allTokensAndData[] = [
                        'token' => $token,
                        'idR' => $idR
                    ];
                }
            }
        }
    }
}

// ============================
// 5. Envío en lote de Notificaciones Push (FCM)
// ============================
if (!empty($allTokensAndData)) {
    // Obtener la URL base del frontend para construir las rutas de redirección (Deeplinks)
    $frontend_url = obtenerFrontendUrlDinamico();

    $title = 'Nuevo mensaje de ' . $nombre_remitente;
    $body = mb_substr(strip_tags($mensaje), 0, 120);

    foreach ($allTokensAndData as $tkData) {
        $webviewUrl = $frontend_url . "/Mensajes";

        $datosPushFormateados = formatearDatosPushFCM(['message_id' => (string)$id_insertado, 'url' => $webviewUrl]);
        enviarPushFirebase($tkData['token'], $title, $body, $datosPushFormateados);
    }
}

echo json_encode(['success', 'Mensaje procesado']);
exit;
