<?php
require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";
require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); 
$conexion->set_charset('utf8mb4');

if ($method === 'GET') {
    // Top inasistencias
    $sql_ausencias = "
        SELECT u.id, u.nombre, u.apellido, u.dni, COUNT(a.id) as total_ausencias
        FROM asistencia a
        INNER JOIN usuarios u ON a.id_usuario = u.id
        WHERE a.asistencia = 'Ausente' AND YEAR(a.fecha) = YEAR(CURDATE())
        GROUP BY u.id
        HAVING total_ausencias > 0
        ORDER BY total_ausencias DESC
        LIMIT 20
    ";

    $ausencias = [];
    if ($stmt = $conexion->prepare($sql_ausencias)) {
        $stmt->execute();
        $res = $stmt->get_result();
        $ausencias = $res->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
    }

    // Top bajas calificaciones
    $sql_calificaciones = "
        SELECT u.id, u.nombre, u.apellido, u.dni, 
               v.valor, v.estado_aprobacion, c.id AS curso_id, ie.titulo AS instancia_titulo
        FROM valoracion v
        INNER JOIN usuarios u ON v.id_usuario = u.id
        INNER JOIN instancia_evaluacion ie ON v.id_instancia = ie.id
        INNER JOIN curso c ON v.id_curso = c.id
        WHERE v.valor IN ('EP', 'SC', 'Pendiente', '1', '2', '3', '4', '5')
          AND YEAR(ie.fecha_cierre) = YEAR(CURDATE())
        ORDER BY ie.fecha_cierre DESC
        LIMIT 30
    ";
    
    $calificaciones = [];
    if ($stmt = $conexion->prepare($sql_calificaciones)) {
        $stmt->execute();
        $res = $stmt->get_result();
        $calificaciones = $res->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
    }

    echo json_encode([
        'success' => true,
        'alertasAsistencia' => $ausencias,
        'alertasCalificaciones' => $calificaciones
    ]);
}
$conexion->close();
?>
