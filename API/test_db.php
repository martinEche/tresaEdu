<?php
include "conectar.php";
$conexion = conectarDB();
$sql = "SELECT * FROM trabajo WHERE id = 7";
$res = $conexion->query($sql);
if ($res) {
    print_r($res->fetch_assoc());
} else {
    echo "Query failed";
}
echo "\n";
$sql2 = "SELECT * FROM trabajo_clase WHERE id = 7";
$res2 = $conexion->query($sql2);
if ($res2) {
    print_r($res2->fetch_assoc());
} else {
    echo "Query failed";
}
?>
