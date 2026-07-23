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

//buscaUsuariosPorRol
if(isset($dataObject-> id_rol)){
    $id_rol = $dataObject-> id_rol;

    //consultas si es id_rol=0 muestro todos
    if($id_rol==0){
        $sql="SELECT usuarios.* FROM usuarios order by usuarios.apellido, usuarios.nombre, usuarios.usuario";
    }elseif(($id_rol >= 5) and ($id_rol <= 6)){
        $sql="SELECT usuarios.*, roles.nombre as nombre_rol, count(usuarios.id) as roles FROM usuarios, rol, roles WHERE roles.id=rol.rol and usuarios.id= rol.id_usuario and (rol.rol='5' or rol.rol='6') group by usuarios.id order by usuarios.apellido, usuarios.nombre, usuarios.usuario";
    }elseif($id_rol > 0){
        $sql="SELECT usuarios.*,  count(usuarios.id) as roles FROM usuarios, rol, roles WHERE roles.id=rol.rol and usuarios.id= rol.id_usuario and rol.rol='{$id_rol}' group by usuarios.id order by usuarios.apellido, usuarios.nombre, usuarios.usuario";
    }elseif($id_rol ==-1){
        $sql="SELECT usuarios.* FROM usuarios where usuarios.id not in (select rol.id_usuario from rol)";
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
           echo json_encode(array('resultado'=>false, 'error' => 'No se pudo conectar a BD'));
    }
    
}
if(isset($dataObject-> rol)){
    $id_rol = $dataObject-> rol;

    //consultas el nombre
    $sql="SELECT * FROM roles where id = $id_rol";

    if ($nueva_consulta = $conexion->prepare($sql)) {
        $nueva_consulta->execute();
        $resultado = $nueva_consulta->get_result();
        if ($resultado->num_rows >= 1) {
            echo json_encode($resultado->fetch_assoc());
        }else {
            echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
        }
    }else{
           echo json_encode(array('resultado'=>false, 'error' => 'No se pudo conectar a BD'));
    } 
}
if(isset($dataObject-> id_usuario)){
    $id_usuario = $dataObject-> id_usuario;
    
    $sql="SELECT u.id, u.usuario, u.nombre, u.apellido, u.apodo, u.documento, p.imagen_perfil, p.color, p.fecnac, p.genero, p.email, p.email2, p.telefono, p.calle, p.numero, p.piso, p.depto, p.ciudad, p.provincia FROM usuarios u LEFT JOIN usuario_perfil p ON u.id= p.id_usuario where u.id=".$id_usuario;

    if ($nueva_consulta = $conexion->prepare($sql)) {
        $nueva_consulta->execute();
        $resultado = $nueva_consulta->get_result();
        if ($resultado->num_rows >= 1) {
            //$datos = mysqli_fetch_assoc($resultado);
            $datos = $resultado->fetch_assoc();
            //si llamo para mostrar y editar perfil solo muestro eso
            if($dataObject-> modo == 'buscarPerfilUsuario'){
                //verificar si tien vinculos
                $sql_vinculo="SELECT v.*, u.nombre, u.apellido, u.documento FROM vinculo as v, usuarios as u WHERE u.id=v.id_tutor and v.id_estudiante=$id_usuario";
                if ($consulta_vinculo = $conexion->prepare($sql_vinculo)) {
                    $consulta_vinculo->execute();
                    $resultado = $consulta_vinculo->get_result();
                    if ($resultado->num_rows >= 1) {
                        $vinculo= $resultado->fetch_all(MYSQLI_ASSOC);
                    }else{
                        $vinculo=[];
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo conectar a BD'));
                    exit;
                }
                echo json_encode(['datos'=>$datos,'vinculo'=>$vinculo]);
            }
            //si llamo para mostrar ficha completa 
            if($dataObject-> modo == 'buscarFichalUsuario'){
                $sql_roles="SELECT r.*, ru.creado_el FROM rol as ru LEFT JOIN roles as r ON r.id=ru.rol where  ru.id_usuario=".$id_usuario." ORDER BY r.id ASC";
                if ($consulta_roles = $conexion->prepare($sql_roles)) {
                    $consulta_roles->execute();
                    $resultado_roles = $consulta_roles->get_result();
                    if ($resultado_roles->num_rows >= 1) {
                        $roles = $resultado_roles->fetch_all(MYSQLI_ASSOC);

                        $sql_vinculos="SELECT
                                            u.id,
                                            u.nombre, 
                                            u.apellido, 
                                            u.documento, 
                                            pu.*
                                        FROM vinculo v
                                        LEFT JOIN usuarios u ON v.id_tutor = u.id
                                        LEFT JOIN usuario_perfil pu ON pu.id_usuario = u.id
                                        WHERE v.id_estudiante = ".$id_usuario;
                        if ($consulta_vinculos = $conexion->prepare($sql_vinculos)) {
                            $consulta_vinculos->execute();
                            $resultado_vinculos = $consulta_vinculos->get_result();
                            if ($resultado_vinculos->num_rows >= 1) {
                                $tutores = $resultado_vinculos->fetch_all(MYSQLI_ASSOC);
                            } else {
                                echo json_encode(['info'=>$datos, 'roles'=>$roles, 'tutores'=>[]]);
                                exit;
                            } 
                        } else {
                            echo json_encode(['info'=>$datos, 'roles'=>$roles, 'tutores'=>[]]);
                            exit;   
                        }
                        echo json_encode(['info'=>$datos, 'roles'=>$roles, 'tutores'=>$tutores]);
                    }else{
                        echo json_encode(['info'=>$datos, 'roles'=>[],'tutores'=>[]]);
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo validar la consulta de roles')); 
                }
            }
        }else {
            echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
        }
    }else{
           echo json_encode(array('resultado'=>false, 'error' => 'No se pudo conectar a BD'));
    }

}

$conexion->close();

?>