<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php

switch($method){
    case 'GET':
        //si llega un documento busco entre todos los usuarios a ver si exixte 
        // en el front consulto si res.data.existe y si es true, 
        // entonces res.data.tutor tiene toda la info del tutor y completo el form con esos datos
        if(isset($_GET['documento'])){
            $documento = $_GET['documento'];
            $sql = "SELECT u.id, u.nombre, 
                        u.apellido, 
                        u.documento, 
                        up.telefono, 
                        up.email, 
                        up.calle, 
                        up.numero, 
                        up.piso, 
                        up.depto, 
                        up.ciudad, 
                        up.provincia 
                    FROM usuarios u 
                    JOIN usuario_perfil up ON u.id = up.id_usuario 
                    WHERE u.documento = '$documento'";
            $result = $conexion->query($sql);
            if ($result->num_rows > 0) {
                $tutor = $result->fetch_assoc();

                echo json_encode(['existe' => true, 'tutor' => $tutor]);
            } else {
                echo json_encode(["existe" => false, "error" => "Tutor no encontrado"]);
            }
        }
      break;
    case 'POST':
         //tomar los datos del objeto y asignarlos a variables. 
         // Datos: id, documento, nombre, apellido, documento, calle, numero, piso, depto, 
         // ciudad, provincia, telefono, email, idEstudiante:idEstudiante
        $nombre = $dataObject->nombre;
        $apellido = $dataObject->apellido;
        $telefono = $dataObject->telefono;
        $email = $dataObject->email;
        $documento = $dataObject->documento;
        $calle = $dataObject->calle;
        $numero = $dataObject->numero;
        $piso = $dataObject->piso;
        $depto = $dataObject->depto;
        $ciudad = $dataObject->ciudad;
        $provincia = $dataObject->provincia;
        $id_tutor = $dataObject->id;
        $id_estudiante = $dataObject->idEstudiante;
        //Algunos datos que son para la tabla usuarios: nombre, apellido,documento y completar clave=123 y usuario = documento.
        //otros para la tabla usuario_perfil: telefono, email, calle, numero, piso, depto, ciudad, provincia.
        //id_estudiantes es para relacionar el tutor(id) con el estudiantee n la tabla vinculo
        //si el $id_tutor es null hay que crear un usuario nuevo y poner el rol tutor (8), sino hay que actualizar el usuario existente.
        //tablas: 
        // usuarios: usuario, clave (en formato hash), nombre, apellido, apodo, documento,estado
        // usuario_perfil: id_usuario, telefono, email, calle, numero, piso, depto, ciudad, provincia
        // rol: id_usuario, rol, creado_el
        // vinculo:id,id_estudiante,id_tutor, descripcion
        if($id_tutor == null){
        //crear nuevo tutor
            $claveHash = password_hash("123", PASSWORD_DEFAULT);
            $usuario = $documento;
            $sqlInsertUsuario = "INSERT INTO usuarios (usuario, clave, nombre, apellido, apodo, documento, estado) VALUES ('$usuario', '$claveHash', '$nombre', '$apellido', '', '$documento', 1)";
            if ($conexion->query($sqlInsertUsuario) === TRUE) {
                $id_usuario = $conexion->insert_id; // Obtener el ID del usuario recién creado
                // Insertar en usuario_perfil
                $sqlInsertPerfil = "INSERT INTO usuario_perfil (id_usuario, telefono, email, calle, numero, piso, depto, ciudad, provincia) VALUES ('$id_usuario', '$telefono', '$email', '$calle', '$numero', '$piso', '$depto', '$ciudad', '$provincia')";
                if ($conexion->query($sqlInsertPerfil) === TRUE) {
                    // Insertar en rol
                    $sqlInsertRol = "INSERT INTO rol (id_usuario, rol, creado_el) VALUES ('$id_usuario', 8, NOW())";
                    if ($conexion->query($sqlInsertRol) === TRUE) {
                        // Insertar en vinculo
                        $sqlInsertVinculo = "INSERT INTO vinculo (id_estudiante, id_tutor, descripcion) VALUES ('$id_estudiante', '$id_usuario', 'Tutor principal')";
                        if ($conexion->query($sqlInsertVinculo) === TRUE) {
                            echo json_encode(["success" => true]);
                        } else {
                            echo json_encode(["success" => false, "error" => "Error al insertar en vinculo: " . $conexion->error]);
                        }
                    } else {
                        echo json_encode(["success" => false, "error" => "Error al insertar en rol: " . $conexion->error]);
                    }
                } else {
                    echo json_encode(["success" => false, "error" => "Error al insertar en usuario_perfil: " . $conexion->error]);
                }
            } else {
                echo json_encode(["success" => false, "error" => "Error al insertar en usuarios: " . $conexion->error]);
            }
        } else {
        //actualizar tutor existente
            //primero actualizar la tabla usuarios y luego la tabla usuario_perfil
            $sqlUpdateUsuario = "UPDATE usuarios 
                                    SET nombre='$nombre', apellido='$apellido', documento='$documento' 
                                    WHERE id='$id_tutor'";
            if ($conexion->query($sqlUpdateUsuario) === TRUE) {
                $sqlUpdatePerfil = "UPDATE usuario_perfil 
                                    SET telefono='$telefono', 
                                        email='$email', 
                                        calle='$calle', 
                                        numero='$numero', 
                                        piso='$piso', 
                                        depto='$depto', 
                                        ciudad='$ciudad', 
                                        provincia='$provincia' 
                                    WHERE id_usuario='$id_tutor'";

                if ($conexion->query($sqlUpdatePerfil) === TRUE) {
                    // Insertar en rol
                    $sqlInsertRol = "INSERT INTO rol (id_usuario, rol, creado_el) VALUES ('$id_tutor', 8, NOW())";
                    if ($conexion->query($sqlInsertRol) === TRUE) {
                        // Insertar en vinculo
                        $sqlInsertVinculo = "INSERT INTO vinculo (id_estudiante, id_tutor, descripcion) VALUES ('$id_estudiante', '$id_tutor', 'Tutor principal')";
                        if ($conexion->query($sqlInsertVinculo) === TRUE) {
                            echo json_encode(["success" => true]);
                        } else {
                            echo json_encode(["success" => false, "error" => "Error al insertar en vinculo: " . $conexion->error]);
                        }
                    } else {
                        echo json_encode(["success" => false, "error" => "Error al insertar en rol: " . $conexion->error]);
                    }
                } else {
                    echo json_encode(["success" => false, "error" => "Error al actualizar usuario_perfil: " . $conexion->error]);
                }
            } else {
                echo json_encode(["success" => false, "error" => "Error al actualizar usuarios: " . $conexion->error]);
            }
        }
      break;
    case 'PUT':
      break;
    case 'DELETE':
      break;
    default:
      break;
}
$conexion->close();

?>