<?php
require_once __DIR__ . '/config_cors.php';
echo 'Versión de MySQLi: ' . phpversion('mysqli') . "\n";
echo 'MySQL Native Driver (mysqlnd): ' . (function_exists('mysqli_fetch_all') ? 'Enabled' : 'Disabled') . "\n";

$mysqli = new mysqli("localhost", "independiente", "institutoCSI-tresatec", "independiente_institutoBD");

if ($mysqli->connect_error) {
    die("Conexión fallida: " . $mysqli->connect_error);
}

$stmt = $mysqli->prepare("SELECT id, nombre FROM usuarios WHERE id = ?");
$id = 1; // Asegúrate de que este ID exista en la tabla
$stmt->bind_param("i", $id);
$stmt->execute();

$resultado = $stmt->get_result();

while ($fila = $resultado->fetch_assoc()) {
    echo $fila['nombre'] . "\n";
}

$stmt->close();
$mysqli->close();

?>