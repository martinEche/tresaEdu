<?php
include "conectar.php";
$conexion = conectarDB();
$sql = "DESCRIBE usuarios";
$res = $conexion->query($sql);
while($row = $res->fetch_assoc()) {
    echo $row['Field'] . "\n";
}
?>
