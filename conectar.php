<?php
function conectarDB(){
	$localhost = "localhost";
	$usuario = "tresatec_db";
	$clave = "tresatec_Demo";
	$base = "tresatec_bd";

	$conexion = mysqli_connect($localhost, $usuario, $clave,$base);
    if(!($conexion)){
		echo 'Ha sucedido un error inexperado en la conexion de la base de datos';
	}

    return $conexion;
}

?>
