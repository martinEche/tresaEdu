<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint (obliga a tener token)

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;
 
switch($method){
    case 'GET':
        break;
    case 'POST':
        //esto se manda:
        //formData.append("imagen", file);
        //formData.append("id_curso_grupo", c.id_curso_grupo); // o el identificador que uses
        $id_curso_grupo = $_POST['id_curso_grupo'];
        //leer la imagen pasada por el formdata en file
        $imagen = $_FILES['imagen'];
        //validar que sea una imagen
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($imagen['type'], $allowedTypes)) {
            echo json_encode(["error" => "Archivo no permitido. Solo se permiten imágenes JPEG, PNG y GIF."]);
            exit;
        }
        //mover la imagen a una carpeta del servidor
        $carpetaDestino = "caratulas/";
        //crear la carpeta si no existe
        if (!is_dir($carpetaDestino)) {
            mkdir($carpetaDestino, 0777, true);
        }
        //prepara nombre de imagen con el id del curso grupo y timepstamp para evitar cache
        $timestamp = time();
        //optener la extencion para agregarla al final del nombre
        $extencion = pathinfo($imagen['name'], PATHINFO_EXTENSION);
        $nombreImagen = "curso_grupo_" . $id_curso_grupo . "_" . $timestamp . "." . $extencion;
        $rutaDestino = $carpetaDestino . $nombreImagen;
        //mover la imagen a la carpeta destino
        if (move_uploaded_file($imagen['tmp_name'], $rutaDestino)) {
            //actualizar la ruta de la imagen en la base de datos
            $sql = "UPDATE curso_grupo SET imagen_grupo_curso = '$rutaDestino' WHERE id = $id_curso_grupo";
            if ($conexion->query($sql) === TRUE) {
                echo json_encode(["success" => "Imagen subida y ruta actualizada correctamente."]);
            } else {
                echo json_encode(["error" => "Error al actualizar la ruta en la base de datos: " . $csql . " - " . $conexion->error]);
            }
        } else {
            echo json_encode(["error" => "Error al subir la imagen."]);
        }
        break;
    case 'PUT':
        break;
    case 'DELETE':
        break;
}
$conexion->close();
?>
