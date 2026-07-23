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
        $sql="SELECT * FROM roles where id<>1";
        if ($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $resultado = $nueva_consulta->get_result();
            if ($resultado->num_rows >= 1) {
                echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
            }else {
                echo json_encode([]);
            }
        }else{
               echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
        }
        $conexion->close();
        break;

    case 'POST':   
        if(isset($dataObject->modo)){
            $modo = $dataObject->modo;
            if($modo=='buscarRoles'){
                $id = $dataObject-> id_usuario;
                $rol = $dataObject-> rol;
                if($rol==1){
                    $sql= "select * from roles where id not in (SELECT roles.id FROM usuarios, rol, roles WHERE roles.id=rol.rol and usuarios.id= rol.id_usuario and usuarios.id= $id order by usuarios.id, rol.rol, usuarios.apellido, usuarios.nombre, usuarios.usuario)";
                }else{
                    $sql= "select * from roles where id<>1 and id not in (SELECT roles.id FROM usuarios, rol, roles WHERE roles.id=rol.rol and usuarios.id= rol.id_usuario and usuarios.id= $id order by usuarios.id, rol.rol, usuarios.apellido, usuarios.nombre, usuarios.usuario)";
                }

                if ($nueva_consulta = $conexion->prepare($sql)) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows >= 1) {
                        echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
                    }else {
                        echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
                }
            }
            if($modo=='nuevoRol'){
                $id = $dataObject-> id_usuario;
                $nuevoRol = $dataObject-> idRol;
                $sql="INSERT INTO rol(id_usuario, rol) VALUES ($id, $nuevoRol)";

                if ($nueva_consulta = $conexion->prepare($sql)) {
                    $nueva_consulta->execute();
                    $respuesta = ['success','Rol agregado'];
                }else{
                    $respuesta = ['error','fallo al agregar el rol'];
                }
                echo json_encode($respuesta);
            }
            if($modo == 'buscarInfoRolUsuario'){
                $id_usuario = $dataObject-> id_usuario;
                $rol = $dataObject-> rol;

                if($rol==6){ //es docente busco cursos
                    $sql="SELECT a.*, p.id AS id_planificacion, ce2.cant_estudiantes
                    FROM (
                            SELECT 
                                    cg.id AS id_curso_grupo, 
                                    cg.id_curso, 
                                    COUNT(ce.id) AS cant_estudiantes
                            FROM curso_grupo AS cg
                            LEFT JOIN curso_estudiante AS ce ON cg.id = ce.id_curso_grupo
                            GROUP BY cg.id
                    ) ce2
                    JOIN (
                            SELECT 
                                    c.*, co.año as cohorte,
                                    e.nombre_espacio, 
                                    e.orden, 
                                    cg.denominacion, 
                                    cg.id AS id_curso_grupo, 
                                    cg.codigo_inscripcion, 
                                    f.caratula AS caratula_formacion, 
                                    f.nivel AS tipo_formacion,
                                    ed.fecha_alta,
                                    ed.fecha_baja,
                                    ed.estado as condicion
                            FROM curso AS c
                            JOIN curso_grupo AS cg ON c.id = cg.id_curso
                            JOIN curso_equipo_docente AS ed ON cg.id = ed.id_curso_grupo
                            JOIN espacio AS e ON c.espacio = e.id
                            JOIN formacion AS f ON e.id_formacion = f.id
                            JOIN cohorte AS co ON c.id_cohorte = co.id
                            WHERE ed.id_usuario ='$id_usuario'
                    ) a ON ce2.id_curso_grupo = a.id_curso_grupo
                    LEFT JOIN planificaciones AS p ON a.id_curso_grupo = p.id_curso_grupo";
                }
                if($rol== 7 || $rol== 8){ //es estudiante o tutor busco cursos del estudiante 
                    $sql="SELECT a.*, p.id AS id_planificacion, ce2.cant_estudiantes
                    FROM (SELECT cg.id AS id_curso_grupo, cg.id_curso, COUNT(ce.id) AS cant_estudiantes
                            FROM curso_grupo AS cg
                            LEFT JOIN curso_estudiante AS ce ON cg.id = ce.id_curso_grupo
                            GROUP BY cg.id) ce2
                    JOIN (SELECT c.*, co.año as cohorte, e.nombre_espacio, e.orden, cg.denominacion, cg.id AS id_curso_grupo, cg.codigo_inscripcion, f.caratula AS caratula_formacion, f.nivel AS tipo_formacion
                            FROM curso AS c
                            JOIN curso_grupo AS cg ON c.id = cg.id_curso
                            JOIN curso_estudiante AS es ON cg.id = es.id_curso_grupo
                            JOIN espacio AS e ON c.espacio = e.id
                            JOIN formacion AS f ON e.id_formacion = f.id
                            JOIN cohorte AS co ON c.id_cohorte = co.id
                            WHERE es.id_usuario ='$id_usuario') a ON ce2.id_curso_grupo = a.id_curso_grupo 
                    LEFT JOIN planificaciones AS p ON a.id_curso_grupo = p.id_curso_grupo";
                    $sql_tutores="SELECT 
                        u.id AS tutor_id,
                        u.usuario,
                        u.nombre,
                        u.apellido,
                        u.apodo,
                        u.documento,
                        u.estado,
                        up.imagen_perfil,
                        up.color,
                        up.fecnac,
                        up.genero,
                        up.email,
                        up.telefono,
                        up.calle,
                        up.numero,
                        up.piso,
                        up.depto,
                        up.ciudad,
                        up.provincia
                    FROM 
                        vinculo v
                    JOIN 
                        usuarios u ON v.id_estudiante = u.id
                    LEFT JOIN 
                        usuario_perfil up ON u.id = up.id_usuario
                    WHERE 
                        v.id_estudiante = '$id_usuario'";
                }
                if($rol== 8){ // es tutor busco estudiantes a cargo
                    $sql="SELECT 
                            u.id AS estudiante_id,
                            u.usuario,
                            u.nombre,
                            u.apellido,
                            u.apodo,
                            u.documento,
                            u.estado,
                            up.imagen_perfil,
                            up.color,
                            up.fecnac,
                            up.genero,
                            up.email,
                            up.telefono,
                            up.calle,
                            up.numero,
                            up.piso,
                            up.depto,
                            up.ciudad,
                            up.provincia
                        FROM 
                            vinculo v
                        JOIN 
                            usuarios u ON v.id_estudiante = u.id
                        LEFT JOIN 
                            usuario_perfil up ON u.id = up.id_usuario
                        WHERE 
                            v.id_tutor = '$id_usuario'";
                }
                if($rol > 0){
                    if($nueva_consulta = $conexion->prepare($sql)) {
                        $nueva_consulta->execute();
                        $resultado = $nueva_consulta->get_result();
                        if ($resultado->num_rows >= 1) {
                            if($rol===7){
                                if($nueva_consulta2 = $conexion->prepare($sql_tutores)) {
                                    $nueva_consulta2->execute();
                                    $resultado2 = $nueva_consulta2->get_result();
                                    if ($resultado2->num_rows >= 1) {
                                        echo json_encode(['resultado'=>$resultado->fetch_all(MYSQLI_ASSOC), 'tutores'=>$resultado2->fetch_all(MYSQLI_ASSOC)]);
                                    }else{
                                        echo json_encode(['resultado'=>$resultado->fetch_all(MYSQLI_ASSOC),'tutores'=>[]]);
                                    }
                                }else{
                                    echo json_encode(['resultado'=>$resultado->fetch_all(MYSQLI_ASSOC),'tutores'=>[]]);
                                }              
                            }else{
                                echo json_encode(['resultado'=>$resultado->fetch_all(MYSQLI_ASSOC),'tutores'=>[]]);
                            }
                        }else {
                            echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
                        }
                    }else{
                        echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'el Rol esta en 0 '));
                }
            }         
        }
        $conexion->close();
        break;

    case 'PUT':
      
        //update de datos
        $edita="";
        //$id = $_POST['id'];
        $id = $dataObject-> id;
        $cambioEstado=$dataObject-> cambioEstado;
        if($cambioEstado=='NO'){
            //$razon_social = $_POST['razon_social'];
            $razon_social = $dataObject-> razon_social;
            if($razon_social<>"") $edita= $edita."razon_social='$razon_social', ";
            
            //$correo = $_POST['correo'];
            $correo = $dataObject-> correo;
            if($correo<>"") $edita= $edita."correo='$correo', ";
            
            //$direccion = $_POST['direccion'];
            $direccion = $dataObject-> direccion;
            if($direccion<>"") $edita= $edita."direccion='$direccion', ";
            
            //$telefono = $_POST['telefono'];
            $telefono = $dataObject-> telefono;
            if($telefono<>"") $edita= $edita."telefono='$telefono', ";
            
            //$responsable = $_POST['responsable'];
            $responsable = $dataObject-> responsable;
            if($responsable<>"") $edita= $edita."responsable='$responsable', ";
        }else{
            $estado = $dataObject-> estado;
            $estado==0 ? $estado=1 : $estado=0;
            $edita= $edita."estado='$estado', ";
        }
        //query
        if($edita<>""){ //si hay algun dato para modificar
            $edita=substr($edita, 0, -2);
            $sql="UPDATE institucion SET ".$edita." WHERE id=".$id;
            $query1 = $conexion->prepare($sql);
            $query1->execute(); 

            $respuesta = ['success', 'registro guardado'];
            //$respuesta =$sql;
        }else{
            $respuesta = ['warning', 'no se actualizaron datos'];
        }

        echo json_encode($respuesta);
        //echo $respuesta;
        break;

    case 'DELETE';
        
        if(!isset($dataObject->id)){
            $respuesta= ['error','El ID no debe estar vacío'];
        }
        else{
            $id = $dataObject->id;
            
            if ($nueva_consulta = $conexion->prepare("DELETE FROM institucion where id='$id' ")) {
                $nueva_consulta->execute();

               $respuesta = ['success','institución eliminado'];
            }else{
                $respuesta = ['error','fallo la eliminación'];
            }
            
        }
        echo json_encode($respuesta);
    break;
}

?>