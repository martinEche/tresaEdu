<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
include "API/conectar.php";
$conexion = conectarDB();
$usuario = 'martinEche'; // Will use a known username or fetch one

$SQL_GRUPOSP="SELECT
    'GRUPOP' AS tipo_chat,
    CONCAT('GRUPOP_', gp.id) AS conversacion,
    gp.nombre_grupo,
    gp.descripcion AS descripcion_grupo,
    gp.imagen AS imagen_grupo
FROM mensajes_grupo_creado gp
INNER JOIN mensajes_grupo_participantes gpp ON gpp.id_mensaje_grupo = gp.id
INNER JOIN usuarios u ON u.id = gpp.id_usuario
WHERE u.usuario = '$usuario'";

$res = $conexion->query($SQL_GRUPOSP);
if($res) {
    while($row = $res->fetch_assoc()) {
        print_r($row);
    }
} else {
    echo "ERROR: " . $conexion->error;
}
?>
