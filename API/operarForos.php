<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

header('Content-Type: application/json');

require 'conectar.php';

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();

if ($conexion === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al conectar a la base de datos']);
    exit;
}

// Manejo de solicitudes OPTIONS (preflight)

$method = $_SERVER['REQUEST_METHOD'];
$conexion->set_charset('utf8mb4');

//$dataObject = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if(isset($_GET['id_clase'])){
            $id_clase = intval($_GET['id_clase']);
            //$sqlTemas = "SELECT ft.id, ft.id_curso_grupo, ft.id_usuario, ft.tema, ft.contenido, ft.id_foro_archivo, ft.fecha_creacion_tema, ft.fecha_actualizacion_tema, ft.f_cerrado, COUNT(fr.id) AS num_respuestas FROM foro_tema ft LEFT JOIN foro_respuestas fr ON ft.id = fr.id_foro_tema where ft.id_curso_grupo= ? GROUP BY ft.id, ft.id_curso_grupo, ft.id_usuario, ft.tema, ft.contenido, ft.id_foro_archivo, ft.fecha_creacion_tema, ft.fecha_actualizacion_tema, ft.f_cerrado ORDER BY ft.fecha_creacion_tema DESC";
            //$sqlTemas = "SELECT ft.id, ft.id_curso_grupo, ft.id_usuario, ft.tema, ft.contenido, ft.id_foro_archivo, ft.fecha_creacion_tema, ft.fecha_actualizacion_tema, ft.f_cerrado, COUNT(fr.id) AS num_respuestas, fr_ultima.contenido AS ultima_respuesta, fr_ultima.fecha_creacion AS fecha_ultima_respuesta FROM foro_tema ft LEFT JOIN foro_respuestas fr ON ft.id = fr.id_foro_tema LEFT JOIN ( SELECT id_foro_tema, contenido, fecha_creacion FROM foro_respuestas WHERE (id_foro_tema, fecha_creacion) IN (SELECT id_foro_tema, MAX(fecha_creacion) FROM foro_respuestas GROUP BY id_foro_tema)) AS fr_ultima ON ft.id = fr_ultima.id_foro_tema WHERE ft.id_curso_grupo= ? GROUP BY ft.id, ft.id_curso_grupo, ft.id_usuario, ft.tema, ft.contenido, ft.id_foro_archivo, ft.fecha_creacion_tema, ft.fecha_actualizacion_tema, ft.f_cerrado, fr_ultima.contenido, fr_ultima.fecha_creacion ORDER BY ft.fecha_creacion_tema DESC";
            //if ($stmtTemas = $conexion->prepare($sqlTemas)) {
            //    $stmtTemas->bind_param("i", $id_curso_grupo);
            //    $stmtTemas->execute();
            //    $resultadoTemas = $stmtTemas->get_result();
            //    if ($resultadoTemas->num_rows > 0) {
            //        $temas = $resultadoTemas->fetch_all(MYSQLI_ASSOC);
            //        echo json_encode($temas);
            //    } else {
            //        echo json_encode(['error' => 'No se encontraron temas']);
            //    }
            //} else {
            //    echo json_encode(['error' => 'No se pudo realizar la query del tema']);
            //}
            $sqlTemas ="SELECT
                        ft.id AS tema_id,
                        ft.id_clase,
                        ft.id_usuario,
                        ft.tema,
                        ft.contenido,
                        ft.id_foro_archivo,
                        ft.fecha_creacion_tema,
                        ft.fecha_actualizacion_tema,
                        ft.f_cerrado,
                        COUNT(fr.id) AS num_respuestas,
                        fr_ultima.contenido AS ultima_respuesta,
                        fr_ultima.fecha_creacion AS fecha_ultima_respuesta,
                        fa.id AS archivo_id,
                        fa.file_path AS archivo_path,
                        fa.fecha_subido AS archivo_fecha_subido,
                        fa.extension AS archivo_extension
                        FROM foro_tema ft
                        LEFT JOIN foro_respuestas fr ON ft.id = fr.id_foro_tema
                        LEFT JOIN (
                        SELECT
                            id_foro_tema,
                            contenido,
                            fecha_creacion
                        FROM foro_respuestas
                        WHERE (id_foro_tema, fecha_creacion) IN (
                            SELECT
                                id_foro_tema,
                                MAX(fecha_creacion) AS max_fecha
                            FROM foro_respuestas
                            GROUP BY id_foro_tema
                        )
                        ) AS fr_ultima ON ft.id = fr_ultima.id_foro_tema
                        LEFT JOIN foro_archivos fa ON ft.id = fa.id_foro_tema AND (fa.id_foro_respuesta = 0 OR fa.id_foro_respuesta IS NULL)
                        WHERE ft.id_clase = ?
                        GROUP BY
                        ft.id,
                        ft.id_clase,
                        ft.id_usuario,
                        ft.tema,
                        ft.contenido,
                        ft.id_foro_archivo,
                        ft.fecha_creacion_tema,
                        ft.fecha_actualizacion_tema,
                        ft.f_cerrado,
                        fr_ultima.contenido,
                        fr_ultima.fecha_creacion,
                        fa.id
                        ORDER BY ft.fecha_creacion_tema DESC";

            if ($stmtTemas = $conexion->prepare($sqlTemas)) {
                $stmtTemas->bind_param("i", $id_clase);
                $stmtTemas->execute();
                $resultadoTemas = $stmtTemas->get_result();

                if ($resultadoTemas->num_rows > 0) {
                    $temas = [];
                    $temasMap = [];

                    while ($fila = $resultadoTemas->fetch_assoc()) {
                        $tema_id = $fila['tema_id'];

                        if (!isset($temasMap[$tema_id])) {
                            $temasMap[$tema_id] = [
                                'id' => $tema_id,
                                'id_clase' => $fila['id_clase'],
                                'id_usuario' => $fila['id_usuario'],
                                'tema' => $fila['tema'],
                                'contenido' => $fila['contenido'],
                                'id_foro_archivo' => $fila['id_foro_archivo'],
                                'fecha_creacion_tema' => $fila['fecha_creacion_tema'],
                                'fecha_actualizacion_tema' => $fila['fecha_actualizacion_tema'],
                                'f_cerrado' => $fila['f_cerrado'],
                                'num_respuestas' => $fila['num_respuestas'],
                                'ultima_respuesta' => $fila['ultima_respuesta'],
                                'fecha_ultima_respuesta' => $fila['fecha_ultima_respuesta'],
                                'archivos' => []
                            ];
                        }

                        if ($fila['archivo_id']) {
                            $temasMap[$tema_id]['archivos'][] = [
                                'id' => $fila['archivo_id'],
                                'file_path' => $fila['archivo_path'],
                                'fecha_subido' => $fila['archivo_fecha_subido'],
                                'extension' => $fila['archivo_extension']
                            ];
                        }
                    }

                    foreach ($temasMap as $tema) {
                        $temas[] = $tema;
                    }

                    echo json_encode($temas);
                } else {
                    echo json_encode(['error' => 'No se encontraron temas']);
                }
            } else {
                echo json_encode(['error' => 'No se pudo realizar la query del tema']);
            }
        }

        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $sqlTema = "SELECT * FROM foro_tema WHERE id = ?";
            $sqlRespuestas = "SELECT * FROM RespuestasRecursivas WHERE id_foro_tema = ? order by  id_respuesta_padre DESC";

            if ($stmtTema = $conexion->prepare($sqlTema)) {
                $stmtTema->bind_param("i", $id);
                $stmtTema->execute();
                $resultadoTema = $stmtTema->get_result();
                if ($resultadoTema->num_rows == 1) {
                    $tema = $resultadoTema->fetch_assoc();
                    
                    if ($stmtRespuestas = $conexion->prepare($sqlRespuestas)) {
                        $stmtRespuestas->bind_param("i", $id);
                        $stmtRespuestas->execute();
                        $resultadoRespuestas = $stmtRespuestas->get_result();
                        $respuestas = $resultadoRespuestas->fetch_all(MYSQLI_ASSOC);
                        
                        // Anidar respuestas
                        $respuestasAnidadas = anidarRespuestas($respuestas);
                        //$respuestasAnidadas = $respuestas;
                        $tema['respuestas'] = $respuestasAnidadas;

                        echo json_encode($tema);
                    } else {
                        echo json_encode(['error' => 'No se pudo realizar la query de respuestas']);
                    }
                } else {
                    echo json_encode(['error' => 'No se encontró el tema']);
                }
            } else {
                echo json_encode(['error' => 'No se pudo realizar la query del tema']);
            }
        }

        if (isset($_GET['temaId']) && isset($_GET['respuestaId'])) {
            $id_foro_tema = intval($_GET['temaId']);
            $id_foro_respuesta = intval($_GET['respuestaId']);

            $sqlArchivos = "SELECT * FROM foro_archivos WHERE id_foro_tema = ? AND id_foro_respuesta = ?";
            if ($stmtArchivos = $conexion->prepare($sqlArchivos)) {
                $stmtArchivos->bind_param("ii", $id_foro_tema, $id_foro_respuesta);
                $stmtArchivos->execute();
                $resultado = $stmtArchivos->get_result();
                $respuestas = $resultado->fetch_all(MYSQLI_ASSOC);
                echo json_encode($respuestas);
            } else {
                echo json_encode(['error' => 'No se pudo realizar la query del tema']);
            }
        }
        break;

    case 'POST':
        //crear tema
        if (isset($_POST['id_clase']) &&
            isset($_POST['id_usuario']) &&
            isset($_POST['tema']) &&
            isset($_POST['id_tema_editar']) &&
            isset($_POST['contenido'])) {
            
            if($_POST['id_tema_editar']==0){ //nuevo
                //es nuevo
                $id_clase = $_POST['id_clase'];
                $id_usuario = $_POST['id_usuario'];
                $tema = $_POST['tema'];
                $contenido = $_POST['contenido'];
                $fechaHora = date('Y-m-d H:i:s');
                
                // Insertar en foro_tema
                $sql = "INSERT INTO foro_tema (id_clase, id_usuario, tema, contenido, fecha_creacion_tema, fecha_actualizacion_tema, f_cerrado) 
                        VALUES ('$id_clase', '$id_usuario', '$tema', '$contenido', '$fechaHora', '$fechaHora', '')";
                if (mysqli_query($conexion, $sql)) {
                    $id_foro_tema = $conexion->insert_id;

                    // Manejo de archivos
                    if (!empty($_FILES['archivos']['name'][0])) {
                        $carpeta = 'foroArchivos';
                        //Validamos si la ruta de destino existe, en caso de no existir la creamos
                        if(!file_exists($carpeta)){
                            mkdir($carpeta, 0777) or die("No se puede crear la carpeta de extracci&oacute;n");    
                        }
                        $dir=opendir($carpeta); //Abrimos el directorio de destino

                        $archivos = $_FILES['archivos'];
                        for ($i = 0; $i < count($archivos['name']); $i++) {
                            $nombreArchivo = $archivos['name'][$i];
                            $archivoTmp = $archivos['tmp_name'][$i];
                            $extension = pathinfo($nombreArchivo, PATHINFO_EXTENSION);
                            $rutaArchivo = $carpeta .'/'. uniqid() . '.' . $extension;

                            if (move_uploaded_file($archivoTmp, $rutaArchivo)) {
                                $sqlArchivo = "INSERT INTO foro_archivos (id_foro_tema, id_foro_respuesta, file_path, fecha_subido, extension) VALUES ('$id_foro_tema', '0', '$rutaArchivo', '$fechaHora', '$extension')";
                                mysqli_query($conexion, $sqlArchivo);
                            }
                        }
                    }
                    $respuesta = ['success',  'Tema creado con éxito'];
                    //echo json_encode(['success' => 'Tema creado con éxito']);
                } else {
                    $respuesta = ['error',  'No se pudo crear el tema'];
                    //echo json_encode(['error' => 'No se pudo crear el tema']);
                }
            }else{
                //editar el tema
                $id_tema = $_POST['id_tema_editar'];
                $id_clase = $_POST['id_clase'];
                $id_usuario = $_POST['id_usuario'];
                $tema = $_POST['tema'];
                $contenido = $_POST['contenido'];
                $fechaHora = date('Y-m-d H:i:s');
           
                // Actualizar en foro_tema
                $sql = "UPDATE foro_tema SET id_usuario='$id_usuario', tema='$tema', contenido='$contenido', fecha_actualizacion_tema='$fechaHora' WHERE id=?";
                if ($stmt = $conexion->prepare($sql)) {
                    $stmt->bind_param("i", $id_tema);
                    if ($stmt->execute()) {
                        // Manejo de archivos
                        if (!empty($_FILES['archivos']['name'][0])) {
                            $carpeta = 'foroArchivos';
                            if (!file_exists($carpeta)) {
                                mkdir($carpeta, 0777) or die("No se puede crear la carpeta de extracción");
                            }
                            $dir = opendir($carpeta);

                            $archivos = $_FILES['archivos'];
                            for ($i = 0; $i < count($archivos['name']); $i++) {
                                $nombreArchivo = $archivos['name'][$i];
                                $archivoTmp = $archivos['tmp_name'][$i];
                                $extension = pathinfo($nombreArchivo, PATHINFO_EXTENSION);
                                $rutaArchivo = $carpeta . '/' . uniqid() . '.' . $extension;

                                if (move_uploaded_file($archivoTmp, $rutaArchivo)) {
                                    $sqlArchivo = "INSERT INTO foro_archivos (id_foro_tema, id_foro_respuesta, file_path, fecha_subido, extension) VALUES ('$id_tema', '0', '$rutaArchivo', '$fechaHora', '$extension')";
                                    mysqli_query($conexion, $sqlArchivo);
                                }
                            }
                        }
                        $respuesta = ['success', 'Tema editado con éxito'];
                    } else {
                        $respuesta = ['error', 'No se pudo editar el tema'];
                    }
                    $stmt->close();
                } else {
                    $respuesta = ['error', 'No se pudo preparar la consulta'];
                }
            }
        } 
    
        //insertar respuesta

        if (isset($_POST['respuesta']) &&
            isset($_POST['id_tema']) &&
            isset($_POST['id_usuario']) &&
            isset($_POST['contenido'])) {

            $id_tema= $_POST['id_tema'];
            $id_usuario = $_POST['id_usuario'];
            $contenido = $_POST['contenido'];
            $fechaHora = date('Y-m-d H:i:s');

            $id_respuesta_padre = isset($_POST['id_respuesta']) ? $_POST['id_respuesta'] : null;

            // Insertar en foro_respuestas
            $sql = "INSERT INTO foro_respuestas (id_foro_tema, id_usuario, contenido, fecha_creacion, id_respuesta_padre)
                    VALUES ('$id_tema','$id_usuario','$contenido','$fechaHora', ?)";
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id_respuesta_padre);
                if ($stmt->execute()) {
                    $id_foro_respuesta = $stmt->insert_id;

                    // Manejo de archivos
                    if (!empty($_FILES['archivos']['name'][0])) {
                        $carpeta = 'foroArchivos';
                        //Validamos si la ruta de destino existe, en caso de no existir la creamos
                        if(!file_exists($carpeta)){
                            mkdir($carpeta, 0777) or die("No se puede crear la carpeta de extracci&oacute;n");    
                        }
                        $dir=opendir($carpeta); //Abrimos el directorio de destino

                        $archivos = $_FILES['archivos'];
                        for ($i = 0; $i < count($archivos['name']); $i++) {
                            $nombreArchivo = $archivos['name'][$i];
                            $archivoTmp = $archivos['tmp_name'][$i];
                            $extension = pathinfo($nombreArchivo, PATHINFO_EXTENSION);
                            $rutaArchivo = $carpeta .'/'. uniqid() . '.' . $extension;

                            if (move_uploaded_file($archivoTmp, $rutaArchivo)) {
                                $sqlArchivo = "INSERT INTO foro_archivos (id_foro_tema, id_foro_respuesta, file_path, fecha_subido, extension) VALUES ('$id_tema', '$id_foro_respuesta', '$rutaArchivo', '$fechaHora', '$extension')";
                                mysqli_query($conexion, $sqlArchivo);
                            }
                        }
                    }
                    $respuesta = ['success',  'Respuesta creado con éxito'];
                } else {
                    $respuesta = ['error',  'No se pudo crear la respuesta al tema sql:'.$sql.'id_res´ponded:'. $id_respuesta_padre];
                }
                $stmt -> close();
            }else{
                $respuesta = ['error', 'Error en la preparación de la consulta'];
            }
        }
        echo json_encode($respuesta);
        break;

    case 'PUT':
        //editar tema
        // Leer el cuerpo de la solicitud
        $dataObject = [];
        parse_str(file_get_contents('php://input'), $dataObject);

        // Depuración
        file_put_contents('php://stderr', print_r($dataObject, true));

       $respuesta = ['error', 'No se pudo editar el tema, faltan datos'];

       if (isset($dataObject['id_clase']) &&
           isset($dataObject['id_usuario']) &&
           isset($dataObject['tema']) &&
           isset($dataObject['id_tema_editar']) &&
           isset($dataObject['contenido'])) {
           
        }
       break;

    case 'DELETE':
        $accion = isset($_GET['accion']) ? $_GET['accion'] : '';
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $respuesta= ['error', 'acción no válida'];
        
        if ($accion === 'eliminarTema' && $id > 0) {
            // elimina todas las respuestas al tema para  no dejar inconsistencia en la base de datos
            $sql = "DELETE FROM foro_respuestas WHERE id_foro_tema = ?";
        //*****FALTAAAAAAA eliminar los archivos y la mension en la tabla archivos
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id);
                $success = $stmt->execute();
                if ($success) {
                    $sql2 = "DELETE FROM foro_tema WHERE id = ?";
                    if ($stmt2 = $conexion->prepare($sql2)) {
                        $stmt2->bind_param("i", $id);
                        $success = $stmt2->execute();
                        if ($success) {
                            $respuesta=['success', 'Operación completada con éxito'];
                        }else{
                            $respuesta=['error', 'Error se eliminaron las respuestas pero no el tema'];        
                        }
                    }else{
                        $respuesta= ['error', 'Error al preparar la consulta'];
                    }
                    $stmt2->close();
                } else {
                    $respuesta= ['error', 'Error no se eliminaron las respuestas'];
                }
            } else {
                $respuesta= ['error', 'Error al preparar la consulta'];
            }
            $stmt->close();
        } 
        if ($accion === 'eliminarRespuesta' && $id > 0) {
            //query para eliminar todas las respuestas de la respuesta
            $sql = "DELETE FROM foro_respuestas WHERE id_respuesta_padre = ?";
    //*****FALTAAAAAAA eliminar los archivos y la mension en la tabla archivos
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id);
                $success = $stmt->execute();
                if ($success) {
                    //query para eliminar la respuesta
                    $sql2 = "DELETE FROM foro_respuestas WHERE id = ?";
                    if ($stmt2 = $conexion->prepare($sql2)) {
                        $stmt2->bind_param("i", $id);
                        $success2 = $stmt2->execute();
                        if ($success2) {
                            $respuesta= ['success', 'Operación completada con éxito'];
                        } else {
                            $respuesta= ['error', 'Error al ejecutar la consulta'];
                        }
                    } else {
                        $respuesta= ['error', 'Error al preparar la consulta'];
                    }
                    $stmt2->close();
                } else {
                    $respuesta= ['error', 'Error al ejecutar la consulta'];
                }
            } else {
                $respuesta= ['error', 'Error al preparar la consulta'];
            }
            $stmt->close();
        } 
        $conexion->close();
        echo json_encode($respuesta);
    break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' , 'Método no permitido']);
        break;
}

//funcion para manejar la vista de respuestas anidadas
function anidarRespuestas($respuestas) {
    $respuestaMap = [];
    
    // Primera iteración: construir el mapa de respuestas
    foreach ($respuestas as $respuesta) {
        $respuesta['subrespuestas'] = [];
        $respuestaMap[$respuesta['id']] = $respuesta;
    }

    $respuestasAnidadas = [];
    
    // Segunda iteración: anidar las subrespuestas
    foreach ($respuestas as $respuesta) {
        if ($respuesta['id_respuesta_padre'] != 0) {
            // Añadir subrespuesta a la respuesta padre correspondiente
            $respuestaMap[$respuesta['id_respuesta_padre']]['subrespuestas'][] = $respuestaMap[$respuesta['id']];
        } else {
            // Añadir respuesta principal al array de respuestas anidadas
            $respuestasAnidadas[] = $respuestaMap[$respuesta['id']];
        }
    }
    
    return $respuestasAnidadas;
}
?>
