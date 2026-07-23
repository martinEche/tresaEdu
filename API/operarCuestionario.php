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
$data = json_decode($JSONData, true);//convierte el formato json a un formato php

switch($method){
    case 'GET':
       
        if(isset($_GET['form_id'])){ ///para selecionar un cuestionario particular
            $id_formulario = intval($_GET['form_id']);
            $rol = isset($_GET['rol']) ? intval($_GET['rol']) : 0;

            // Obtener la información del formulario
            $form_query = "SELECT id, titulo, descripcion FROM formulario WHERE id = ?";

            if ($stmt = $conexion->prepare($form_query)) {
                $stmt->bind_param("i", $id_formulario);
                $stmt->execute();
                $form_result = $stmt->get_result();
                if ($form_result->num_rows > 0) {
                    $form_data = $form_result->fetch_assoc();
        
                    // Obtener las preguntas del formulario
                    $preguntas_query = "SELECT id, pregunta_texto, pregunta_tipo FROM formulario_preguntas WHERE formulario_id = ?";
                    if ($stmt_preguntas = $conexion->prepare($preguntas_query)) {
                        $stmt_preguntas->bind_param("i", $id_formulario);
                        $stmt_preguntas->execute();
                        $preguntas_result = $stmt_preguntas->get_result();
                        $preguntas = [];
        
                        while ($pregunta = $preguntas_result->fetch_assoc()) {
                            // Obtener las opciones de la pregunta si es de tipo 'radio' o 'checkbox'
                            if ($pregunta['pregunta_tipo'] === 'radio' || $pregunta['pregunta_tipo'] === 'checkbox') {
                                $opciones_query = "SELECT id, opcion_texto, es_correcta FROM formulario_preguntas_opciones WHERE pregunta_id = ?";
                                if ($stmt_opciones = $conexion->prepare($opciones_query)) {
                                    $stmt_opciones->bind_param("i", $pregunta['id']);
                                    $stmt_opciones->execute();
                                    $opciones_result = $stmt_opciones->get_result();
                                    $opciones = [];
                                    while ($opcion = $opciones_result->fetch_assoc()) {
                                        $pregunta['opciones'][] = $opcion['opcion_texto'];
                                        if ($opcion['es_correcta']) {
                                            $pregunta['correctas'][] = $opcion['opcion_texto'];
                                        }
                                    }
                                }
                            } 
                            $preguntas[] = $pregunta;
                        }
                        $form_data['preguntas'] = $preguntas;
        
                        // Si se pasa user_id, buscar intentos previos
                        $id_usuario = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
                        if ($id_usuario > 0) {
                            $stats_query = "SELECT COUNT(id) as intentos, MAX(ratio_respuesta) as mejor_acierto FROM formulario_respuestas_usuario WHERE formulario_id=? AND usuario_id=?";
                            if ($stmt_s = $conexion->prepare($stats_query)) {
                                $stmt_s->bind_param("ii", $id_formulario, $id_usuario);
                                $stmt_s->execute();
                                $stats = $stmt_s->get_result()->fetch_assoc();
                                $form_data['intentos'] = $stats['intentos'];
                                $form_data['mejor_acierto'] = $stats['mejor_acierto'];
                            }
                        }

                        echo json_encode(["success" => true, "data" => $form_data]);
                    } else {
                        echo json_encode(["success" => false, "message" => "Error al preparar la consulta de preguntas".$preguntas_query]);
                    }
                } else {
                    echo json_encode(["success" => false, "message" => "Formulario no encontrado"]);
                }
            } else {
                echo json_encode(["success" => false, "message" => "Error al preparar la consulta del formulario"]);
            }
            $conexion->close();
        }
        elseif(isset($_GET['modo']) && $_GET['modo'] === 'listarResultadosGrupo' && isset($_GET['id_curso_grupo'])) {
            $id_curso_grupo = intval($_GET['id_curso_grupo']);
            
            // Traer cuestionarios asignados a este curso_grupo
            $sql = "SELECT f.id, f.titulo, f.descripcion AS desarrollo, f.creado_el AS fecha_creacion,
                           fc.id AS id_trabajo_clase, fc.id_clase, fc.id_usuario, fc.fecha_fijacion
                    FROM formulario f
                    INNER JOIN formulario_clase fc ON f.id = fc.id_formulario
                    INNER JOIN clase c ON fc.id_clase = c.id
                    WHERE c.id_curso_grupo = ?
                    ORDER BY f.id DESC";

            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id_curso_grupo);
                $stmt->execute();
                $cuestionarios_result = $stmt->get_result();
                $cuestionarios = $cuestionarios_result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();

                // Para cada cuestionario, obtener las respuestas agrupadas por usuario_id
                foreach ($cuestionarios as &$cuest) {
                    $cuest['es_cuestionario'] = true; // Para que Estudiantes.js lo identifique
                    $cuest['tipo_trabajo_clase'] = 'cuestionario'; // Para evitar errores si se lee
                    
                    $id_formulario = $cuest['id'];
                    $intentos_query = "SELECT usuario_id AS id_estudiante, COUNT(id) AS intentos, MAX(ratio_respuesta) AS mejor_acierto 
                                       FROM formulario_respuestas_usuario 
                                       WHERE formulario_id = ? 
                                       GROUP BY usuario_id";
                    if ($stmt_i = $conexion->prepare($intentos_query)) {
                        $stmt_i->bind_param("i", $id_formulario);
                        $stmt_i->execute();
                        $intentos_result = $stmt_i->get_result();
                        $entregas = [];
                        while ($row = $intentos_result->fetch_assoc()) {
                            // Simulamos el formato de entregas para compatibilidad
                            $row['estado'] = 'completado';
                            $row['es_cuestionario'] = true;
                            $entregas[] = $row;
                        }
                        $cuest['entregas'] = $entregas;
                        $stmt_i->close();
                    } else {
                        $cuest['entregas'] = [];
                    }
                }

                echo json_encode(['success'=>true, 'cuestionarios'=>$cuestionarios]);
            } else {
                echo json_encode(['success'=>false, 'error' => 'Error al preparar la consulta.']);
            }
        }
        elseif(isset($_GET['user_id'])){
            $id_usuario = intval($_GET['user_id']);
            $id_curso = intval($_GET['curso_id']);
            $rol=intval($_GET['rol']);
           // if($rol==6){ //docente propietarios del cuestionarios
            //    $sql="SELECT f.*, COUNT(ru.id) AS cantidad_respuestas FROM formulario f LEFT JOIN formulario_respuestas_usuario ru ON f.id = ru.formulario_id  WHERE curso_id='$id_curso' and creado_por='$id_usuario' GROUP BY f.id, f.titulo, f.descripcion, f.creado_el";
           // }
           // if($rol==7){ //estudiante
           //     $sql="SELECT f.*, COUNT(ru.id) AS cantidad_respuestas FROM formulario f LEFT JOIN formulario_respuestas_usuario ru ON f.id = ru.formulario_id  WHERE curso_id='$id_curso' GROUP BY f.id, f.titulo, f.descripcion, f.creado_el";
            //}
            
           $sql = "
            SELECT 
                f.*,  
                fc.id AS id_formulario_clase,
                fc.id_clase, 
                fc.id_usuario, 
                fc.fecha_fijacion,
                COUNT(fru.id) AS cantidad_respuestas,
                ROUND(AVG(fru.ratio_respuesta) * 100, 2) AS porcentaje_promedio_correctas
            FROM formulario f
            LEFT JOIN formulario_clase fc ON f.id = fc.id_formulario
            LEFT JOIN formulario_respuestas_usuario fru ON f.id = fru.formulario_id
            WHERE f.curso_id = ?
            ";

            // Filtro adicional si el rol es 7 u 8
            if ($rol === 7 || $rol === 8) {
                $sql .= " AND fc.id_clase IS NOT NULL";
            }

            $sql .= "
            GROUP BY f.id, fc.id, fc.id_clase, fc.id_usuario, fc.fecha_fijacion
            ORDER BY f.id DESC
            ";

            if ($nueva_consulta = $conexion->prepare($sql)) {
                $nueva_consulta->bind_param("i", $id_curso);
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows >= 1) {     
                    echo json_encode(['success'=>true,'data'=>$resultado->fetch_all(MYSQLI_ASSOC)]);          
                }else {
                    echo json_encode(['success'=>false, 'error' => 'No existen Resultados.'.$sql]);
                }
            }else{
                   echo json_encode(['success'=>false, 'error' => 'No se pudo realizar la query'.$sql."-".$id_curso]);
            }
            $conexion->close();
        }
        break;
    case 'POST':
        if(isset($data['modo'])){
            $modo = $data['modo'];

            if($modo == 'cuestionario') {

                $titulo = $data['titulo'];
                $descripcion = $data['descripcion'];
                $preguntas = $data['preguntas'];
                $curso_id = $data['curso_id'];
                $user_id = $data['user_id'];
                $error = '';
                if(isset($data['idCuestionario'])){ 
                    if($data['idCuestionario'] == 0){ //es nuevo cuestionario
                        $sql = "INSERT INTO formulario(titulo, descripcion, curso_id, creado_por) VALUES ('$titulo', '$descripcion','$curso_id', '$user_id')";
                        if ($nueva_consulta = $conexion->prepare($sql)) {
                            $nueva_consulta->execute();
                                            
                            $form_id = $conexion->insert_id;
                            foreach ($preguntas as $pregunta) {
                                $pregunta_texto = $pregunta['pregunta_texto'];
                                $pregunta_tipo = $pregunta['pregunta_tipo'];
                                $sql2 = "INSERT INTO formulario_preguntas(formulario_id, pregunta_texto, pregunta_tipo) VALUES ('$form_id', '$pregunta_texto', '$pregunta_tipo')";
                                if ($nueva_consulta2 = $conexion->prepare($sql2)) {
                                    $nueva_consulta2->execute();
                                    $pregunta_id = $conexion->insert_id;
                                    if (isset($pregunta['opciones'])) {
                                        foreach ($pregunta['opciones'] as $opcion) {
                                            $opcion_texto = $opcion;
                                            $es_correcta = in_array($opcion_texto, $pregunta['correctas']) ? 1 : 0;
                                            $sql3 = "INSERT INTO formulario_preguntas_opciones(pregunta_id, opcion_texto, es_correcta) VALUES  ('$pregunta_id', '$opcion_texto', '$es_correcta')";
                                            if ($nueva_consulta3 = $conexion->prepare($sql3)) {
                                                $nueva_consulta3->execute();
                                            } else {
                                               $error = $error . "-sql3: " . $sql3;
                                            }
                                        }
                                    }
                                } else {
                                    $error = $error . "-sql2: " . $sql2;
                                }
                            }
                            if ($error == '') {
                                echo json_encode(["success" => true, "form_id" => $form_id]);
                            } else {
                                echo json_encode(["success" => false, "message" => "Error: " . $error . "<br>" . $conexion->error]);
                            }
                        } else {
                            echo json_encode(["success" => false, "message" => "Error: " . $sql . "<br>" . $conexion->error]);
                        }                
                        $conexion->close();
                    }else{ // es editar un cuestionario
                        $form_id= $data['idCuestionario'];
                        $sql = "UPDATE formulario SET titulo='$titulo', descripcion='$descripcion' WHERE id=$form_id";
                        if ($nueva_consulta = $conexion->prepare($sql)) {
                            $nueva_consulta->execute();
                            //elimino todas las preguntas del formulario para volver a cargarlas
                            $sql_elimina="DELETE FROM formulario_preguntas WHERE formulario_id = $form_id";
                            if ($nueva_consultaE = $conexion->prepare($sql_elimina)) {
                                $nueva_consultaE->execute();                
                                
                                foreach ($preguntas as $pregunta) {
                                    $pregunta_texto = $pregunta['pregunta_texto'];
                                    $pregunta_tipo = $pregunta['pregunta_tipo'];                             
                                    //chequeo si la pregunta tiene id o es una nueva
                                    if(isset($pregunta['id'])){
                                        $pregunta_id=$pregunta['id'];
                                        $sql2 = "INSERT INTO formulario_preguntas(id, formulario_id, pregunta_texto, pregunta_tipo) VALUES ('$pregunta_id','$form_id', '$pregunta_texto', '$pregunta_tipo')";
                                    }else{
                                        $sql2 = "INSERT INTO formulario_preguntas(formulario_id, pregunta_texto, pregunta_tipo) VALUES ('$form_id', '$pregunta_texto', '$pregunta_tipo')";
                                    }
                                    if ($nueva_consulta2 = $conexion->prepare($sql2)) {
                                        $nueva_consulta2->execute();
                                        if(!isset($pregunta['id'])){ //si es pregunta nueva obtengo el id
                                            $pregunta_id = $conexion->insert_id;
                                        }
                                        if (isset($pregunta['opciones'])) {
                                            foreach ($pregunta['opciones'] as $opcion) {
                                                $opcion_texto = $opcion;
                                                $es_correcta = in_array($opcion_texto, $pregunta['correctas']) ? 1 : 0;
                                                $sql3 = "INSERT INTO formulario_preguntas_opciones(pregunta_id, opcion_texto, es_correcta) VALUES  ('$pregunta_id', '$opcion_texto', '$es_correcta')";
                                                if ($nueva_consulta3 = $conexion->prepare($sql3)) {
                                                    $nueva_consulta3->execute();
                                                } else {
                                                   $error = $error . "-sql3: " . $sql3;
                                                }
                                            }
                                        }
                                    } else {
                                        $error = $error . "-sql2: " . $sql2;
                                    }
                                }    
                                        
                            }else{
                                //error en la eliminacion
                            }
                            if ($error == '') {
                                echo json_encode(["success" => true, "form_id" => $form_id]);
                            } else {
                                echo json_encode(["success" => false, "message" => "Error: " . $error . "<br>" . $conexion->error]);
                            }
                        } else {
                            echo json_encode(["success" => false, "message" => "Error: " . $sql . "<br>" . $conexion->error]);
                        }                
                        $conexion->close();
                    }
                }
            }
            
        }
        if(isset($data['formulario_id'])){
           
            $formulario_id = intval($data['formulario_id']);
            $respuestas = $data['respuestas'];
            $usuario_id = isset($data['usuario_id']) ? intval($data['usuario_id']) : 1;

            // Insertar en formulario_respuestas_usuario
            $conexion->query("INSERT INTO formulario_respuestas_usuario (formulario_id, usuario_id) VALUES ($formulario_id, $usuario_id)");
            $respuesta_usuario_id = $conexion->insert_id;

            foreach ($respuestas as $respuesta) {
                $pregunta_id = intval($respuesta['pregunta_id']);
                $respuesta_texto = $conexion->real_escape_string($respuesta['respuesta_texto']);

                // Guardar respuesta del usuario
                $conexion->query("INSERT INTO formulario_respuestas (respuesta_usuario_id, pregunta_id, respuesta_text) VALUES ($respuesta_usuario_id, $pregunta_id, '$respuesta_texto')");
            }

            // Evaluar respuestas
            $correctas = 0;
            foreach ($respuestas as $respuesta) {
                $pregunta_id = intval($respuesta['pregunta_id']);
                $respuesta_texto = $respuesta['respuesta_texto'];

                // Verificar si la respuesta es correcta
                $result = $conexion->query("SELECT COUNT(*) as es_correcta FROM formulario_preguntas_opciones WHERE pregunta_id = $pregunta_id AND opcion_texto = '$respuesta_texto' AND es_correcta = 1");
                $row = $result->fetch_assoc();
                if ($row['es_correcta'] > 0) {
                    $correctas++;
                }
            }
           
            $total_preguntas = count($respuestas);
            $porcentaje_correctas = $total_preguntas > 0 ? $correctas / $total_preguntas : 0;

            // Completar el ratio de respuesta del formulario
            $conexion->query("UPDATE formulario_respuestas_usuario SET ratio_respuesta='$porcentaje_correctas' WHERE id=".$respuesta_usuario_id);

            // Obtener histórico de este usuario
            $res_stats = $conexion->query("SELECT COUNT(id) as intentos, MAX(ratio_respuesta) as mejor_acierto FROM formulario_respuestas_usuario WHERE formulario_id=$formulario_id AND usuario_id=$usuario_id");
            $stats = $res_stats->fetch_assoc();

            $resultado = [
                'total' => $total_preguntas,
                'correctas' => $correctas,
                'incorrectas' => $total_preguntas - $correctas,
                'porcentaje_actual' => $porcentaje_correctas,
                'intentos' => $stats['intentos'],
                'mejor_acierto' => $stats['mejor_acierto']
            ];
           
            echo json_encode(['resultado' => $resultado]);
        }    
        break;
    case 'PUT':
        break;
    case 'DELETE':
        if(isset($data['modo']) && $data['modo'] === 'eliminarCuestionario' && isset($data['idCuestionario'])) {
            $formId = intval($data['idCuestionario']);
            $sql = "DELETE FROM formulario WHERE id = $formId";
            if ($conexion->query($sql) === TRUE) {
                //eliminar preguntas y opciones relacionadas
                $conexion->query("DELETE FROM formulario_preguntas WHERE formulario_id = $formId");
                $conexion->query("DELETE FROM formulario_preguntas_opciones WHERE pregunta_id NOT IN (SELECT id FROM formulario_preguntas)");
                
                echo json_encode(["success" => true, "message" => "Cuestionario eliminado correctamente"]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al eliminar cuestionario"]);
            }
        }   
        break;
}
?>
