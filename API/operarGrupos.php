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
//$modo = $dataObject->modo;

switch($method){
    case 'GET':
        if (isset($_GET['modo']) && ($_GET['modo'] =='obtenerDatosGrupo')) {
            $id_grupo = intval($_GET['id_grupo']);
            $sql="SELECT nombre_grupo, descripcion, imagen 
                    FROM mensajes_grupo_creado 
                    WHERE id=?";
            if($consulta = $conexion->prepare($sql)){
                $consulta->bind_param("i", $id_grupo);
                $consulta->execute();
                $res = $consulta->get_result();
                if($datos = $res->num_rows >= 1){             
                     echo json_encode($res->fetch_assoc());
                }else{
                    echo json_encode(['error'=>'error no hay datos']);
                }
                $consulta->close();
                exit;      
            }else{
                echo json_encode(['error'=>'error en la consulta']);
                exit;
            }
        }else{
            echo $sql;
        }
        break;
    case 'POST':
        if (isset($dataObject->modo) && $dataObject->modo === 'agregar_participante') {

            $id_grupo = intval($dataObject->id_grupo);
            $id_usuario = intval($dataObject->id_usuario);
            $fecha = date('Y-m-d H:i:s');

            // evitar duplicados
            $check = $conexion->prepare("SELECT id FROM mensajes_grupo_participantes WHERE id_mensaje_grupo = ? AND id_usuario = ?");
            $check->bind_param("ii", $id_grupo, $id_usuario);
            $check->execute();
            $res = $check->get_result();

            if ($res->num_rows > 0) {
                echo json_encode(["success" => false, "mensaje" => "Ya es participante"]);
                exit;
            }
            $estado = 'participante';

            $stmt = $conexion->prepare("INSERT INTO mensajes_grupo_participantes (id_mensaje_grupo, id_usuario, fecha_ingreso, estado) VALUES (ABS(?), ?, ?, ?)");
            $stmt->bind_param("iiss", $id_grupo, $id_usuario, $fecha, $estado);

            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false]);
            }
            $stmt->close();
        }else{
            //busca grupos personalizados 
            // llega con buscarCursosUsuario
            $id_usuario= $dataObject->id_usuario;
            $llama = (int) $dataObject->llama; //1= superadmin, 2=admin, 3=director, 4 secretaria, 5=docente, 6=auxiliar, 7=alumno, 8=tutor
            $sql="";
            //si son roles peritidos doble control se controlo en el frontend pero se vuelve a controlar en el backend
            if($llama >= 1 && $llama <= 13){
                //busca los grupos personalizados en que participa el usuario
                $sqlGrupos="SELECT 
                            mg.id, 
                            mg.nombre_grupo, 
                            mg.descripcion, 
                            mg.creado_por, 
                            mg.imagen, 
                            u.usuario AS nombre_creador, 
                            mg.fecha_creacion,
                            (
                                SELECT COUNT(*)
                                FROM mensajes m
                                INNER JOIN mensajes_recibidos mr 
                                    ON mr.id_mensaje = m.id_mensaje
                                INNER JOIN usuarios us 
                                    ON us.usuario = mr.usuario
                                WHERE m.id_curso = -mg.id
                                    AND us.id = $id_usuario
                                    AND mr.estado = 0
                            ) AS mensajes_sin_leer

                        FROM mensajes_grupo_participantes AS mgp
                        JOIN mensajes_grupo_creado AS mg 
                            ON mgp.id_mensaje_grupo = mg.id
                        JOIN usuarios AS u 
                            ON mg.creado_por = u.id
                        WHERE mgp.id_usuario = $id_usuario";
                if($nueva_consulta = $conexion->prepare($sqlGrupos)) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows >= 1) {
                        //si son mas de un resultado envio un arreglo con los resultados
                        echo json_encode($resultado->fetch_all(MYSQLI_ASSOC)); 
                    }else {
                        //si no hay resultados envio un mensaje indicando que no se encontraron grupos
                        echo json_encode(["mensaje" => "No se encontraron grupos personalizados para este usuario."]);
                    }
                    $nueva_consulta->close();
                } else {
                    //si hay un error en la consulta envio un mensaje indicando el error
                    echo json_encode(["error" => "Error en la consulta: " . $conexion->error]);
                }
            }else{
                //si el rol no es permitido envio un mensaje indicando que no tiene permisos para acceder a este endpoint
                echo json_encode(["error" => "No tiene permisos para acceder a este endpoint. Rol:".$llama]);
            }
        }
        break;
    case 'PUT':

        if (isset($dataObject->modo) && $dataObject->modo === 'hacer_admin') {

            $id_grupo = intval($dataObject->id_grupo);
            $id_usuario = intval($dataObject->id_usuario);

            $sql = "UPDATE mensajes_grupo_participantes 
                    SET estado = 'administrador' 
                    WHERE id_mensaje_grupo = ABS(?) AND id_usuario = ?";

            $stmt = $conexion->prepare($sql);
            $stmt->bind_param("ii", $id_grupo, $id_usuario);

            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false]);
            }

            $stmt->close();
        }
    break;

    case 'DELETE':
        if (isset($dataObject->modo) && $dataObject->modo === 'quitar_participante') {

            $id_grupo = intval($dataObject->id_grupo);
            $id_usuario = intval($dataObject->id_usuario);

            $sql = "DELETE FROM mensajes_grupo_participantes 
                    WHERE id_mensaje_grupo = ABS(?) AND id_usuario = ?";

            $stmt = $conexion->prepare($sql);
            $stmt->bind_param("ii", $id_grupo, $id_usuario);

            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false]);
            }

            $stmt->close();
        }else{
        // si no es quitar participante elimina un grupo
            $id_grupo = intval($dataObject->id);
            $sql = "DELETE FROM mensajes_grupo_creado WHERE id = ?";
            $stmt = $conexion->prepare($sql);
            $stmt->bind_param("i", $id_grupo);

            if ($stmt->execute()) {
                //eliminar los participantes del grupo
                $sql_participantes_elimina="DELETE FROM mensajes_grupo_participantes WHERE id_mensaje_grupo=$id_grupo";
                $stmt_elimina_participantes = $conexion->prepare($sql_participantes_elimina);
                if ($stmt_elimina_participantes->execute()) {
                    //buscar y eliminar los mensajes de recibido y de enviado por id grupo en id_curso de mensaje
                    
                    //preparo respuesta de OK
                    $respuesta = ['success','grupo eliminado'];
                }else{
                    $respuesta = ['error','no se pudo eliminar participantes'];
                }   
            } else {
                $respuesta = ['error',' no se pudo eliminar el grupo'];
            }
            echo json_encode($respuesta);

        }

    break;
    default:
        echo json_encode(["mensaje" => "Método no permitido"]);
        break;
}

?>
