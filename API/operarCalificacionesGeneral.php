<?php
require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/conectar.php';

require_once 'validarToken.php';
$tokenData = validarToken(); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];

/* ── Asegurarse de que exista la columna estado_aprobacion en valoracion ── */
$check_col = $conexion->query("SHOW COLUMNS FROM valoracion LIKE 'estado_aprobacion'");
if ($check_col->num_rows === 0) {
    $conexion->query("ALTER TABLE valoracion ADD COLUMN estado_aprobacion VARCHAR(50) NULL DEFAULT NULL");
}

/* ══════════════════════════════════════════════════════════════════════════
   GET  ?accion=estados&id_grupo=XXX&id_curso=YYY&id_instancia=ZZZ
   Devuelve { success, aprobadas: { id_usuario: bool }, publicadas: bool }
   ══════════════════════════════════════════════════════════════════════════ */
if ($method === 'GET') {
    $accion   = $_GET['accion']   ?? '';
    $id_grupo = (int)($_GET['id_grupo'] ?? 0);
    $id_curso = (int)($_GET['id_curso'] ?? 0);
    $id_instancia = (int)($_GET['id_instancia'] ?? 0);

    if ($accion !== 'estados' || !$id_grupo || !$id_curso || !$id_instancia) {
        echo json_encode(['success' => false, 'mensaje' => 'Parámetros inválidos']);
        exit;
    }

    $stmt = $conexion->prepare("
        SELECT v.id_usuario, v.estado_aprobacion 
        FROM valoracion v
        JOIN curso_estudiante ce ON ce.id_usuario = v.id_usuario
        WHERE ce.id_curso_grupo = ? 
          AND v.id_curso = ? 
          AND v.id_instancia = ?
    ");
    $stmt->bind_param('iii', $id_grupo, $id_curso, $id_instancia);
    $stmt->execute();
    $result = $stmt->get_result();

    $aprobadas  = [];
    
    // Contamos total de estudiantes del grupo para verificar publicación
    $stmt_count = $conexion->prepare("SELECT COUNT(*) as total FROM curso_estudiante WHERE id_curso_grupo = ?");
    $stmt_count->bind_param('i', $id_grupo);
    $stmt_count->execute();
    $total_estudiantes = (int)($stmt_count->get_result()->fetch_assoc()['total'] ?? 0);

    $count_publicados = 0;
    while ($row = $result->fetch_assoc()) {
        $estado = $row['estado_aprobacion'];
        $aprobadas[(int)$row['id_usuario']] = ($estado === 'aprobada' || $estado === 'publicada');
        if ($estado === 'publicada') {
            $count_publicados++;
        }
    }
    
    $publicadas = ($total_estudiantes > 0 && $count_publicados === $total_estudiantes);

    echo json_encode([
        'success'   => true,
        'aprobadas' => $aprobadas,
        'publicadas' => $publicadas,
    ]);
    exit;
}

/* ══════════════════════════════════════════════════════════════════════════
   POST  { accion, id_grupo, id_curso, id_instancia, [id_usuario, aprobada] }
   ══════════════════════════════════════════════════════════════════════════ */
if ($method === 'POST') {
    $body     = json_decode(file_get_contents('php://input'), true);
    $accion   = $body['accion']   ?? '';
    $id_grupo = (int)($body['id_grupo'] ?? 0);
    $id_curso = (int)($body['id_curso'] ?? 0);
    $id_instancia = (int)($body['id_instancia'] ?? 0);

    /* ── aprobar ─────────────────────────────────────────────────────── */
    if ($accion === 'aprobar') {
        $id_usuario = (int)($body['id_usuario'] ?? 0);
        $aprobada   = $body['aprobada'] ? 1 : 0;
        $estado     = $aprobada ? 'aprobada' : null;

        $stmt = $conexion->prepare("
            UPDATE valoracion 
            SET estado_aprobacion = ? 
            WHERE id_usuario = ? AND id_curso = ? AND id_instancia = ?
        ");
        $stmt->bind_param('siii', $estado, $id_usuario, $id_curso, $id_instancia);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'mensaje' => $conexion->error]);
        }
        exit;
    }

    /* ── publicar ────────────────────────────────────────────────────── */
    if ($accion === 'publicar') {
        // Verificar que todos los estudiantes del grupo tengan aprobada = 1
        $stmt = $conexion->prepare("
            SELECT COUNT(ce.id_usuario) AS total,
                   SUM(CASE WHEN v.estado_aprobacion = 'aprobada' THEN 1 ELSE 0 END) AS aprobados
            FROM curso_estudiante ce
            LEFT JOIN valoracion v ON ce.id_usuario = v.id_usuario 
                AND v.id_curso = ? 
                AND v.id_instancia = ?
            WHERE ce.id_curso_grupo = ?
        ");
        $stmt->bind_param('iii', $id_curso, $id_instancia, $id_grupo);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if ((int)$row['total'] === 0 || (int)$row['total'] !== (int)$row['aprobados']) {
            echo json_encode([
                'success' => false,
                'mensaje' => 'No todas las calificaciones están aprobadas para poder publicar'
            ]);
            exit;
        }

        // Marcar todas como publicadas
        $stmt2 = $conexion->prepare("
            UPDATE valoracion v
            JOIN curso_estudiante ce ON ce.id_usuario = v.id_usuario
            SET v.estado_aprobacion = 'publicada'
            WHERE ce.id_curso_grupo = ?
              AND v.id_curso = ?
              AND v.id_instancia = ?
        ");
        $stmt2->bind_param('iii', $id_grupo, $id_curso, $id_instancia);

        if ($stmt2->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'mensaje' => $conexion->error]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'mensaje' => 'Acción no reconocida']);
    exit;
}

echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
$conexion->close();
?>
