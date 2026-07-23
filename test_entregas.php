<?php
include "API/conectar.php";
$conexion = conectarDB();
$q = $conexion->query("DESCRIBE entregas");
echo "=== entregas ===\n";
while($r = $q->fetch_assoc()) {
    echo $r['Field'] . " - " . $r['Type'] . "\n";
}
$q = $conexion->query("DESCRIBE entrega_adjunto");
echo "=== entrega_adjunto ===\n";
while($r = $q->fetch_assoc()) {
    echo $r['Field'] . " - " . $r['Type'] . "\n";
}
$conexion->close();
?>
