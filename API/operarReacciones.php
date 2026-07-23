<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input");
$dataObject = json_decode($JSONData);

if ($method == "OPTIONS") {
    http_response_code(200);
    exit();
}

switch($method){

    /*
    ==========================================
    OBTENER REACCIONES DE UN MENSAJE
    ==========================================
    Ejemplo de llamada:
    GET:
    operarReacciones.php?id_mensaje=10
    */
    case 'GET':
        if(!isset($_GET['id_mensaje'])){
            echo json_encode([
                "error" => true,
                "mensaje" => "Falta id_mensaje"
            ]);
            exit;
        }

        $id_mensaje = intval($_GET['id_mensaje']);

        // Totales
        $sqlTotales="SELECT 
                        tipo_reaccion,
                        COUNT(*) as total
                    FROM mensajes_reacciones
                    WHERE id_mensaje = $id_mensaje
                    GROUP BY tipo_reaccion
        ";

        $resultadoTotales = mysqli_query($conexion, $sqlTotales);

        $totales = [
            "like" => 0,
            "dislike" => 0
        ];

        while($fila = mysqli_fetch_assoc($resultadoTotales)){
            $totales[$fila['tipo_reaccion']] = intval($fila['total']);
        }

        // Detalle usuarios
        $sqlDetalle="SELECT 
                        mr.id,
                        mr.id_mensaje,
                        mr.id_usuario,
                        mr.tipo_reaccion,
                        mr.fecha_reaccion,
                        u.nombre,
                        u.apellido
                    FROM mensajes_reacciones mr
                    INNER JOIN usuarios u 
                        ON mr.id_usuario = u.id
                    WHERE mr.id_mensaje = $id_mensaje
                    ORDER BY mr.fecha_reaccion ASC
                ";

        $resultadoDetalle = mysqli_query($conexion, $sqlDetalle);
        $reacciones = [];
        while($fila = mysqli_fetch_assoc($resultadoDetalle)){
            $reacciones[] = $fila;
        }
        echo json_encode([
            "error" => false,
            "totales" => $totales,
            "reacciones" => $reacciones
        ]);

        break;
    /*
    ==========================================
    AGREGAR / ACTUALIZAR REACCIÓN
    ==========================================
    BODY:
    {
        "id_mensaje":1,
        "id_usuario":5,
        "tipo_reaccion":"like"
    }
    */
    case 'POST':
        if(
            !isset($dataObject->id_mensaje) ||
            !isset($dataObject->id_usuario) ||
            !isset($dataObject->tipo_reaccion)
        ){
            echo json_encode([
                "error" => true,
                "mensaje" => "Datos incompletos"
            ]);
            exit;
        }

        $id_mensaje = intval($dataObject->id_mensaje);
        $id_usuario = intval($dataObject->id_usuario);
        $tipo_reaccion = mysqli_real_escape_string($conexion, $dataObject->tipo_reaccion);

        // Validar reacción
        if($tipo_reaccion != 'like' && $tipo_reaccion != 'dislike'){
            echo json_encode([
                "error" => true,
                "mensaje" => "Tipo de reacción inválido"
            ]);
            exit;
        }

        // Verificar si ya reaccionó
        $sqlExiste = "SELECT 
                        id, 
                        tipo_reaccion
                    FROM mensajes_reacciones
                    WHERE id_mensaje = $id_mensaje
                    AND id_usuario = $id_usuario
                    LIMIT 1
                ";
        $resultadoExiste = mysqli_query($conexion, $sqlExiste);

        if(mysqli_num_rows($resultadoExiste) > 0){
            $filaExiste = mysqli_fetch_assoc($resultadoExiste);
            // Si toca la misma reacción => eliminar reacción
            if($filaExiste['tipo_reaccion'] == $tipo_reaccion){
                $sqlDelete = "DELETE FROM mensajes_reacciones WHERE id = ".$filaExiste['id'];
                mysqli_query($conexion, $sqlDelete);

                echo json_encode([
                    "error" => false,
                    "accion" => "eliminada"
                ]);
            }else{

                // Cambiar reacción
                $sqlUpdate = "UPDATE mensajes_reacciones
                                SET 
                                    tipo_reaccion = '$tipo_reaccion',
                                    fecha_reaccion = NOW()
                                WHERE id = ".$filaExiste['id'];

                mysqli_query($conexion, $sqlUpdate);
                echo json_encode([
                    "error" => false,
                    "accion" => "actualizada"
                ]);
            }
        }else{
            // Insertar nueva reacción
            $sqlInsert = "INSERT INTO mensajes_reacciones
                            (
                                id_mensaje,
                                id_usuario,
                                tipo_reaccion,
                                fecha_reaccion
                            )
                            VALUES
                            (
                                $id_mensaje,
                                $id_usuario,
                                '$tipo_reaccion',
                                NOW()
                            )
                        ";

            mysqli_query($conexion, $sqlInsert);

            echo json_encode([
                "error" => false,
                "accion" => "insertada"
            ]);
        }

        break;

    /*
    ==========================================
    ELIMINAR REACCIÓN
    ==========================================
    BODY:
    {
        "id_mensaje":1,
        "id_usuario":5
    }
    */
    case 'DELETE':
        if(
            !isset($dataObject->id_mensaje) ||
            !isset($dataObject->id_usuario)
        ){
            echo json_encode([
                "error" => true,
                "mensaje" => "Datos incompletos"
            ]);
            exit;
        }

        $id_mensaje = intval($dataObject->id_mensaje);
        $id_usuario = intval($dataObject->id_usuario);

        $sqlDelete = "DELETE FROM mensajes_reacciones WHERE id_mensaje = $id_mensaje AND id_usuario = $id_usuario";

        mysqli_query($conexion, $sqlDelete);

        echo json_encode([
            "error" => false,
            "mensaje" => "Reacción eliminada"
        ]);

        break;

    case 'PUT':
        echo json_encode([
            "error" => true,
            "mensaje" => "Método no permitido"
        ]);
        break;

    default:
        echo json_encode([
            "error" => true,
            "mensaje" => "Método no permitido"
        ]);
        break;
}

mysqli_close($conexion);
?>
