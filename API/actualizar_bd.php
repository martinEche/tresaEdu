<?php
/**
 * Script de migración para actualizar la base de datos de producción / demo.
 * Este script agrega la columna 'presentacion' a 'curso_grupo' y crea las tablas necesarias para:
 * - Legajo de usuario (legajo_usuario)
 * - Rúbricas (rubricas, rubrica_criterios, rubrica_evaluaciones)
 */

header("Content-Type: text/html; charset=utf-8");
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config_cors.php';
include __DIR__ . '/conectar.php';

$conexion = conectarDB();
if (!$conexion) {
    die("<div style='color:red; font-family:sans-serif;'>Error: No se pudo conectar a la base de datos. Verifique config_env.php</div>");
}
$conexion->set_charset('utf8mb4');

echo "<div style='font-family:sans-serif; max-width:800px; margin:20px auto; padding:20px; border:1px solid #ccc; border-radius:8px; background:#f9f9f9;'>";
echo "<h2 style='color:#0d6efd; margin-top:0;'>🛠️ Migración y Actualización de Base de Datos</h2>";
echo "<p>Ejecutando verificaciones y actualizaciones en la base de datos...</p><hr>";

// 1. Agregar columna 'presentacion' en 'curso_grupo'
$check_col = $conexion->query("SHOW COLUMNS FROM curso_grupo LIKE 'presentacion'");
if ($check_col->num_rows == 0) {
    $sql_alter = "ALTER TABLE curso_grupo ADD COLUMN presentacion TEXT NULL";
    if ($conexion->query($sql_alter)) {
        echo "<p style='color:green;'>✔️ Columna <strong>presentacion</strong> agregada correctamente a la tabla <strong>curso_grupo</strong>.</p>";
    } else {
        echo "<p style='color:red;'>❌ Error al agregar columna 'presentacion': " . $conexion->error . "</p>";
    }
} else {
    echo "<p style='color:gray;'>ℹ️ La columna <strong>presentacion</strong> ya existe en la tabla <strong>curso_grupo</strong>.</p>";
}

// 1b. Agregar columna 'estado_aprobacion' en 'valoracion'
$check_col_val = $conexion->query("SHOW COLUMNS FROM valoracion LIKE 'estado_aprobacion'");
if ($check_col_val->num_rows == 0) {
    $sql_alter_val = "ALTER TABLE valoracion ADD COLUMN estado_aprobacion VARCHAR(100) NOT NULL DEFAULT 'aprobada'";
    if ($conexion->query($sql_alter_val)) {
        echo "<p style='color:green;'>✔️ Columna <strong>estado_aprobacion</strong> agregada correctamente a la tabla <strong>valoracion</strong>.</p>";
    } else {
        echo "<p style='color:red;'>❌ Error al agregar columna 'estado_aprobacion': " . $conexion->error . "</p>";
    }
} else {
    echo "<p style='color:gray;'>ℹ️ La columna <strong>estado_aprobacion</strong> ya existe en la tabla <strong>valoracion</strong>.</p>";
}

// 1c. Agregar columna 'archivo_comprobante' en 'pagos'
$check_col_pago = $conexion->query("SHOW COLUMNS FROM pagos LIKE 'archivo_comprobante'");
if ($check_col_pago->num_rows == 0) {
    $sql_alter_pago = "ALTER TABLE pagos ADD COLUMN archivo_comprobante VARCHAR(255) NULL";
    if ($conexion->query($sql_alter_pago)) {
        echo "<p style='color:green;'>✔️ Columna <strong>archivo_comprobante</strong> agregada correctamente a la tabla <strong>pagos</strong>.</p>";
    } else {
        echo "<p style='color:red;'>❌ Error al agregar columna 'archivo_comprobante': " . $conexion->error . "</p>";
    }
} else {
    echo "<p style='color:gray;'>ℹ️ La columna <strong>archivo_comprobante</strong> ya existe en la tabla <strong>pagos</strong>.</p>";
}

// 2. Crear tabla 'legajo_usuario'
$sql_legajo = "CREATE TABLE IF NOT EXISTS `legajo_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `tipo_documentacion` varchar(100) NOT NULL,
  `archivo` varchar(255) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `creado_por` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `legajo_usuario_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conexion->query($sql_legajo)) {
    echo "<p style='color:green;'>✔️ Tabla <strong>legajo_usuario</strong> verificada/creada correctamente.</p>";
} else {
    echo "<p style='color:red;'>❌ Error al crear tabla 'legajo_usuario': " . $conexion->error . "</p>";
}

// 3. Crear tabla 'rubricas'
$sql_rubricas = "CREATE TABLE IF NOT EXISTS `rubricas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_curso_grupo` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `visible_estudiante` tinyint(4) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `creado_por` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_curso_grupo` (`id_curso_grupo`),
  CONSTRAINT `rubricas_ibfk_1` FOREIGN KEY (`id_curso_grupo`) REFERENCES `curso_grupo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conexion->query($sql_rubricas)) {
    echo "<p style='color:green;'>✔️ Tabla <strong>rubricas</strong> verificada/creada correctamente.</p>";
} else {
    echo "<p style='color:red;'>❌ Error al crear tabla 'rubricas': " . $conexion->error . "</p>";
}

// 4. Crear tabla 'rubrica_criterios'
$sql_criterios = "CREATE TABLE IF NOT EXISTS `rubrica_criterios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_rubrica` int(11) NOT NULL,
  `criterio` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `puntaje_maximo` int(11) DEFAULT 10,
  PRIMARY KEY (`id`),
  KEY `id_rubrica` (`id_rubrica`),
  CONSTRAINT `rubrica_criterios_ibfk_1` FOREIGN KEY (`id_rubrica`) REFERENCES `rubricas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conexion->query($sql_criterios)) {
    echo "<p style='color:green;'>✔️ Tabla <strong>rubrica_criterios</strong> verificada/creada correctamente.</p>";
} else {
    echo "<p style='color:red;'>❌ Error al crear tabla 'rubrica_criterios': " . $conexion->error . "</p>";
}

// 5. Crear tabla 'rubrica_evaluaciones'
$sql_evaluaciones = "CREATE TABLE IF NOT EXISTS `rubrica_evaluaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_criterio` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `calificacion` varchar(50) DEFAULT NULL,
  `comentario` text DEFAULT NULL,
  `evaluado_por` int(11) NOT NULL,
  `fecha_evaluacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_criterio_estudiante` (`id_criterio`,`id_estudiante`),
  KEY `id_estudiante` (`id_estudiante`),
  CONSTRAINT `rubrica_evaluaciones_ibfk_1` FOREIGN KEY (`id_criterio`) REFERENCES `rubrica_criterios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rubrica_evaluaciones_ibfk_2` FOREIGN KEY (`id_estudiante`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conexion->query($sql_evaluaciones)) {
    echo "<p style='color:green;'>✔️ Tabla <strong>rubrica_evaluaciones</strong> verificada/creada correctamente.</p>";
} else {
    echo "<p style='color:red;'>❌ Error al crear tabla 'rubrica_evaluaciones': " . $conexion->error . "</p>";
}

// 6. Actualizar tabla 'notificaciones'
$check_col_leida = $conexion->query("SHOW COLUMNS FROM notificaciones LIKE 'leida'");
if ($check_col_leida->num_rows == 0) {
    $sql_alter_noti = "ALTER TABLE notificaciones ADD COLUMN leida TINYINT(1) NOT NULL DEFAULT 0";
    if ($conexion->query($sql_alter_noti)) {
        echo "<p style='color:green;'>✔️ Columna <strong>leida</strong> agregada correctamente a la tabla <strong>notificaciones</strong>.</p>";
    } else {
        echo "<p style='color:red;'>❌ Error al agregar columna 'leida': " . $conexion->error . "</p>";
    }
} else {
    echo "<p style='color:gray;'>ℹ️ La columna <strong>leida</strong> ya existe en la tabla <strong>notificaciones</strong>.</p>";
}

$check_col_fecha = $conexion->query("SHOW COLUMNS FROM notificaciones LIKE 'fecha'");
if ($check_col_fecha->num_rows == 0) {
    $sql_alter_noti_fecha = "ALTER TABLE notificaciones ADD COLUMN fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP";
    if ($conexion->query($sql_alter_noti_fecha)) {
        echo "<p style='color:green;'>✔️ Columna <strong>fecha</strong> agregada correctamente a la tabla <strong>notificaciones</strong>.</p>";
    } else {
        echo "<p style='color:red;'>❌ Error al agregar columna 'fecha': " . $conexion->error . "</p>";
    }
} else {
    echo "<p style='color:gray;'>ℹ️ La columna <strong>fecha</strong> ya existe en la tabla <strong>notificaciones</strong>.</p>";
}

$conexion->close();
echo "<hr><p style='font-weight:bold; color:#198754;'>Proceso finalizado. Si todos los ítems se marcaron en verde o gris, su base de datos está actualizada.</p>";
echo "<p style='font-size:0.85em; color:gray;'>Nota: Por seguridad, se recomienda eliminar este archivo (<code>actualizar_bd.php</code>) de su servidor una vez ejecutado.</p>";
echo "</div>";
?>
