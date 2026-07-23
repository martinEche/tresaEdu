<?php

require_once __DIR__ . '/config_cors.php';
function conectarDB(){
	$localhost = DB_HOST;
	$usuario = DB_USER;
	$clave = DB_PASS;
	$base = DB_NAME;

	$conexion = mysqli_connect($localhost, $usuario, $clave,$base);
    if(!($conexion)){
		echo 'Ha sucedido un error inexperado en la conexion de la base de datos';
	}

    return $conexion;
}

?>