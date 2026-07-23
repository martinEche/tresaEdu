<?php
require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";
$conexion = conectarDB();
if (!$conexion) {
    echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos."]);
    exit;
}
$conexion->set_charset('utf8mb4');

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$rolUsuario = intval($tokenData->rol);
$idUsuarioLogueado = intval($tokenData->id);

switch ($method) {
    case 'GET':
        $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 0;

        if ($id_usuario === 0) {
            echo json_encode(["success" => false, "message" => "ID de usuario no especificado."]);
            exit;
        }

        // Permisos: Dueño de la ficha o roles 1, 2, 3, 4
        if ($idUsuarioLogueado !== $id_usuario && !in_array($rolUsuario, [1, 2, 3, 4])) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Acceso denegado. No tienes permisos para ver este legajo."]);
            exit;
        }

        $sql = "SELECT l.id, l.tipo_documentacion, l.archivo, l.fecha, u.nombre AS creador_nombre, u.apellido AS creador_apellido
                FROM legajo_usuario l
                LEFT JOIN usuarios u ON l.creado_por = u.id
                WHERE l.id_usuario = ?
                ORDER BY l.fecha DESC";

        if ($stmt = $conexion->prepare($sql)) {
            $stmt->bind_param('i', $id_usuario);
            if (!$stmt->execute()) {
                echo json_encode(["success" => false, "message" => "Error al ejecutar consulta.", "error" => $stmt->error]);
                $stmt->close();
                exit;
            }
            $result = $stmt->get_result();
            if (!$result) {
                echo json_encode(["success" => false, "message" => "Error al obtener resultados.", "error" => $stmt->error]);
                $stmt->close();
                exit;
            }
            $documentos = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            echo json_encode(["success" => true, "documentos" => $documentos, "debug_id" => $id_usuario]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al preparar la consulta.", "error" => $conexion->error]);
        }
        break;

    case 'POST':
        // El alta y la eliminación solo la pueden hacer los roles 1, 2, 3, 4
        if (!in_array($rolUsuario, [1, 2, 3, 4])) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Acceso denegado. No tienes permisos para modificar el legajo."]);
            exit;
        }

        // Caso 1: Eliminación (si viene accion en el body o POST)
        $body = json_decode(file_get_contents('php://input'), true);
        $accion = (is_array($body) && isset($body['accion'])) ? $body['accion'] : ($_POST['accion'] ?? '');

        if ($accion === 'eliminar') {
            $id_documento = (is_array($body) && isset($body['id'])) ? intval($body['id']) : (isset($_POST['id']) ? intval($_POST['id']) : 0);
            if ($id_documento === 0) {
                echo json_encode(["success" => false, "message" => "ID de documento no especificado para eliminar."]);
                exit;
            }

            // Buscar el nombre del archivo en la base de datos
            $stmt = $conexion->prepare("SELECT archivo FROM legajo_usuario WHERE id = ?");
            $stmt->bind_param('i', $id_documento);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $archivoNombre = $row['archivo'];
                $rutaCompleta = __DIR__ . '/uploads/legajos/' . $archivoNombre;

                // Intentar borrar del disco
                if (file_exists($rutaCompleta)) {
                    unlink($rutaCompleta);
                }

                // Borrar de la BD
                $stmtDel = $conexion->prepare("DELETE FROM legajo_usuario WHERE id = ?");
                $stmtDel->bind_param('i', $id_documento);
                if ($stmtDel->execute()) {
                    echo json_encode(["success" => true, "message" => "Documento eliminado correctamente."]);
                } else {
                    echo json_encode(["success" => false, "message" => "Error al eliminar de la base de datos."]);
                }
                $stmtDel->close();
            } else {
                echo json_encode(["success" => false, "message" => "Documento no encontrado."]);
            }
            $stmt->close();
            exit;
        }

        // Caso 2: Subida de archivo (Multipart form)
        $id_usuario = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : 0;
        $tipo_documentacion = isset($_POST['tipo_documentacion']) ? trim($_POST['tipo_documentacion']) : '';

        if ($id_usuario === 0 || empty($tipo_documentacion)) {
            echo json_encode(["success" => false, "message" => "Faltan datos obligatorios (id_usuario, tipo_documentacion)."]);
            exit;
        }

        if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(["success" => false, "message" => "Error al subir el archivo o no se adjuntó ninguno."]);
            exit;
        }

        // Crear carpeta si no existe
        $dir_subida = __DIR__ . '/uploads/legajos/';
        if (!file_exists($dir_subida)) {
            mkdir($dir_subida, 0777, true);
        }

        $extension = pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION);
        $nombreOriginalClean = preg_replace("/[^a-zA-Z0-9\._-]/", "_", pathinfo($_FILES['archivo']['name'], PATHINFO_FILENAME));
        // Generar un nombre único para evitar colisiones
        $nombreArchivoUnico = $nombreOriginalClean . '_' . uniqid() . '.' . $extension;
        $rutaDestino = $dir_subida . $nombreArchivoUnico;

        if (move_uploaded_file($_FILES['archivo']['tmp_name'], $rutaDestino)) {
            // Guardar en la base de datos
            $stmt = $conexion->prepare("INSERT INTO legajo_usuario (id_usuario, tipo_documentacion, archivo, creado_por) VALUES (?, ?, ?, ?)");
            $stmt->bind_param('issi', $id_usuario, $tipo_documentacion, $nombreArchivoUnico, $idUsuarioLogueado);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Documento subido e registrado correctamente.", "archivo" => $nombreArchivoUnico]);
            } else {
                // Borrar archivo si falla inserción en base de datos
                unlink($rutaDestino);
                echo json_encode(["success" => false, "message" => "Error al registrar el documento en la base de datos."]);
            }
            $stmt->close();
        } else {
            echo json_encode(["success" => false, "message" => "No se pudo guardar el archivo físico en el servidor."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no soportado."]);
        break;
}

$conexion->close();
?>
