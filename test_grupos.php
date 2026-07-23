<?php
include "API/conectar.php";
$conexion = conectarDB();
$q = $conexion->query("DESCRIBE grupo_practico");
echo "=== grupo_practico ===\n";
while($r = $q->fetch_assoc()) {
    echo $r['Field'] . " - " . $r['Type'] . "\n";
}
$q = $conexion->query("SHOW TABLES LIKE '%grupo_practico%'");
while($r = $q->fetch_row()) {
    echo $r[0] . "\n";
}
$conexion->close();
?>
