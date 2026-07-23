<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";
$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;

switch($method){
    case 'GET':
        if(isset($_GET['area']) && isset($_GET['idElemento'])){
            $area = $_GET['area'];
            $idElemento = $_GET['idElemento'];
            if($area=='Clase'){
                $sql="SELECT * FROM clase WHERE id=$idElemento";
            }
            if($area=='Actividad'){
                $sql="SELECT * FROM trabajo WHERE id=$idElemento";
            }
            if($area=='Cuestionario'){
                $sql="SELECT * FROM formulario WHERE id=$idElemento";
            }
            if($area=='Material'){
                $sql="SELECT m.*, mc.nombre as nombre_mostrar FROM material_clase as mc, material as m WHERE mc.id_material=m.id AND m.id=$idElemento";
            }
            if($nueva_consulta = $conexion->prepare($sql)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows == 1) {
                    echo json_encode(['informacion' => $resultado->fetch_assoc()]);
                }else{
                    echo json_encode(['error' => 'No se encontró el elemento']);
                }
            }else{
                echo json_encode(['error' => 'No se pudo realizar la consulta']);
            }
            $nueva_consulta->close();
        }
    break;

    case 'POST': 
        if(isset($dataObject->modo)){
            $modo = $dataObject->modo;
            //si es modo json
            if($modo=='buscarActividadesEspacioCurso'){
                $error='';
                $id_curso = $dataObject->id_curso;
                //esta consulta solo busca las actividades relacionadas con un curso
                $sql="SELECT t.*, tc.id_clase, tc.id as id_trabajo_clase FROM trabajo as t LEFT JOIN trabajo_clase as tc on t.id=tc.id_trabajo where t.id_curso=".$id_curso;                
                //esta consulta busca actividades relacionadas con un espacio: es decir si hay actividades relacionadas al espacio sin importar el curso que se utilizaron anteriormente se obtendran
                //primero busca el espacio del curo pasado
                $sql_espacio="SELECT espacio FROM curso where id='$id_curso'";
                $nueva_consulta1 = $conexion->prepare($sql_espacio);
                $nueva_consulta1->execute();
                $resultado1 = $nueva_consulta1->get_result();
                $datos_curso=$resultado1->fetch_assoc();
                $id_espacio=$datos_curso['espacio'];
                //busca actividades "trabajos" relacionadas al espacio
                //$sql="SELECT t.*, tc.id_clase, tc.id AS id_trabajo_clase
                //        FROM trabajo AS t
                //        LEFT JOIN trabajo_clase AS tc ON t.id = tc.id_trabajo
                //        LEFT JOIN curso AS c ON t.id_curso = c.id
                //        WHERE c.espacio = '$id_espacio'";
                if($nueva_consulta = $conexion->prepare($sql)) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows >= 1) {
                        $trabajos=$resultado->fetch_all(MYSQLI_ASSOC);
                    }else{
                        $trabajos=[];
                    }
                }else{
                    $error="No se pudo realizar la query trabajos";
                }

                //busca actividades "cuestionarios" relacionadas al espacio
                $sql_formularios="SELECT f.*, fc.id_clase, fc.id as id_formulario_clase FROM formulario AS f
                        LEFT JOIN formulario_clase AS fc ON f.id = fc.id_formulario
                        LEFT JOIN curso AS c ON f.curso_id = c.id
                        WHERE c.espacio = '$id_espacio'";

                if($nueva_consulta2 = $conexion->prepare($sql_formularios)) {
                    $nueva_consulta2->execute();
                    $resultado2 = $nueva_consulta2->get_result();
                    if ($resultado2->num_rows >= 1) {
                        $cuestionarios=$resultado2->fetch_all(MYSQLI_ASSOC);
                    }else{
                        $cuestionarios=[$sql_formularios];
                    }
                }else{
                    $error="No se pudo realizar la query cuestionarios";
                }
                //control de error
                if($error==''){
                    echo json_encode(['trabajos'=>$trabajos, 'cuestionarios'=>$cuestionarios]);
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => $error));
                }
            }
            if($modo=='buscarMaterialUsuario'){
                $id_usuario = $dataObject->id_usuario;
                $id_clase = $dataObject->id_clase;
                $sql="SELECT m.* FROM material as m WHERE m.id not in (select mc.id_material from material_clase as mc where mc.id_clase=".$id_clase.") and m.creado_por=".$id_usuario;
            }
            if($modo=='buscarMaterialClase'){
                $id_clase = $dataObject->id_clase;
                $sql="SELECT mc.*, m.nombre_archivo, m.tipo, m.extension, m.link FROM material_clase as mc, material as m WHERE mc.id_material=m.id and mc.id_clase=".$id_clase;
            }
            if($modo=='buscarClases'){ //Clases.js
                $id_curso= $dataObject->id_curso;
                $id_curso_grupo= $dataObject->id_curso_grupo;
                $id_usuario = isset($dataObject->id_usuario) ? $dataObject->id_usuario : 0;
                $sql="SELECT cl.id, cl.id_curso_grupo,cl.titulo_corto, cl.tema, cl.imagen_arriba,cl.presentacion, cl.desarrollo,cl.cierre,cl.imagen_abajo, cl.textoFinal,cl.mostrar_videos,cl.fecha,cg.id_curso, e.id as espacio FROM clase as cl, curso_grupo as cg, curso as c, espacio as e WHERE e.id=c.espacio and c.id=cg.id_curso and cg.id=cl.id_curso_grupo and cl.id_curso_grupo=".$id_curso_grupo;
                
                if($nueva_consulta = $conexion->prepare($sql)) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    $clases = $resultado->fetch_all(MYSQLI_ASSOC);
                    $nueva_consulta->close();

                    if (!empty($clases)) {
                        // 1. Obtener todos los materiales para estas clases
                        $materiales = [];
                        $sql_mat = "SELECT mc.*, m.nombre_archivo, m.tipo, m.extension, m.link 
                                    FROM material_clase as mc, material as m 
                                    WHERE mc.id_material=m.id 
                                      AND mc.id_clase IN (SELECT id FROM clase WHERE id_curso_grupo = ?)";
                        if ($stmt_mat = $conexion->prepare($sql_mat)) {
                            $stmt_mat->bind_param("i", $id_curso_grupo);
                            $stmt_mat->execute();
                            $res_mat = $stmt_mat->get_result();
                            $materiales = $res_mat->fetch_all(MYSQLI_ASSOC);
                            $stmt_mat->close();
                        }

                        // 2. Obtener trabajos para estas clases
                        $trabajos = [];
                        $sql_trab = "SELECT t.*, tc.id_clase, tc.id as id_trabajo_clase 
                                     FROM trabajo as t 
                                     JOIN trabajo_clase as tc on t.id=tc.id_trabajo 
                                     WHERE tc.id_clase IN (SELECT id FROM clase WHERE id_curso_grupo = ?)";
                        if ($stmt_trab = $conexion->prepare($sql_trab)) {
                            $stmt_trab->bind_param("i", $id_curso_grupo);
                            $stmt_trab->execute();
                            $res_trab = $stmt_trab->get_result();
                            $trabajos = $res_trab->fetch_all(MYSQLI_ASSOC);
                            $stmt_trab->close();
                        }

                        // 3. Obtener cuestionarios para estas clases
                        $cuestionarios = [];
                        $sql_cuest = "SELECT f.*, fc.id_clase, fc.id as id_formulario_clase,
                                          COUNT(fru.id) as intentos,
                                          MAX(fru.ratio_respuesta) as mejor_acierto
                                      FROM formulario AS f 
                                      JOIN formulario_clase AS fc ON f.id = fc.id_formulario 
                                      LEFT JOIN formulario_respuestas_usuario AS fru ON fru.formulario_id = f.id AND fru.usuario_id = ?
                                      WHERE fc.id_clase IN (SELECT id FROM clase WHERE id_curso_grupo = ?)
                                      GROUP BY f.id, fc.id_clase, fc.id";
                        if ($stmt_cuest = $conexion->prepare($sql_cuest)) {
                            $stmt_cuest->bind_param("ii", $id_usuario, $id_curso_grupo);
                            $stmt_cuest->execute();
                            $res_cuest = $stmt_cuest->get_result();
                            $cuestionarios = $res_cuest->fetch_all(MYSQLI_ASSOC);
                            $stmt_cuest->close();
                        }

                        // Agrupar e inyectar en las clases
                        foreach ($clases as &$clase) {
                            $clase['materiales'] = array_values(array_filter($materiales, function($m) use ($clase) {
                                return $m['id_clase'] == $clase['id'];
                            }));
                            $clase['trabajos'] = array_values(array_filter($trabajos, function($t) use ($clase) {
                                return $t['id_clase'] == $clase['id'];
                            }));
                            $clase['cuestionarios'] = array_values(array_filter($cuestionarios, function($c) use ($clase) {
                                return $c['id_clase'] == $clase['id'];
                            }));
                        }
                        unset($clase); // romper referencia
                    }

                    echo json_encode($clases);
                } else {
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query de clases'));
                }
                exit;
            }
            if ($modo<>'buscarActividadesEspacioCurso'){
                if($nueva_consulta = $conexion->prepare($sql)) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows >= 1) {
                        if (($resultado->num_rows == 1) and (($modo=='buscarCursoUsuario') or ($modo=='buscarCursoPlanificacion') )){
                            echo json_encode($resultado->fetch_assoc());
                        }else{
                            echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
                        }
                    }else {
                        echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
                }
                $nueva_consulta->close();
            }
        }else{
            $respuesta = ['error', 'No se ejecuto consulta'];
            if($_POST['nuevo']=='SI'){  //crear nueva clase
                //tomo las variables pasadas por post
                $id_curso = $_POST['id_curso'];
                $id_curso_grupo = $_POST['id_curso_grupo'];
                $titulo_corto=$_POST['titulo_corto'];
                $tema=$_POST['tema']; 
                $presentacion=$_POST['presentacion'];              
                $desarrollo=$_POST['desarrollo'];              
                $cierre=$_POST['cierre'];              
                $usuario=$_POST['creado_por'];

                $fechaHora=date('Y-m-d H:i:s'); 
                    
                $sql2="INSERT INTO clase (id_curso, id_curso_grupo, titulo_corto, tema, presentacion, desarrollo, cierre, fecha, creado_por) VALUES ('$id_curso','$id_curso_grupo','$titulo_corto','$tema','$presentacion','$desarrollo','$cierre','$fechaHora','$usuario')";
                $msg='Se creo la clase';
                $error='No se pudo crear la clase';
                $tabla='Clase';
                //registro la actividad para el muro
                $sql_registro_actividad="INSERT INTO registro_actividad 
                (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
                VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', ?)";

            }

            //actualizar clase
            if($_POST['nuevo']=='NO'){
                $id= $_POST['id'];
                $id_curso = $_POST['id_curso'];
                $id_curso_grupo = $_POST['id_curso_grupo'];
                $titulo_corto=$_POST['titulo_corto'];
                $tema=$_POST['tema']; 
                $presentacion=$_POST['presentacion'];   
                $desarrollo=$_POST['desarrollo'];              
                $cierre=$_POST['cierre'];                      
                $usuario=$_POST['creado_por'];

                $fechaHora=date('Y-m-d H:i:s'); 
                                
                $sql2="UPDATE clase SET id_curso='$id_curso', titulo_corto= '$titulo_corto', tema='$tema', presentacion='$presentacion', desarrollo='$desarrollo', cierre='$cierre', fecha='$fechaHora',creado_por='$usuario' WHERE id='$id'";
                $msg='Se actualizo la clase ';
                $error='No se pudo actualizar la clase';
                $tabla='Clase';
                
                //registro la actividad para el muro
                $sql_registro_actividad="INSERT INTO registro_actividad 
                (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
                VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', $id)";

            }
            
            if($_POST['nuevo']=='MaterialPoner'){
                $tipo = $_POST['tipo']; 
                $id_clase=$_POST['id_clase'];
                $fechaHora=date('Y-m-d H:i:s'); 
								$tabla='Material';
 								//obtener el id_curso_grupo y el titulo de la clase a partir del id_clase
                if ($nueva_consulta = $conexion->prepare($sqlAux="SELECT id_curso_grupo, tema, creado_por FROM clase WHERE id=$id_clase")) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows == 1) {
                        $clase=$resultado->fetch_assoc();
												$id_curso_grupo=$clase['id_curso_grupo'];
												$tema_clase=$clase['tema'];
												$usuario=$clase['creado_por'];
                    }else{
                        echo json_encode(['error', 'error con los resultados al obtener el grupo clase']);
                        exit;
                    }
                }else{
                    echo json_encode(['error', 'no sepuede obtener el grupo clase']);
                    exit;
                }

                //si es material del repositorio
                if($tipo=='repositorio'){
                    $id_material = $_POST['id_material']; 
                    $nombre = $_POST['nombre']; 
                    $sql2="INSERT INTO material_clase(id_material, id_clase, nombre, ubicacion, fecha_creado) VALUES ('$id_material','$id_clase','$nombre','0','$fechaHora')";

                    $msg="Se Agrego material a la clase (#".$id_clase.") Tema:".$tema_clase;
                    $error='No se pudo agregar el material'.$sql2;
                    //registro la actividad para el muro
                    $sql_registro_actividad="INSERT INTO registro_actividad 
                    (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
                    VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', $id_material)";
                }
                //si es subir un enlace
                if($tipo=='enlace'){
                    $link = $_POST['link']; 
                    $nombre = $_POST['nombre']; 
                    $usuario = $_POST['usuario']; 
                    //primero inserto en la tabla material
                    $sql1="INSERT INTO material (nombre_archivo, tipo, extension, link, creado_por, creado_f) VALUES ('$nombre','vinculo','','$link','$usuario',' $fechaHora')";
                    if(mysqli_query($conexion, $sql1)){
                        $id_material=mysqli_insert_id($conexion);
                        $sql2="INSERT INTO material_clase(id_material, id_clase, nombre, ubicacion, fecha_creado) VALUES ('$id_material','$id_clase','$nombre','0','$fechaHora')";

                        $msg="Se Agrego el material al repositorio y a la clase(#".$id_clase.") Tema:".$tema_clase;
                        $error='No se pudo agregar el material'.$sql2;

                   			//registro la actividad para el muro
                    		$sql_registro_actividad="INSERT INTO registro_actividad 
                        (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
                        VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', $id_material)";

                    }else{
                        $respuesta = ['error', 'No se pudo subir el enlace a materiale'];
                        echo json_encode($respuesta);
                        break;
                    }
                }
                //si es archivo
                if($tipo=='dispositivo'){
                    $sql2="";
                    $nombre = $_POST['nombre']; 
                    $usuario = $_POST['usuario']; 

                    $cantidad=count($_FILES);
                    for($i=0; $i<$cantidad; $i++){
                        //Validamos que el archivo exista
                        if($_FILES["file".$i]["name"]) {
                            $file_parts =explode(".", $_FILES["file".$i]["name"]);
                            $extension = end($file_parts);
                    
                            //primero inserto en la tabla material pero sin datos del link
                            $sql1="INSERT INTO material (nombre_archivo, tipo, extension, link, creado_por, creado_f) VALUES ('$nombre','archivo','$extension','','$usuario',' $fechaHora')";
                            if(mysqli_query($conexion, $sql1)){
                                //inserto en material y tomo el id autogenerado para el nombre del link
                                $id_material=mysqli_insert_id($conexion);

                                $link="material_id_".$id_material.".".$extension;
                                $directorio = 'materialcursos'; //Declaramos un  variable con la ruta donde guardaremos los archivos
                                //Validamos si la ruta de destino existe, en caso de no existir la creamos
                                if(!file_exists($directorio)){
                                    mkdir($directorio, 0777) or die("No se puede crear el directorio de extracci&oacute;n");    
                                }
                                $dir=opendir($directorio); //Abrimos el directorio de destino
                                $target_path = $directorio.'/'.$link; //Indicamos la ruta de destino, así como el nombre del archivo
    
                                if (move_uploaded_file($_FILES["file".$i]["tmp_name"], $target_path)) {
                                    // si subio bien actualizo el nombre del link
                                    $q2="update material set link='".$link."' where id=".$id_material;	
                                    //$r2=mysqli_query($conexion,$q2);
                                    if(mysqli_query($conexion,$q2)){
                                        //$respuesta = ['success',  $msg];
                                        //inserto el material el material_clase
                                        $sql2="INSERT INTO material_clase(id_material, id_clase, nombre, ubicacion, fecha_creado) VALUES ('$id_material','$id_clase','$nombre','0','$fechaHora')";

                                        $msg="Se Agrego el material al repositorio y a la clase(#".$id_clase.") tema:".$tema_clase;
                                        $error='No se pudo agregar el material'.$sql2;
																				
																				//registro la actividad para el muro
                    										$sql_registro_actividad="INSERT INTO registro_actividad 
                                        (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
                                        VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', ' $link', $id_material)";
                                    }else{
                                        echo $q2;
                                        $error='No se pudo agregar el material'.$sql2;
                                        $respuesta = ['error', $error];
                                        break;
                                    }
                                } else {	
                                    // si dio error al subir elimino el registro
                                    $q3="delete from material where id_material=".$id_material;	
                                    $r3=mysqli_query($conexion,$q3);			
                                    $respuesta = ['error', 'No se pudo subir el material'];
                                    echo json_encode($respuesta);
                                    break;
                                }
                            }else{
                                $respuesta = ['error', 'No se pudo subir el enlace a materiales'];
                                echo json_encode($respuesta);
                                break;
                            }
                            closedir($dir); //Cerramos el directorio de destino
                        }
                    }
                }

            }
            if($_POST['nuevo']=='ActividadPoner'){
                isset($_POST['link']) ? $link=$_POST['link'] : $link='';
                $id_trabajo= $_POST['id_trabajo']; 
                $id_clase= $_POST['id_clase'];
                $id_usuario= $_POST['id_usuario']; 
                $fechaHora=date('Y-m-d H:i:s');
                $fecha=date('Y-m-d');
								$tabla='Actividad';

								//obtener el datos de la clase como id_curso_grupo y el titulo de la clase a partir del id_clase
                if ($nueva_consulta = $conexion->prepare($sqlAux="SELECT id_curso_grupo, tema, creado_por FROM clase WHERE id=$id_clase")) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows == 1) {
                        $clase=$resultado->fetch_assoc();
												$id_curso_grupo=$clase['id_curso_grupo'];
												$tema_clase=$clase['tema'];
												$usuario=$clase['creado_por'];
                    }else{
                        echo json_encode(['error', 'error con los resultados al obtener el grupo clase']);
                        exit;
                    }
                }else{
                    echo json_encode(['error', 'no sepuede obtener el grupo clase']);
                    exit;
                }
								//insertar la actividad que asocia la actividad a la clase
                $sql2="INSERT INTO trabajo_clase (id_trabajo, id_clase, id_usuario, fecha_fijacion)values('$id_trabajo','$id_clase','$id_usuario','$fechaHora')";
                $msg="Se Agrego la actividad a la clase(#".$id_clase.") Tema:".$tema_clase;
                $error='No se pudo agregar la actividad:'.$sql2;
                //cuando fijamos la actividad a la clase registramos en agenda la fecha de entrega de la actividad para que se muestre en el calendario del alumno
                //obtener datos de la acividad como la fecha de entrega para registrar en el calendario
                if ($nueva_consulta = $conexion->prepare($sqlAux="SELECT fecha_entrega FROM trabajo WHERE id=$id_trabajo")) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows == 1) {
                        $trabajo=$resultado->fetch_assoc();
                        $fecha_entrega=$trabajo['fecha_entrega'];
                    }else{
                        echo json_encode(['error', 'error con los resultados al obtener la fecha de entrega de la actividad']);
                        exit;
                    }
                }else{
                    echo json_encode(['error', 'no sepuede obtener la fecha de entrega de la actividad']);
                    exit;
                }
                //inserto en agenda la fecha de entrega de la actividad para que se muestre en el calendario del alumno
                $sql_agenda="INSERT INTO calendario(evento, fecha_creado, hora_desde, hora_hasta, id_curso_grupo, tipo_recordatorio, creada_por, fecha) 
                              VALUES ('Entrega actividad clase: ".$tema_clase."','".$fechaHora."','07:00:00','23:59:00','$id_curso_grupo','todosDETC','$id_usuario','$fecha_entrega')";
                mysqli_query($conexion, $sql_agenda);
                //echo $sql_agenda; 
				//registro la actividad para el muro
                $sql_registro_actividad="INSERT INTO registro_actividad 
                (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
                VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', ' $link', $id_trabajo)";
            }
            if($_POST['nuevo']=='CuestionarioPoner'){
                isset($_POST['link']) ? $link=$_POST['link'] : $link='';
                $id_trabajo= $_POST['id_trabajo']; 
                $id_clase= $_POST['id_clase'];
                $id_usuario= $_POST['id_usuario']; 
                $fechaHora=date('Y-m-d H:i:s');
								$tabla='Cuestionario';

								//obtener el datos de la clase como id_curso_grupo y el titulo de la clase a partir del id_clase
                if ($nueva_consulta = $conexion->prepare($sqlAux="SELECT id_curso_grupo, tema, creado_por FROM clase WHERE id=$id_clase")) {
                    $nueva_consulta->execute();
                    $resultado = $nueva_consulta->get_result();
                    if ($resultado->num_rows == 1) {
                        $clase=$resultado->fetch_assoc();
												$id_curso_grupo=$clase['id_curso_grupo'];
												$tema_clase=$clase['tema'];
												$usuario=$clase['creado_por'];
                    }else{
                        echo json_encode(['error', 'error con los resultados al obtener el grupo clase']);
                        exit;
                    }
                }else{
                    echo json_encode(['error', 'no sepuede obtener el grupo clase']);
                    exit;
                }

                $sql2="INSERT INTO formulario_clase (id_formulario, id_clase, id_usuario, fecha_fijacion)values('$id_trabajo','$id_clase','$id_usuario','$fechaHora')";
                $msg="Se Agrego el cuestionario a la clase(#".$id_clase.") tema:".$tema_clase;
                $error='No se pudo agregar el cuestionario:'.$sql2;
								
								//registro la actividad para el muro
                $sql_registro_actividad="INSERT INTO registro_actividad 
                (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
                VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', ' $link', $id_trabajo)";

            }
            // luego de todos los condicionales ejecuta el query $sql2 y luego inserta en registro
            if(mysqli_query($conexion, $sql2)){
                $respuesta = ['success',  $msg];
                //ejecutar la consulta de registro de actividad para el muro
                if ($stmt = $conexion->prepare($sql_registro_actividad)){
                  if($_POST['nuevo']=='SI'){  //si se creao nueva clase
                    //obtengo el id insertado
                    $idInsertado = mysqli_insert_id($conexion);
                    $stmt->bind_param("i", $idInsertado);
                  }
                  //ejecuto la consulta de registro de actividad para  el muro
                   $stmt->execute();
                }else{
                    $respuesta = ['error', 'No se pudo registrar la actividad en el muro'.$sql_registro_actividad];
                }
            }else{
                $respuesta = ['error', $error];
            }
            echo json_encode($respuesta);
            exit;
        }    
        break;

   case 'PUT':
        break;

    case 'DELETE';
    if(!isset($dataObject->id)){
        $respuesta= ['error','El ID no debe estar vacío'];
    }else{
        $id = $dataObject->id;
				$fechaHora=date('Y-m-d H:i:s');
        if(isset($dataObject->tabla)){
          $tabla = $dataObject->tabla;
          //eliminar segun id y tabla puede ser trabajo_clase o material_clase o cuestionario_clase
					$sql_delete= "DELETE FROM ".$tabla." where id='$id'";
					//elimino trabajo asociado a la clase
          if($tabla=="trabajo_clase"){
						//obtener el datos de la clase como id_curso_grupo y el titulo de la clase a partir del id_clase
            if ($nueva_consulta = $conexion->prepare("SELECT cl.id_curso_grupo, cl.tema, cl.creado_por, cl.id FROM trabajo_clase as tc, clase as cl WHERE tc.id_clase=cl.id and tc.id=$id")){
              $nueva_consulta->execute();
              $resultado = $nueva_consulta->get_result();
              if ($resultado->num_rows == 1) {
                $clase=$resultado->fetch_assoc();
								$id_curso_grupo=$clase['id_curso_grupo'];
								$tema_clase=$clase['tema'];
								$usuario=$clase['creado_por'];
								$id_clase=$clase['id'];

              }else{
                echo json_encode(['error', 'error con los resultados al obtener el grupo clase']);
                exit;
              }
            }else{
              echo json_encode(['error', 'no sepuede obtener el grupo clase']);
              exit;
            }
						$tabla="Eliminar-trabajo";
						$msg="Actividad quitada de la clase(#".$id_clase.") Tema:".$tema_clase;
						
						//registro la actividad para el muro
          	$sql_registro_actividad="INSERT INTO registro_actividad 
            (`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
            VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', 0)";
					}
  				//elimino material asociado a la clase
					if($tabla=="material_clase"){
						  //obtener el datos de la clase como id_curso_grupo y el titulo de la clase a partir del id_clase
							if ($nueva_consulta = $conexion->prepare("SELECT cl.id_curso_grupo, cl.tema, cl.creado_por, cl.id FROM material_clase as mc, clase as cl WHERE mc.id_clase=cl.id and mc.id=$id")){
								$nueva_consulta->execute();
								$resultado = $nueva_consulta->get_result();
								if ($resultado->num_rows == 1) {
									$clase=$resultado->fetch_assoc();
									$id_curso_grupo=$clase['id_curso_grupo'];
									$tema_clase=$clase['tema'];
									$usuario=$clase['creado_por'];
									$id_clase=$clase['id'];
								}else{
									echo json_encode(['error', 'error con los resultados al obtener el grupo clase']);
									exit;
								}
							}else{
								echo json_encode(['error', 'no sepuede obtener el grupo clase']);
								exit;
							}
							$tabla="Eliminar-Material";
							$msg="Material quitado de la clase(#".$id_clase.") Tema:".$tema_clase;
							
							//registro la actividad para el muro
							$sql_registro_actividad="INSERT INTO registro_actividad 
							(`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
							VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', 0)";
					}
					if($tabla=="formulario_clase"){
							//obtener el datos de la clase como id_curso_grupo y el titulo de la clase a partir del id_clase
							if ($nueva_consulta = $conexion->prepare("SELECT cl.id_curso_grupo, cl.tema, f.titulo, f.descripcion, cl.creado_por, cl.id FROM formulario_clase as fc, clase as cl, formulario as f WHERE f.id=fc.id_formulario and fc.id_clase=cl.id and fc.id=$id")){
								$nueva_consulta->execute();
								$resultado = $nueva_consulta->get_result();
								if ($resultado->num_rows == 1) {
									$cuestionario=$resultado->fetch_assoc();
									$id_curso_grupo=$cuestionario['id_curso_grupo'];
									$tema_clase=$cuestionario['tema'];
									$usuario=$cuestionario['creado_por'];
									$id_clase=$cuestionario['id'];
								}else{
									echo json_encode(['error', 'error con los resultados al obtener el grupo clase']);
									exit;
								}
							}else{
								echo json_encode(['error', 'no sepuede obtener el grupo clase']);
								exit;
							}
							$tabla="Eliminar-Cuestionario";
							$msg="Cuestionario quitado de la clase(#".$id_clase.") Tema:".$tema_clase;
							
							//registro la actividad para el muro
							$sql_registro_actividad="INSERT INTO registro_actividad 
							(`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
							VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', 0)";
						}
					}else{
							//eliminar una clase
							//obtener el datos de la clase como id_curso_grupo y el titulo de la clase a partir del id_clase
							if ($nueva_consulta = $conexion->prepare($sqlAux="SELECT id_curso_grupo, tema, creado_por FROM clase WHERE id=$id")) {
								$nueva_consulta->execute();
								$resultado = $nueva_consulta->get_result();
								if ($resultado->num_rows == 1) {
									$clase=$resultado->fetch_assoc();
									$id_curso_grupo=$clase['id_curso_grupo'];
									$tema_clase=$clase['tema'];
									$usuario=$clase['creado_por'];
								}else{
									echo json_encode(['error', 'error con los resultados al obtener el grupo clase']);
									exit;
								}
							}else{
								echo json_encode(['error', 'no sepuede obtener el grupo clase']);
								exit;
							}
							$tabla="Eliminar-Clase";
							$sql_delete= "DELETE FROM Clase where id='$id'";
							$msg="Se elimino la Clase (#".$id.") Tema:".$tema_clase;
													
							//registro la actividad para el muro
							$sql_registro_actividad="INSERT INTO registro_actividad 
							(`id_curso_grupo`, `area`, `detalle`, `fecha`, `creado_por`, `nivel`, `link`, `idElemento`) 
							VALUES ($id_curso_grupo, '$tabla', '$msg', '$fechaHora', '$usuario', 'docente', '', 0)";
        }
        if ($nueva_consulta = $conexion->prepare($sql_delete)) {
            $nueva_consulta->execute();
						//si se  quita una clase completa
 						if(!isset($dataObject->tabla)){
							//eliminar las apariciones en trabajo_clase
							if ($nueva_consulta = $conexion->prepare("DELETE FROM trabajo_clase where id_clase='$id")) {
    	        	$nueva_consulta->execute();
							}
							//eliminar las apariciones en material_clase
							if ($nueva_consulta = $conexion->prepare("DELETE FROM material_clase where id_clase='$id")) {
            		$nueva_consulta->execute();
							}
						}
						//ejecutar la consulta de registro de actividad para el muro
						if ($stmt = $conexion->prepare($sql_registro_actividad)){
							//ejecuto la consulta de registro de actividad para  el muro
							$stmt->execute();
						}
            $respuesta = ['success',$msg];
        }else{
            $respuesta = ['error','fallo la eliminación'];
        }        
    }
    echo json_encode($respuesta);
    break;
}
$conexion->close();
?>           
           