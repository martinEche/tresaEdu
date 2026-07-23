
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
    case 'POST':   
            //alta de cliente Institucion
            $razon_social = $_POST['razon_social'];
            $correo = $_POST['correo'];
            $direccion = $_POST['direccion'];
            $telefono = $_POST['telefono'];
            $responsable = $_POST['responsable'];
            $fecha_creacion=date('Y-m-d H:i:s'); 
            
            $error="";
            //inserto el registro en BD principal
            $query1 = $conexion->prepare("INSERT INTO institucion( razon_social, imagen_institucional, direccion, telefono, correo, responsable, fecha_creacion) values('$razon_social', '', '$direccion', '$telefono', '$correo', '$responsable', '$fecha_creacion')");
            $query1->execute();

            //leo el id del mensaje insertado
            $id_insertado=mysqli_insert_id($conexion);

            //crear carpeta del cliente en el servidor
            $directorio_cliente=strtr($razon_social, " ", "_");
            if(!file_exists($directorio_cliente)){
                mkdir($directorio_cliente, 0777) or die("No se puede crear el directorio de extracci&oacute;n");    
                $directorio_Logo = 'logoEmpresa'; //Declaramos un  variable con la ruta donde guardaremos los archivos
                $directorio =  $directorio_cliente."/".$directorio_Logo;
                mkdir($directorio, 0777) or die("No se puede crear el directorio de extracci&oacute;n"); 
            }
            //*******crear bases de datos
           $basedatos = "bd_".$directorio_cliente;
            //conectamos con el servidor
            $link = $conexion;
            $queryCBD = $conexion->prepare("CREATE DATABASE $basedatos");
            $queryCBD->execute();
            
            //***crear tablas */
          // $comando = 'mysql -u "root" -p "" "'.$basedatos.'" < bd_campus_0.sql';
           //$ultima_linea = system($comando, $retornoCompleto);
            //$error=$ultima_linea;
        
            //******** 

            //si hay logo lo subo y creo referencia en tabla
            $cantidad = count($_FILES);
            if($cantidad!=0){
                if($_FILES["imagen0"]["name"]) {
                    $file_parts =explode(".", $_FILES["imagen0"]["name"]);
                    $extension = end($file_parts);
                    
                    $nombreOriginal = $_FILES["imagen0"]["name"]; //Obtenemos el nombre original del archivo
                    $nombrePath = $id_insertado."_logo.".$extension;
                    $fuente = $_FILES["imagen0"]["tmp_name"]; //Obtenemos un nombre temporal del archivo

                    $dir=opendir($directorio); //Abrimos el directorio de destino
                    $target_path = $directorio.'/'.$nombrePath; //Indicamos la ruta de destino, así como el nombre del archivo

                    //Movemos y validamos que el archivo se haya cargado correctamente
                    if(move_uploaded_file($fuente, $target_path)) { 
                    // SI El archivo se ha almacenado en forma exitosa actualizo la imagen institucional
                        $query2 = $conexion->prepare("UPDATE institucion SET  base_datos = '".$basedatos."', espacio = '".$directorio_cliente."', imagen_institucional = '".$target_path."' WHERE institucion.id='$id_insertado'");
                        $query2->execute();
                    } else {    
                        $error=$error.' - Ha ocurrido un error, al adjuntar el archivo';
                    }
                    closedir($dir); //Cerramos el directorio de destino
                }
            }else{
                $query2 = $conexion->prepare("UPDATE institucion SET base_datos = '".$basedatos."', espacio = '".$directorio_cliente."' WHERE institucion.id='$id_insertado'");
                $query2->execute();
            }    
            if($error==""){
                $respuesta = ['success', 'registro guardado'];
            }else{
                $respuesta = ['error', $error];
            }
            echo json_encode($respuesta);
 
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