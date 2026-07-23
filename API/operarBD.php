
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
    case 'POST': 
        //alta de dato
        $operacion = $dataObject-> operacion;                
        if($operacion ==='consultar'){
            $buscar = $dataObject-> buscar;
            $tabla = $dataObject-> tabla;
                    
            if ($nueva_consulta = $conexion->prepare("SELECT * FROM {$tabla} WHERE (apellido like '%{$buscar}%') or (nombre like '%{$buscar}%') or (dni like '%{$buscar}%')")) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows >= 1) {
                    $datos = $resultado->fetch_assoc();
                    echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
                }else {
                    echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
                }
                $nueva_consulta->close();
            }else{
               
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo conectar a BD'));
            }
           
        }
        else if($operacion ==='crear'){
            $nombre = $dataObject-> nombre;
            $apellido = $dataObject-> apellido;
            $documento = $dataObject-> documento;
            $nacimiento = $dataObject-> nacimiento;
            $correo = $dataObject-> correo;
            $telefono = $dataObject-> telefono;
            
            if ($buscar_si_esta = $conexion->prepare("SELECT * FROM estudiantes WHERE dni= {$documento}")) {
                $buscar_si_esta->execute();
                $resultado = $buscar_si_esta->get_result();
                if ($resultado->num_rows >= 1) {
                    $respuesta = ['error','Ya existe estudiante con el mismo numero de documento'];
                    echo json_encode($resultado);
                }else {
                    if ($nueva_consulta = $conexion->prepare("INSERT INTO estudiantes (id, nombre, apellido, dni, fecnac, correo, telefono) values('$documento', '$nombre', '$apellido', '$documento', '$nacimiento', '$correo', '$telefono')")) {
                        $nueva_consulta->execute();
                        $respuesta = ['success','Estudiante guardado'];
                        echo json_encode($respuesta);
                    }else{
                        $q="INSERT INTO estudiantes (id, nombre, apellido, dni, fecnac, correo, telefono) values('$documento', '$nombre', '$apellido', '$documento', '$nacimiento', '$correo', '$telefono')";
                        $respuesta = ['error','fallo la inserción'.$q];
                        echo json_encode($respuesta);
                    }    
                }
            }else{
                $respuesta = ['error','fallo la busqueda'];
                echo json_encode($respuesta);
            }    
        }
    break;

    case 'PUT':
        if(!isset($dataObject->id) || is_null($dataObject->id) || empty(trim($dataObject->id))){
            $respuesta= ['error','El ID no debe estar vacío'];
        }
        else if(!isset($dataObject->nombre) || is_null($dataObject->nombre) || empty(trim($dataObject->nombre)) || strlen($dataObject->nombre) > 80){
            $respuesta= ['error','El nombre no debe estar vacío y no debe de tener más de 80 caracteres'];
        }
        else if(!isset($dataObject->apellido) || is_null($dataObject->apellido) || empty(trim($dataObject->apellido)) || strlen($dataObject->apellido) > 80){
            $respuesta= ['error','El apellido no debe estar vacío y no debe de tener más de 80 caracteres'];
        }
        else if(!isset($dataObject->documento) || is_null($dataObject->documento) || empty(trim($dataObject->documento)) || !is_numeric($dataObject->documento) || strlen($dataObject->documento) > 10){
            $respuesta= ['error','El numero de documento no debe estar vacío , debe ser de tipo numérico y no tener más de 10 caracteres'];
        }
        else{
            $id = $dataObject->id;
            $nombre = $dataObject-> nombre;
            $apellido = $dataObject-> apellido;
            $documento = $dataObject-> documento;
            $nacimiento = $dataObject-> nacimiento;
            $correo = $dataObject-> correo;
            $telefono = $dataObject-> telefono;

            if ($nueva_consulta = $conexion->prepare("UPDATE estudiantes SET nombre='$nombre', apellido='$apellido', dni='$documento', fecnac='$nacimiento', correo='$correo', telefono='$telefono' where id='$id' ")) {
                $nueva_consulta->execute();
               $respuesta = ['success','Estudiante actualizado'];
            }else{
                $respuesta = ['error','fallo la actualización'];
            }
        }
        echo json_encode($respuesta);
    break;

    case 'DELETE';
        
        if(!isset($dataObject->id) || is_null($dataObject->id) || empty(trim($dataObject->id))){
            $respuesta= ['error','El ID no debe estar vacío'];
        }
        else{
            $id = $dataObject->id;
            
            if ($nueva_consulta = $conexion->prepare("DELETE FROM estudiantes where id='$id' ")) {
                $nueva_consulta->execute();
               $respuesta = ['success','Estudiante eliminado'];
            }else{
                $respuesta = ['error','fallo la eliminación'];
            }
            
        }
        echo json_encode($respuesta);
    break;
}
$conexion->close();
?>