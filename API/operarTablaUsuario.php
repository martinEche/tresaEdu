
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
        if (isset($_GET['id_usuario'])){ 
            //busco el perfil
            $id_usuario = $_GET['id_usuario'];
            $sql="SELECT u.*, u.id FROM (SELECT us.id, us.usuario, us.nombre, us.apellido, us.apodo, us.documento, us.clave, p.imagen_perfil, p.color, p.fecnac, p.genero, p.email, p.email2, p.telefono, p.calle, p.numero, p.piso, p.depto, p.ciudad, p.provincia FROM usuarios us LEFT JOIN usuario_perfil p ON us.id= p.id_usuario)u WHERE u.id =".$id_usuario;
            if ($nueva_consulta = $conexion->prepare($sql)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows == 0) {
                    $respuesta = ['error','el usuario no existe'];
                }else{
                    $respuesta= $resultado->fetch_assoc();
                }
            }else{
                $respuesta = ['error','no se pudo realizar la consulta'];
            }
            echo json_encode($respuesta);
        }elseif (isset($_GET['tutores_curso_grupo'])){
            $id_curso_grupo = $_GET['tutores_curso_grupo'];
            $sql = "SELECT DISTINCT u.id, u.usuario, u.nombre, u.apellido, GROUP_CONCAT(DISTINCT r.nombre SEPARATOR ', ') AS roles
                    FROM curso_estudiante ce
                    JOIN vinculo v ON ce.id_usuario = v.id_estudiante
                    JOIN usuarios u ON v.id_tutor = u.id
                    INNER JOIN rol AS ro ON u.id = ro.id_usuario
                    INNER JOIN roles AS r ON ro.rol = r.id
                    WHERE ce.id_curso_grupo = ?
                    GROUP BY u.id, u.usuario, u.nombre, u.apellido";
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id_curso_grupo);
                $stmt->execute();
                $result = $stmt->get_result();
                $usuarios = [];
                if ($result->num_rows > 0) {
                    while ($row = $result->fetch_assoc()) {
                        $usuarios[] = $row;
                    }
                }
                echo json_encode($usuarios);
            } else {
                echo json_encode(array('resultado' => false, 'error' => 'Error en la consulta a la base de datos.'));
            }
        }else{
            if (isset($_GET['rol_origen'])){ 
                $rol_origen= $_GET['rol_origen'];
                //si llega la variable rol tengo que cruzarlo con las reglas 
                // para mostrar los usuarios a los que tienen permitodo enviarle mensaje
                //si llega la variable rol tengo que cruzarlo con las reglas 
                // para mostrar los usuarios a los que tienen permitodo enviarle mensaje
                $sql = "SELECT 
                        u.id, 
                        u.usuario, 
                        u.nombre, 
                        u.apellido,
                        GROUP_CONCAT(DISTINCT r.nombre SEPARATOR ', ') AS roles
                    FROM usuarios AS u
                    INNER JOIN rol AS ro ON u.id = ro.id_usuario
                    INNER JOIN roles AS r ON ro.rol = r.id
                    LEFT JOIN rol_mensajeria AS rm 
                        ON rm.rol_origen = $rol_origen
                        AND rm.rol_destino = ro.rol 
                        AND rm.noPermitido = 1 
                    WHERE rm.id IS NULL
                    GROUP BY u.id, u.usuario, u.nombre, u.apellido";
                if ($stmt = $conexion->prepare($sql)) {
                    $stmt->execute();
                    // Obtener resultados
                    $result = $stmt->get_result();
                    $usuarios = [];
            
                    if ($result->num_rows > 0) {
                        // Recorrer los resultados y guardarlos en un array
                        while ($row = $result->fetch_assoc()) {
                            $usuarios[] = $row;
                        }
                    }
                    // Enviar la respuesta en formato JSON
                    echo json_encode($usuarios);
                } else {
                    echo json_encode(array('resultado' => false, 'error' => 'Error en la consulta a la base de datos.'));
                }
                $stmt->close();        
            }else{
                // Prepara la consulta SQL para buscar usuarios cuyo nombre o apellido coincida con la búsqueda
                $sql = "SELECT id, usuario, nombre, apellido FROM usuarios";
            
                if ($stmt = $conexion->prepare($sql)) {
                    $stmt->execute();
                    // Obtener resultados
                    $result = $stmt->get_result();
                    $usuarios = [];
            
                    if ($result->num_rows > 0) {
                        // Recorrer los resultados y guardarlos en un array
                        while ($row = $result->fetch_assoc()) {
                            $usuarios[] = $row;
                        }
                    }
                    // Enviar la respuesta en formato JSON
                    echo json_encode($usuarios);
                } else {
                    echo json_encode(array('resultado' => false, 'error' => 'Error en la consulta a la base de datos.'));
                }
                $stmt->close();
            }
        }
        
        $conexion->close();
        
        break;

    case 'POST':
        if (isset($dataObject->claveActual)) {
            $id_usuario = $dataObject->id_usuario;
            $claveActual = $dataObject->claveActual;
            $claveNueva = $dataObject->claveNueva;
            
            // Verificar usuario por ID
            if ($nueva_consulta = $conexion->prepare("SELECT u.id, u.clave FROM usuarios as u WHERE u.id = ?")) {
                $nueva_consulta->bind_param('i', $id_usuario);
                $nueva_consulta->execute();
                $nueva_consulta->store_result();
                
                if ($nueva_consulta->num_rows >= 1) {
                    $nueva_consulta->bind_result($id, $clave);
                    $nueva_consulta->fetch();
                    $encriptado_db = $clave;
        
                    // Verificar si la clave actual es correcta
                    if (password_verify($claveActual, $encriptado_db)) {
                        // Encriptar nueva contraseña
                        $clave_e = password_hash($claveNueva, PASSWORD_BCRYPT);
        
                        // Actualizar la nueva contraseña
                        if ($nueva_consulta = $conexion->prepare("UPDATE usuarios SET clave=? WHERE id=?")) {
                            $nueva_consulta->bind_param('si', $clave_e, $id_usuario);
                            $nueva_consulta->execute();
                            $respuesta = ['conectado' => true, 'infoUser' => ['id' => $id]];
                        } else {
                            $respuesta = ['conectado' => false, 'error' => 'No se pudo actualizar la contraseña.'];
                        }
                    } else {
                        $respuesta = ['conectado' => false, 'error' => 'La clave actual es incorrecta.'];
                    }
                } else {
                    $respuesta = ['conectado' => false, 'error' => 'El usuario no existe.'];
                }
        
                $nueva_consulta->close();
            } else {
                $respuesta = ['conectado' => false, 'error' => 'No se pudo conectar a BD'];
            }
            $conexion->close();
        }else{
            if (isset($_POST['id'])){ 
                //actualizo el perfil
                //tomo datos
                $id = $_POST['id'];
                $nombre = $_POST['nombre'];
                $apellido = $_POST['apellido'];
                $apodo= $_POST['apodo'];
                $fecnac= $_POST['fecnac'];
                $email= $_POST['email'];
                $email2= isset($_POST['email2']) ? $_POST['email2'] : '';
                $genero= $_POST['genero'];
                $telefono= $_POST['telefono'];
                $calle= $_POST['calle'];
                $numero= $_POST['numero'];
                $piso= $_POST['piso'];
                $depto= $_POST['depto'];
                $ciudad= $_POST['ciudad'];
                $provincia= $_POST['provincia'];
    
                //actualizo tabla usuarios
                $nueva_consulta = $conexion->prepare("UPDATE usuarios SET nombre='$nombre', apellido='$apellido', apodo='$apodo' where id='$id' ");
                $nueva_consulta->execute();
    
                //si envio foto subo la foto y preparo la variable $imagen_perfil    
                if(isset($_FILES['foto']["name"])){
                    $file_parts =explode(".", $_FILES['foto']['name']);
                    $extension = end($file_parts);
                
                    $nombrePath = $id."_perfil.".$extension;
                    $fuente = $_FILES["foto"]["tmp_name"]; //Obtenemos un nombre temporal del archivo
    
                    $directorio = 'foto_perfil'; //Declaramos un  variable con la ruta donde guardaremos los archivos
                    //Validamos si la ruta de destino existe, en caso de no existir la creamos
                    if(!file_exists($directorio)){
                        mkdir($directorio, 0777) or die("No se puede crear el directorio de extracci&oacute;n");    
                    }
                    $dir=opendir($directorio); //Abrimos el directorio de destino
                    $target_path = $directorio.'/'.$nombrePath; //Indicamos la ruta de destino, así como el nombre del archivo
    
                    //Movemos y validamos que el archivo se haya cargado correctamente
                    if(move_uploaded_file($fuente, $target_path)) { 
                        // SI El archivo se ha almacenado en forma exitosa actualizo los datos
                        //$query2 = $conexion->prepare("INSERT INTO mensajes_adjunto (id_mensaje , path_archivo, nombre_archivo) values('".$id_insertado."','".$target_path."','".$nombreOriginal."')");
                        //$query2->execute();
                        $imagen_perfil=$target_path;
                        $error="";
                    } else {    
                        $error=' - Ha ocurrido un error, al subir la imagen';
                    }
                    closedir($dir); //Cerramos el directorio de destino
                }else{
                    $imagen_perfil="";
                }
    
                //busco si tiene perfil crado
                $buscar_perfil = $conexion->prepare("SELECT * FROM usuario_perfil WHERE id_usuario = '$id'");
                $buscar_perfil->execute();
                $perfil = $buscar_perfil->get_result();
                if ($perfil->num_rows >= 1) {
                    //si tiene perfil actualizo
                    if( $imagen_perfil<>""){
                        $sql="UPDATE usuario_perfil SET fecnac='$fecnac', genero='$genero', imagen_perfil='$imagen_perfil', email = '$email', email2 = '$email2', telefono='$telefono', calle='$calle', numero='$numero', piso='$piso', depto='$depto', ciudad ='$ciudad', provincia ='$provincia' where id_usuario=$id";
                    }else{
                        //no actualizo foto de perfil
                        $sql="UPDATE usuario_perfil SET fecnac='$fecnac', genero='$genero', email = '$email', email2 = '$email2', telefono='$telefono', calle='$calle', numero='$numero', piso='$piso', depto='$depto', ciudad ='$ciudad', provincia ='$provincia' where id_usuario=$id";
                    }
                    if ($actualiza_perfil = $conexion->prepare($sql)) {
                        $actualiza_perfil->execute();
                        $respuesta = ['success','perfil actualizado'];
                    }else{
                        $respuesta = ['error','error actualizado'];
                    }
                //si no tiene perfil lo creo
                }else{
                    if ($actualiza_perfil = $conexion->prepare("INSERT INTO usuario_perfil (id_usuario, imagen_perfil, color, fecnac, genero, email, email2, telefono, calle, numero, piso, depto, ciudad, provincia) VALUES ('$id','$imagen_perfil','','$fecnac','$genero','$email','$email2','$telefono','$calle','$numero','$piso','$depto','$ciudad','$provincia') ") ){
                        $actualiza_perfil->execute();
                        $respuesta = ['success','perfil actualizado'];
                    }else{
                        $respuesta = ['error','error crear el perfil'];
                    }
                }
            }else{
                //alta de usuario nuevo
                $usuario = $dataObject-> usuario;
                $clave = $dataObject-> clave;
                $nombre = $dataObject-> nombre;
                $apellido = $dataObject-> apellido;
                $documento = $dataObject-> documento;     
                //busco si esta el usuario por el numero de documento    
                if ($buscar_si_esta = $conexion->prepare("SELECT * FROM usuarios WHERE documento= '{$documento}'")) {
                    $buscar_si_esta->execute();
                    $resultado = $buscar_si_esta->get_result();
                    if ($resultado->num_rows >= 1) {
                        $respuesta = ['error','Ya existe un usuarios con el mismo numero de documento'];
                        // echo json_encode($resultado);
                    }else {
                        //busco que no se repita el nombre de usuario
                        if ($buscar_si_esta = $conexion->prepare("SELECT * FROM usuarios WHERE usuario= '{$usuario}'")) {
                            $buscar_si_esta->execute();
                            $resultado = $buscar_si_esta->get_result();
                            if ($resultado->num_rows >= 1) {
                                $respuesta = ['error','Ya existe un usuarios con el mismo nombre de usuario'];
                                //echo json_encode($resultado);
                            }else {
                               // $clave_e=password_hash($clave, PASSWORD_DEFAULT);
                                $clave_e=password_hash($clave, PASSWORD_BCRYPT);
                                if ($nueva_consulta = $conexion->prepare("INSERT INTO usuarios (usuario, clave, nombre, apellido, documento, estado, apodo) values('$usuario', '$clave_e', '$nombre', '$apellido', '$documento', '1', '')")) {
                                    $nueva_consulta->execute();
                                    $respuesta = ['success','usuario creado'];
                                    //echo json_encode($respuesta);
                                }else{
                                    $q="INSERT INTO usuarios (usuario, clave, nombre, apellido, documento, estado, apodo) values('$usuario', '$clave_e', '$nombre', '$apellido', '$documento', '1', '')";
                                    $respuesta = ['error','fallo la inserción'.$q];
                                    //echo json_encode($respuesta);
                                }
                            }
                        }else{
                            $respuesta = ['error','fallo la busqueda'];
                            //echo json_encode($respuesta);  
                        }
                    }    
                }else{
                    $respuesta = ['error','fallo la busqueda'];
                    //echo json_encode($respuesta);
                }    
            }
    
        }
        echo json_encode($respuesta);
        break;

    case 'PUT':
      if(isset($dataObject->modo) && $dataObject->modo === 'resetPassword'){
        $id = $dataObject->id;
        $clave = '123'; // Aquí se establece una contraseña predeterminada
        $clave_e = password_hash($clave, PASSWORD_BCRYPT);
        $nueva_consulta = $conexion->prepare("UPDATE usuarios SET clave='$clave_e' WHERE id='$id'");
        $nueva_consulta->execute();
        $respuesta = ['success','contraseña restablecida a '. $clave];
      }else{
         //actualizo el perfil  
        $id = $dataObject->id;
        $nombre = $dataObject-> nombre;
        $apellido = $dataObject-> apellido;
       
        if(isset($dataObject->email)){
            $apodo= $dataObject->apodo;
            $fecnac= $dataObject->fecnac;
            $email= $dataObject->email;
            $email2= isset($dataObject->email2) ? $dataObject->email2 : '';
            $genero= $dataObject->genero;
            $telefono= $dataObject->telefono;
            $calle= $dataObject->calle;
            $numero= $dataObject->numero;
            $piso= $dataObject->piso;
            $depto= $dataObject->depto;
            $ciudad= $dataObject->ciudad;
            $provincia= $dataObject->provincia;

            $nueva_consulta = $conexion->prepare("UPDATE usuarios SET nombre='$nombre', apellido='$apellido', apodo='$apodo' where id='$id' ");
            $nueva_consulta->execute();
            //busco si tiene perfil crado
            $buscar_perfil = $conexion->prepare("SELECT * FROM usuario_perfil WHERE id_usuario = '$id'");
            $buscar_perfil->execute();
            $perfil = $buscar_perfil->get_result();
            if ($perfil->num_rows >= 1) {
                $sql="UPDATE usuario_perfil SET fecnac='$fecnac', genero='$genero', email ='$email', email2 ='$email2', telefono='$telefono', calle='$calle', numero='$numero', piso='$piso', depto='$depto', ciudad ='$ciudad', provincia ='$provincia' where id_usuario=$id";
                if ($actualiza_perfil = $conexion->prepare($sql)) {
                    $actualiza_perfil->execute();
                    $respuesta = ['success','perfil actualizado',$sql];
                }else{
                    $respuesta = ['error','error actualizado'];
                }
            }else{
                if ($actualiza_perfil = $conexion->prepare("INSERT INTO usuario_perfil (id_usuario, imagen_perfil, color, fecnac, genero, email, email2, telefono, calle, numero, piso, depto, ciudad, provincia) VALUES ('$id','','','$fecnac','$genero','$email','$email2','$telefono','$calle','$numero','$piso','$depto','$ciudad','$provincia') ") ){
                    $actualiza_perfil->execute();
                    $respuesta = ['success','perfil actualizado'];
                }else{
                    $respuesta = ['error','error crear el perfil'];
                }
            }
        }else{
            $usuario = $dataObject-> usuario;
            $documento = $dataObject-> documento;
            //busco que no se repita el nombre de usuario
            if ($buscar_si_esta = $conexion->prepare("SELECT * FROM usuarios WHERE usuario = '$usuario' and id<>'$id'")) {
                $buscar_si_esta->execute();
                $resultado = $buscar_si_esta->get_result();
                if ($resultado->num_rows >= 1) {
                    $respuesta = ['error','Ya existe un usuarios con el mismo nombre de usuario'];
                }else {
                    if ($nueva_consulta = $conexion->prepare("UPDATE usuarios SET usuario='$usuario', nombre='$nombre', apellido='$apellido', documento='$documento' where id='$id' ")) {
                        $nueva_consulta->execute();
                        $respuesta = ['success','usuarios actualizado'];
                    }else{
                        $respuesta = ['error','fallo la actualización'];
                    }
                }
            }else{
                $respuesta = ['error','fallo la busqueda'];
            }
        }            
      }
      echo json_encode($respuesta);
      break;

    case 'DELETE';
        if(!isset($dataObject->id)){
            if(!isset($dataObject->id_usuario)){
                $respuesta= ['error','El ID no debe estar vacío'];
            }else{
                $id_usuario = $dataObject->id_usuario;
                $id_rol = $dataObject->id_rol;
                if ($nueva_consulta = $conexion->prepare("DELETE FROM rol where id_usuario='$id_usuario' and rol='$id_rol' ")) {
                    $nueva_consulta->execute();
                    $respuesta = ['success','Se quito el rol'];
                }else{
                    $respuesta = ['error','fallo la eliminación'];
                }
            }
        }
        else{
            $id = $dataObject->id;

            if ($nueva_consulta = $conexion->prepare("DELETE FROM usuarios where id='$id' ")) {
                $nueva_consulta->execute();
                if($nueva_consulta1 = $conexion->prepare("DELETE FROM rol where id_usuario='$id' ")){
                    $nueva_consulta1->execute();
                    $conexion->query("DELETE FROM curso_estudiante WHERE id_usuario='$id'");
                    $conexion->query("DELETE FROM curso_equipo_docente WHERE id_usuario='$id'");
                    $conexion->query("DELETE FROM usuario_perfil WHERE id_usuario='$id'");
                    $respuesta = ['success','Usuario eliminado'];
                }else{
                    $respuesta = ['error','fallo la eliminación de los roles del usuario'];
                }
            }else{
                $respuesta = ['error','fallo la eliminación'];
            }
        }
        $nueva_consulta->close();
        echo json_encode($respuesta);
    break;
}

?>