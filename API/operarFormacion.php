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
        $sql= "SELECT formacion.*, nivel.denominacion as tipo_formacion FROM formacion, nivel WHERE nivel.id=formacion.nivel order by formacion.nivel asc";
        
        if ($nueva_consulta = $conexion->prepare($sql)) {
            $nueva_consulta->execute();
            $resultado = $nueva_consulta->get_result();
            if ($resultado->num_rows >= 1) {
                echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
            }else {
                echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'.$sql));
            }
        }else{
               echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
        }
        $conexion->close();
        break;

    case 'POST':   
        if(isset($dataObject->modo)){
            $modo = $dataObject->modo;
            if($modo=='buscarFormacionID'){
                $id = $dataObject-> id;
                $sql= "SELECT * FROM formacion where id=".$id;
            }
            if($modo=='buscarEspaciosID'){
                $id = $dataObject-> id;
                $sql= "SELECT * FROM espacio where id_formacion=".$id." order by orden asc,nombre_espacio asc, id asc";
            }                  
            if ($nueva_consulta = $conexion->prepare($sql)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if (($resultado->num_rows >= 1) and ($modo=='buscarEspaciosID') ){
                    echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
                }else {
                    if (($resultado->num_rows == 1) and ($modo=='buscarFormacionID')) {
                        echo json_encode($resultado->fetch_assoc());
                    }else{
                        echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
                    }
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
            }
            $conexion->close();
        }else{
            //chequeo nuevo o editar a partir si tiene o no id el dato del front
            $nuevo= $_POST['nuevo']; 
            if($nuevo=='formacion'){
                $id=$_POST['id'];
                $nombre= $_POST['nombre'];
                $resolucionN = $_POST['resolucionN'];
                $resolucionP = $_POST['resolucionP'];
                $año = $_POST['año'];
                $observacion = $_POST['observacion'];
                $tipo = $_POST['tipo'];  
                $familia = $_POST['familia'];           
                $error="";
                $msg="Registro creado";

                if($id==""){    //es nuevo                 
                    $sql="INSERT INTO formacion (nombre_formacion, resolucion_N, resolucion_P, año, observacion, nivel, familia) values('$nombre','$resolucionN','$resolucionP','$año','$observacion','$tipo','$familia')";
                    //inserto el mensaje principal
    
                    $query1 = $conexion->prepare($sql);
                    $query1->execute();
                    //leo el id del mensaje insertado
                    $id_insertado=mysqli_insert_id($conexion);
                    //si hay caratula la subo 
                    if (count($_FILES)>0) {
                        $cantidad = count($_FILES);
                    
                        //subo archivos al servidor
                        for($i=0; $i<$cantidad; $i++){
                            //Validamos que el archivo exista
                            if($_FILES["caratula".$i]["name"]) {
                                $file_parts =explode(".", $_FILES["caratula".$i]["name"]);
                                $extension = end($file_parts);
                            
                            // $nombreOriginal = $_FILES["file".$i]["name"]; //Obtenemos el nombre original del archivo
                                $nombrePath = $id_insertado."_caratula.".$extension;
                                $fuente = $_FILES["caratula".$i]["tmp_name"]; //Obtenemos un nombre temporal del archivo
    
                                $directorio = 'caratulas'; //Declaramos un  variable con la ruta donde guardaremos los archivos
                                //Validamos si la ruta de destino existe, en caso de no existir la creamos
                                if(!file_exists($directorio)){
                                    mkdir($directorio, 0777) or die("No se puede crear el directorio de extracci&oacute;n");    
                                }
                            
                                $dir=opendir($directorio); //Abrimos el directorio de destino
                                $target_path = $directorio.'/'.$nombrePath; //Indicamos la ruta de destino, así como el nombre del archivo
    
                                //Movemos y validamos que el archivo se haya cargado correctamente
                                if(move_uploaded_file($fuente, $target_path)) { 
                                    // SI El archivo se ha almacenado en forma exitosa actualizo registro con la caratula
                                    $query2 = $conexion->prepare("UPDATE formacion SET caratula='$target_path' WHERE id=$id_insertado");
                                    $query2->execute();
                                } else {    
                                    $error=$error.' - Ha ocurrido un error, al adjuntar el archivo';
                                }
                                closedir($dir); //Cerramos el directorio de destino
                            }
                        }
                    }
    
                }else{ //es editar
                    $sql="UPDATE formacion SET nombre_formacion='$nombre', resolucion_N='$resolucionN', resolucion_P='$resolucionP',año='$año',observacion='$observacion', nivel='$tipo', familia='$familia' WHERE id=$id";
                    
                    $query1 = $conexion->prepare($sql);
                    $query1->execute();
                    //el id en insertado para no cambiar el codigo
                    $id_insertado=$id;
                    //si hay caratula la subo 
                    if (count($_FILES)>0) {
                        $cantidad = count($_FILES);
                    
                        //subo archivos al servidor
                        for($i=0; $i<$cantidad; $i++){
                            //Validamos que el archivo exista
                            if($_FILES["caratula".$i]["name"]) {
                                $file_parts =explode(".", $_FILES["caratula".$i]["name"]);
                                $extension = end($file_parts);
                            
                            // $nombreOriginal = $_FILES["file".$i]["name"]; //Obtenemos el nombre original del archivo
                                $nombrePath = $id_insertado."_caratula.".$extension;
                                $fuente = $_FILES["caratula".$i]["tmp_name"]; //Obtenemos un nombre temporal del archivo
    
                                $directorio = 'caratulas'; //Declaramos un  variable con la ruta donde guardaremos los archivos
                                //Validamos si la ruta de destino existe, en caso de no existir la creamos
                                if(!file_exists($directorio)){
                                    mkdir($directorio, 0777) or die("No se puede crear el directorio de extracci&oacute;n");    
                                }
                            
                                $dir=opendir($directorio); //Abrimos el directorio de destino
                                $target_path = $directorio.'/'.$nombrePath; //Indicamos la ruta de destino, así como el nombre del archivo
    
                                //Movemos y validamos que el archivo se haya cargado correctamente
                                if(move_uploaded_file($fuente, $target_path)) { 
                                    // SI El archivo se ha almacenado en forma exitosa actualizo registro con la caratula
                                    $query2 = $conexion->prepare("UPDATE formacion SET caratula='$target_path' WHERE id=$id_insertado");
                                    $query2->execute();
                                } else {    
                                    $error=$error.' - Ha ocurrido un error, al adjuntar el archivo';
                                }
                                closedir($dir); //Cerramos el directorio de destino
                            }
                        }
                    }
                }                  
            }
            if($nuevo=='espacio'){
                $id=$_POST['id'];
                $nombre= $_POST['nombre'];
                $orden = $_POST['orden'];
                $dictado = $_POST['dictado'];
                $horas = $_POST['horas'];
                $correspondencia = $_POST['correspondencia'];
                $id_formacion= $_POST['id_formacion'];

                $imagenPath = null;
                $directorio = "uploads/espacios";

                // Si suben imagen
                if(isset($_FILES['imagen']) && $_FILES['imagen']['tmp_name']){
                    // Crear directorio si no existe
                    if(!file_exists($directorio)){
                        mkdir($directorio, 0777, true);
                    }

                    $extension = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);
                    $nombreArchivo = time()."_".$id."_espacio.".$extension;
                    $rutaDestino = $directorio."/".$nombreArchivo;

                    if(move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaDestino)){
                        $imagenPath = $rutaDestino; // 👈 solo guardo la ruta
                    }else{
                        $error = "Error al mover la imagen al directorio";
                    }
                }

                $error="";
                if($id<>0){ // editar
                    if($imagenPath){
                        //echo "sssssi:".'-'.$nombre.'-'.$orden.'-'.$dictado.'-'.$horas.'-'.$correspondencia.'-'.$imagenPath.'-'.$id;
                        $sql="UPDATE espacio 
                            SET nombre_espacio=?, orden=?, dictado=?, horas=?, correspondencia=?, imagen=? 
                            WHERE id=?";
                        $query1 = $conexion->prepare($sql);
                        $query1->bind_param("ssssssi", $nombre, $orden, $dictado, $horas, $correspondencia, $imagenPath, $id);
                    }else{
                        $sql="UPDATE espacio 
                            SET nombre_espacio=?, orden=?, dictado=?, horas=?, correspondencia=? 
                            WHERE id=?";
                        $query1 = $conexion->prepare($sql);
                        $query1->bind_param("sssssi", $nombre, $orden, $dictado, $horas, $correspondencia, $id);
                    }
                    $msg="Se actualizó correctamente";
                }else{ // nuevo
                    if($imagenPath){
                        $sql="INSERT INTO espacio (nombre_espacio, orden, dictado, horas, id_formacion, correspondencia, imagen) 
                            VALUES (?,?,?,?,?,?,?)";
                        $query1 = $conexion->prepare($sql);
                        $query1->bind_param("sssssis", $nombre, $orden, $dictado, $horas, $id_formacion, $correspondencia, $imagenPath);
                    }else{
                        $sql="INSERT INTO espacio (nombre_espacio, orden, dictado, horas, id_formacion, correspondencia) 
                            VALUES (?,?,?,?,?,?)";
                        $query1 = $conexion->prepare($sql);
                        $query1->bind_param("ssssss", $nombre, $orden, $dictado, $horas, $id_formacion, $correspondencia);
                    }
                    $msg="Registro creado";
                }

                if(!$query1->execute()){
                    $error = "Error al guardar: ".$query1->error;
                }
            }

            //psara todas las opciones cuaando no entro en modo
            if($error==""){
                $respuesta = ['success', $msg];
            }else{
                $respuesta = ['error', $error];
            }
    
            echo json_encode($respuesta);
        }
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
            if(isset($dataObject->tabla)){
                $tabla = $dataObject->tabla;
                if($tabla=='espacios'){
                    $sql_del="DELETE FROM espacio WHERE id='$id' ";
                }
            }else{
                $sql_del="DELETE FROM formacion WHERE id='$id' ";
            }
            if ($nueva_consulta = $conexion->prepare($sql_del)) {
                $nueva_consulta->execute();

               $respuesta = ['success',' Eliminada'];
            }else{
                $respuesta = ['error','fallo la eliminación'];
            }
            
        }
        echo json_encode($respuesta);
    break;
}

?>