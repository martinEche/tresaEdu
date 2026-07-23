<?php

require_once __DIR__ . '/config_cors.php';
header('Content-Type: application/json');

require 'conectar.php';
$conexion = conectarDB();

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    require_once 'validarToken.php';
    $tokenData = validarToken(); // Protegemos el endpoint para modificaciones
}

if ($conexion === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al conectar a la base de datos']);
    exit;
}

$conexion->set_charset('utf8mb4');

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $sql = "SELECT * FROM configuracion LIMIT 1";
        $res = $conexion->query($sql);
        $config = $res->fetch_assoc();
        echo json_encode($config ?: []);
        break;

    case 'POST':
        // Datos de texto
        $id = $_POST['id'] ?? 1; // suponiendo solo 1 config
        $nombre = $_POST['nombre'] ?? '';
        $sub_titulo = $_POST['sub_titulo'] ?? '';
        $logo_solo = $_POST['logo_solo'] ?? '';
        $color_principal = $_POST['color_principal'] ?? '';
        $color_secundario = $_POST['color_secundario'] ?? '';
        $color_terciario = $_POST['color_terciario'] ?? '';
        $fondo_barra_superior = $_POST['fondo_barra_superior'] ?? '';
        $color_texto_barra_superior = $_POST['color_texto_barra_superior'] ?? '';
        $fondo_barra_lateral = $_POST['fondo_barra_lateral'] ?? '';
        $color_texto_barra_lateral = $_POST['color_texto_barra_lateral'] ?? '';
        $formato_icono_perfil = $_POST['formato_icono_perfil'] ?? '';

        // Rutas actuales (se usan si no llega archivo nuevo)
        $sqlExist = "SELECT logo_grande, logo_chico, logo_solo, imagen_fondo FROM configuracion WHERE id=?";
        $stmtExist = $conexion->prepare($sqlExist);
        $stmtExist->bind_param("i", $id);
        $stmtExist->execute();
        $stmtExist->bind_result($logo_grande_actual, $logo_chico_actual, $logo_solo_actual, $imagen_fondo_actual);
        $stmtExist->fetch();
        $stmtExist->close();

        // Subir archivos si llegan
        $carpeta = "ConfigArchivos";
        if (!file_exists($carpeta)) {
            mkdir($carpeta, 0777, true);
        }

        $logo_grande = $logo_grande_actual;
        if (isset($_FILES['logo_grande']) && $_FILES['logo_grande']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['logo_grande']['name'], PATHINFO_EXTENSION);
            $ruta = $carpeta . "/" . uniqid("lg_") . "." . $ext;
            if (move_uploaded_file($_FILES['logo_grande']['tmp_name'], $ruta)) {
                $logo_grande = $ruta;
            }
        }

        $logo_chico = $logo_chico_actual;
        if (isset($_FILES['logo_chico']) && $_FILES['logo_chico']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['logo_chico']['name'], PATHINFO_EXTENSION);
            $ruta = $carpeta . "/" . uniqid("lc_") . "." . $ext;
            if (move_uploaded_file($_FILES['logo_chico']['tmp_name'], $ruta)) {
                $logo_chico = $ruta;
            }
        }

        $logo_solo = $logo_solo_actual;
        if (isset($_FILES['logo_solo']) && $_FILES['logo_solo']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['logo_solo']['name'], PATHINFO_EXTENSION);
            $ruta = $carpeta . "/" . uniqid("ls_") . "." . $ext;
            if (move_uploaded_file($_FILES['logo_solo']['tmp_name'], $ruta)) {
                $logo_solo = $ruta;
            }
        }

        $imagen_fondo = $imagen_fondo_actual;
        if (isset($_FILES['imagen_fondo']) && $_FILES['imagen_fondo']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['imagen_fondo']['name'], PATHINFO_EXTENSION);
            $ruta = $carpeta . "/" . uniqid("bg_") . "." . $ext;
            if (move_uploaded_file($_FILES['imagen_fondo']['tmp_name'], $ruta)) {
                $imagen_fondo = $ruta;
            }
        }

        // Update final
        $sql = "UPDATE configuracion 
                SET nombre=?, sub_titulo=?, logo_grande=?, logo_chico=?, logo_solo=?, 
                    imagen_fondo=?, color_principal=?, color_secundario=?, color_terciario=?, 
                    fondo_barra_superior=?, color_texto_barra_superior=?, 
                    fondo_barra_lateral=?, color_texto_barra_lateral=?, formato_icono_perfil=? 
                WHERE id=?";

        if ($stmt = $conexion->prepare($sql)) {
            $stmt->bind_param(
                "ssssssssssssssi",
                $nombre,
                $sub_titulo,
                $logo_grande,
                $logo_chico,
                $logo_solo,
                $imagen_fondo,
                $color_principal,
                $color_secundario,
                $color_terciario,
                $fondo_barra_superior,
                $color_texto_barra_superior,
                $fondo_barra_lateral,
                $color_texto_barra_lateral,
                $formato_icono_perfil,
                $id
            );

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Configuración actualizada"]);
            } else {
                echo json_encode(["success" => false, "error" => "Error en update: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["success" => false, "error" => "No se pudo preparar la consulta"]);
        }
        break;
}
$conexion->close();
