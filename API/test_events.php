<?php
include "conectar.php";
$conexion = conectarDB();

$sql = "SELECT * FROM calendario WHERE id_curso_grupo = 23 AND tipo_recordatorio = 'todosDETC'";
$res = $conexion->query($sql);
while($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id_evento'] . " | Evento: " . $row['evento'] . " | Fecha: " . $row['fecha'] . "\n";
}
echo "Done.\n";
?>
