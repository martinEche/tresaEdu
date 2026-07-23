<?php

require_once __DIR__ . '/config_cors.php';
	//header("Content-Type: text/html; charset=utf-8");
	//$method = $_SERVER['REQUEST_METHOD'];
	
	include "conectar1.php";
	$conexion = conectarDB(); //ejecuta la funcion del conectar

	$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
	$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php

	$conexion->set_charset('utf8mb4');
			
	$usuario = $dataObject-> correo;
	$password= $dataObject-> clave;
	$nombre= $dataObject->nombre ;
	$apellidos= $dataObject-> apellido;
	$idTipoUsuario= "2";	
	$clave = password_hash($password, PASSWORD_DEFAULT);

//	echo $nombre;
//	echo "<br/>";
//	echo $apellidos;
//	echo "<br/>";
//	echo $usuario ;
//	echo "<br/>";
//	echo $password;
//	echo "<br/>";
//	echo $clave;
//	echo "<hr/>";

if ($conexion->connect_error) {
  die("Connection failed: " . $conexion->connect_error);
}

$sql = "INSERT INTO usuarios (usuario, clave, nombre, apellidos, idTipoUsuario) VALUES ('$usuario', '$clave', '$nombre', '$apellidos', '$idTipoUsuario')";

if ($conexion->query($sql) === TRUE) {
  echo "New record created successfully";
} else {
  echo "Error: " . $sql . "<br>" . $conexion->error;
}

$conexion->close();

?>