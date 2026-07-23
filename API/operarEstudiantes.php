<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint (obliga a tener token)

// Capa de Autorización (Permisos por Rol)
// Acá lo dejo como ejemplo verderamente no conozco su lógica de negocio de sí el ID puede o no puede modificar
// pero sirve de idea para gestionar que puede hacer un rol y que no puede.
/*
EJEMPLO: 
    if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
        if ($tokenData->rol != 1 && $tokenData->rol != 2) {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado. Solo los administradores pueden crear, modificar o borrar estudiantes.']);
            exit;
        }
    }
*/

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;

switch($method){
    case 'GET':
        $cohorte=$_GET['cohorte'];
        $curso_grupo=explode('-', $_GET['curso_grupo']) ?? null;
        $orden_curso= $curso_grupo[0] ?? null;
        $seccion_curso= $curso_grupo[1] ?? null;
         // consulta para  los cursos
            $sql_cursos="SELECT cg.id, cg.id_curso, e.orden, cg.seccion, cg.denominacion, e.nombre_espacio 
                        FROM curso_grupo cg 
                        JOIN curso c ON cg.id_curso = c.id 
                        JOIN espacio e ON c.espacio = e.id 
                        WHERE c.id_cohorte IN (SELECT id FROM cohorte WHERE cohorte.id = $cohorte)
                        ORDER BY e.orden, cg.seccion";
            if($nueva_consulta_cursos= $conexion->prepare($sql_cursos)) {
                $nueva_consulta_cursos->execute();
                $resultado_cursos = $nueva_consulta_cursos->get_result();
                if ($resultado_cursos->num_rows >= 1) {
                    $cursos = $resultado_cursos->fetch_all(MYSQLI_ASSOC);
                }else {
                    $cursos = [];
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query de espacios'));
                exit;
            }
            // consulta para los estudiantes de un curso y grupo específico
            if($orden_curso && $seccion_curso) {
              /*  $sql_estudiantes="SELECT DISTINCT u.id, u.apellido, u.nombre, u.documento, u.apodo, e.orden, cg.seccion, co.año 
                                FROM usuarios u
                                JOIN curso_estudiante ce ON u.id = ce.id_usuario
                                JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id
                                JOIN curso c ON cg.id_curso = c.id
                                JOIN cohorte co ON c.id_cohorte = co.id
                                JOIN espacio e ON c.espacio = e.id
                                WHERE e.orden = ? AND cg.seccion = ? AND co.id = ?";
                */
                //primero obtener el id de la proxima cohorte 
                $cohorteDestino=$_GET['cohorteDestino'] ?? null;               
                $sql_estudiantes="SELECT DISTINCT 
                    u.id,
                    u.apellido,
                    u.nombre,
                    u.documento,
                    u.apodo,
                    e.orden,
                    cg.seccion,
                    co.año
                FROM usuarios u
                JOIN curso_estudiante ce 
                    ON u.id = ce.id_usuario
                JOIN curso_grupo cg 
                    ON ce.id_curso_grupo = cg.id
                JOIN curso c 
                    ON cg.id_curso = c.id
                JOIN cohorte co 
                    ON c.id_cohorte = co.id
                JOIN espacio e 
                    ON c.espacio = e.id
                WHERE e.orden = ?
                AND cg.seccion = ?
                AND co.id = ?
                AND NOT EXISTS (
                    SELECT 1
                    FROM curso_estudiante ce2
                    JOIN curso_grupo cg2 ON ce2.id_curso_grupo = cg2.id
                    JOIN curso c2 ON cg2.id_curso = c2.id
                    WHERE ce2.id_usuario = u.id
                    AND c2.id_cohorte = ?
                )";                
                if($nueva_consulta_estudiantes= $conexion->prepare($sql_estudiantes)) {
                    $nueva_consulta_estudiantes->bind_param('ssii', $orden_curso, $seccion_curso, $cohorte, $cohorteDestino);
                    $nueva_consulta_estudiantes->execute();
                    $resultado_estudiantes = $nueva_consulta_estudiantes->get_result();
                    if ($resultado_estudiantes->num_rows >= 1) {
                        $estudiantes = $resultado_estudiantes->fetch_all(MYSQLI_ASSOC);
                    }else {
                        $estudiantes = [];
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query de estudiantes'));
                    exit;
                }
                $sql_valoraciones="SELECT 
                                    u.id AS id_usuario, 
                                    u.apellido, 
                                    u.nombre, 
                                    e.id AS id_espacio, 
                                    e.nombre_espacio, 
                                    v.id AS id_valoracion, 
                                    v.valor, 
                                    v.observacion 
                                    FROM curso_estudiante ce 
                                    JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id 
                                    JOIN curso c ON cg.id_curso = c.id 
                                    JOIN espacio e ON e.id = c.espacio 
                                    JOIN cohorte co ON co.id = c.id_cohorte 
                                    JOIN usuarios u ON u.id = ce.id_usuario 
                                    JOIN instancia_calificacion i ON i.id_cohorte = co.id 
                                    AND i.nombre_instancia = 'final' 
                                    LEFT JOIN valoracion v ON v.id_usuario = ce.id_usuario 
                                    AND v.id_curso = c.id 
                                    AND v.id_instancia = i.id 
                                    WHERE e.orden = ?
                                    AND cg.seccion = ? 
                                    AND co.id = ? 
                                    ORDER BY u.apellido, u.nombre, e.nombre_espacio";
                if($nueva_consulta_valoraciones= $conexion->prepare($sql_valoraciones)) {
                    $nueva_consulta_valoraciones->bind_param('ssi', $orden_curso, $seccion_curso, $cohorte);
                    $nueva_consulta_valoraciones->execute();
                    $resultado_valoraciones = $nueva_consulta_valoraciones->get_result();
                    if ($resultado_valoraciones->num_rows >= 1) {
                        $valoraciones = $resultado_valoraciones->fetch_all(MYSQLI_ASSOC);
                    }else {
                        $valoraciones = [];
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query de estudiantes'));
                    exit;
                }
            }else{
                $estudiantes = [];
                $valoraciones = [];
            }
            echo json_encode(array('resultado'=>false, 'cursos' => $cursos, 'estudiantes' => $estudiantes, 'valoraciones' => $valoraciones));
    break;

    case 'POST': 
        if(isset($dataObject->modo)){
            $modo = $dataObject->modo;
            //chequea el modo
            if($modo=='buscarEstudiantesCurso'){
                $id_curso= $dataObject->id_curso;
                $id_grupo= $dataObject->id_grupo;
                $id_instancia = $dataObject->id_instancia ?? null;
                $sql="SELECT c.id_cohorte, ce.*, u.* 
                        FROM curso_estudiante as ce, 
                        (SELECT us.id, 
                                us.usuario, 
                                us.nombre, 
                                us.apellido, 
                                us.apodo, 
                                us.documento, 
                                p.imagen_perfil, 
                                p.color, 
                                p.fecnac, 
                                p.genero, 
                                p.email, 
                                p.telefono, 
                                p.calle, 
                                p.numero, 
                                p.piso, 
                                p.depto, 
                                p.ciudad, 
                                p.provincia 
                            FROM usuarios us 
                            LEFT JOIN usuario_perfil p 
                                ON us.id= p.id_usuario)u, curso_grupo as cg, curso as c 
                            WHERE cg.id=ce.id_curso_grupo 
                            and cg.id_curso=c.id 
                            and ce.id_usuario=u.id 
                            and ce.id_curso_grupo=".$id_grupo." 
                            ORDER BY u.apellido, u.nombre";
                
                if($nueva_consulta = $conexion->prepare($sql)) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows >= 1) {
                        if (($resultado->num_rows == 1) and (($modo=='buscarCursoUsuario') or ($modo=='buscarCursoPlanificacion') )){
                            echo json_encode([$resultado->fetch_assoc()]);
                        }else{
                            //array de estudiantes
                            $estudiantes=$resultado->fetch_all(MYSQLI_ASSOC);

                            // Consulta para obtener las valoraciones de los estudiantes de un curso y grupo específicos
                            $query = "
                                    SELECT v.id AS id_valoracion, v.id_instancia, v.id_usuario, v.id_curso, v.valor, v.fecha, v.observacion, v.estado_aprobacion, e.id AS id_estudiante_curso, i.nombre_instancia
                                    FROM valoracion v
                                    JOIN curso_estudiante e ON e.id_usuario = v.id_usuario
                                    JOIN instancia_calificacion i ON i.id = v.id_instancia
                                    JOIN curso_grupo g ON g.id = e.id_curso_grupo
                                    WHERE g.id_curso =".$id_curso." AND g.id = ".$id_grupo." AND v.id_curso = ".$id_curso;
                            if ($id_instancia) {
                                $query .= " AND v.id_instancia = " . intval($id_instancia);
                            }
                            $query .= " ORDER BY i.nombre_instancia, e.id_usuario";
                
                            if($nueva_consulta2 = $conexion->prepare($query)){ 
                                $nueva_consulta2->execute();
                                $result = $nueva_consulta2->get_result();
                                if ($result->num_rows >= 1) {
                                    $valoraciones=$result->fetch_all(MYSQLI_ASSOC);
                                }else{
                                    $valoraciones = [];
                                }
                                //buscar el equipo docente del curso y grupo específicos
                                $query_docentes = "SELECT c.id_cohorte, ced.*, u.* 
                                                    FROM curso_equipo_docente as ced, 
                                                    (SELECT us.id, 
                                                            us.usuario, 
                                                            us.nombre, 
                                                            us.apellido, 
                                                            us.apodo, 
                                                            us.documento, 
                                                            p.imagen_perfil, 
                                                            p.color, 
                                                            p.fecnac, 
                                                            p.genero, 
                                                            p.email, 
                                                            p.telefono, 
                                                            p.calle, 
                                                            p.numero, 
                                                            p.piso, 
                                                            p.depto, 
                                                            p.ciudad, 
                                                            p.provincia 
                                                        FROM usuarios us 
                                                        LEFT JOIN usuario_perfil p 
                                                            ON us.id= p.id_usuario)u, curso_grupo as cg, curso as c 
                                                        WHERE cg.id=ced.id_curso_grupo 
                                                        and cg.id_curso=c.id 
                                                        and ced.id_usuario=u.id 
                                                        and ced.id_curso_grupo= ?";
                                if($nueva_consulta_docentes= $conexion->prepare($query_docentes)) {
                                    $nueva_consulta_docentes->bind_param('i', $id_grupo);
                                    $nueva_consulta_docentes->execute();
                                    $resultado_docentes = $nueva_consulta_docentes->get_result();
                                    if ($resultado_docentes->num_rows >= 1) {
                                        $equipo_docente = $resultado_docentes->fetch_all(MYSQLI_ASSOC);
                                    }else {
                                        $equipo_docente = [];
                                    }
                                }else{
                                    echo json_encode(['estudiantes'=>$estudiantes, 'valoraciones'=>$valoraciones, 'equipo_docente'=>[]]);
                                    exit;
                                }

                                //envio los resultados estudiantes y valoraciones    
                                echo json_encode(['estudiantes'=>$estudiantes, 'valoraciones'=>$valoraciones, 'equipo_docente'=>$equipo_docente]);
                            }else{
                                echo json_encode(['estudiantes'=>$estudiantes, 'valoraciones'=>[], 'error'=>'No se pudo preparar la consulta de valoraciones']);
                            }
                        }
                    }else {
                        echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
                }
                $conexion->close();
            }
        }else{
            $respuesta = ['error', 'No se ejecuto consulta'];
            if($_POST['nuevo']=='SI'){  //crear nueva clase
                //tomo las variables pasadas por post
                $id_curso = $_POST['id_curso'];
                $titulo_corto=$_POST['titulo_corto'];
                $tema=$_POST['tema']; 
                $presentacion=$_POST['presentacion'];              
                $usuario='';

                $fechaHora=date('Y-m-d H:i:s'); 
                
                    
                $sql2="INSERT INTO clase (id_curso, titulo_corto, tema, presentacion, fecha, creado_por) VALUES ('$id_curso','$titulo_corto','$tema','$presentacion','$fechaHora','$usuario')";
                if(mysqli_query($conexion, $sql2)){
                    $respuesta = ['success', 'Se creo la clase'];
                }else{
                    $respuesta = ['error', $error];
                }
            }else{ //actualizar clase
                $id= $_POST['id'];
                $id_curso = $_POST['id_curso'];
                $titulo_corto=$_POST['titulo_corto'];
                $tema=$_POST['tema']; 
                $presentacion=$_POST['presentacion'];              
                $usuario='';

                $fechaHora=date('Y-m-d H:i:s'); 
                    
                $sql2="UPDATE clase SET id_curso='$id_curso', titulo_corto= '$titulo_corto', tema='$tema', presentacion='$presentacion', fecha='$fechaHora',creado_por='$usuario' WHERE id='$id'";
                
                if(mysqli_query($conexion, $sql2)){
                    $respuesta = ['success',  'Se actualizo la clase '];
                }else{
                    $respuesta = ['error', $error];
                }
            }
            echo json_encode($respuesta);
        }    
        break;

   case 'PUT':
        break;

    case 'DELETE';
    if(!isset($dataObject->id)){
        $respuesta= ['error','El ID no debe estar vacío'];
    }
    else{
        $id = $dataObject->id;
        if(isset($dataObject->modo)){
           // if ($dataObject->modo === 'eliminarEstudiante') {
                $id_curso_grupo = $dataObject->id_grupo;
                // Aquí haces la consulta para eliminar al estudiante
                $sql = "DELETE FROM curso_estudiante WHERE id_usuario = ? AND id_curso_grupo = ? ";
                $stmt = $conexion->prepare($sql);
                $stmt->bind_param('ii', $id, $id_curso_grupo);
            
                if ($stmt->execute()) {
                    $respuesta = ['success','Se quito el/la estudiante'];
                } else {
                    $respuesta = ['error','fallo la acción quitar'];
                }
            //}
        }else{
            //if ($nueva_consulta = $conexion->prepare("DELETE FROM Clase where id='$id' ")) {
            //    $nueva_consulta->execute();
    
            //   $respuesta = ['success','Clase eliminada'];
            //}else{
            //    $respuesta = ['error','fallo la eliminación'];
            //}    
        }
        
    }
   
    echo json_encode($respuesta);
    
    break;
}
            