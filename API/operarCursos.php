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
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;
 
switch($method){
    case 'GET':
			if(isset($_GET['curso'])){
				$id=$_GET['curso'];
			  //si existe la variable modo la analiso
				if(isset($_GET['modo'])){
          $modo=$_GET['modo'];
			    //si busco los docentes del curso 
          if($modo=='docentesCurso'){ 
            $sql_docentes="SELECT 
                    ed.id, 
                    u.id AS id_usuario, 
                    u.nombre, 
                    u.apellido,
                    ed.funcion
                  FROM curso_equipo_docente ed
                  INNER JOIN usuarios u ON ed.id_usuario = u.id
                  WHERE ed.id_curso_grupo = $id
                    AND ed.estado <> 'Baja'
                    AND ed.estado <> 'licencia'
                    ORDER BY ed.id ASC";
            if ($nueva_consulta = $conexion->prepare($sql_docentes)) {
              $nueva_consulta->execute();
              $resultado = $nueva_consulta->get_result();
              if ($resultado->num_rows >= 1) {
                  echo json_encode(['resultado'=>true, 'docentes'=>$resultado->fetch_all(MYSQLI_ASSOC)]);
              }else {
                  echo json_encode(array('resultado'=>true, 'docentes' => []));
              }
            }else{
              echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
            }
            $conexion->close();
          }
          //si modo es obtener informacion del Muro
          if($modo=='informacionMuro'){  
            $sql_docentes="";
            if ($nueva_consulta = $conexion->prepare($sql_docentes)) {
              $nueva_consulta->execute();
              $resultado = $nueva_consulta->get_result();
              if ($resultado->num_rows >= 1) {
                  echo json_encode(['resultado'=>true, 'clases'=>$muro]);
              }else {
                  echo json_encode(array('resultado'=>true, 'docentes' => []));
              }
            }else{
              echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
            }
            $conexion->close();
          }
				}else{
			    // si no ha var modo: busco cursos
					$sql="SELECT ic.* FROM instancia_calificacion as ic, cohorte as co, curso as c where c.id_cohorte= co.id and co.id = ic.id_cohorte and c.id=".$id;
					if ($nueva_consulta = $conexion->prepare($sql)) {
						$nueva_consulta->execute();
						$resultado = $nueva_consulta->get_result();
						if ($resultado->num_rows >= 1) {
								echo json_encode(['resultado'=>true, 'instancias'=>$resultado->fetch_all(MYSQLI_ASSOC)]);
						}else {
								echo json_encode(array('resultado'=>false, 'error' => 'No Existen resultados.'));
						}
					}else{
						echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
					}
					$conexion->close();
				}	
			}else{
        // si existe la variable codigo
				if(isset($_GET['codigo'])){ //busca curso_grupo a partir de codigo
					$codigo=$_GET['codigo'];
					$sql="SELECT c.*, cg.id as id_curso_grupo , cg.seccion, cg.denominacion, cg.fecha_inicio, cg.fecha_fin, co.año as cohorte, co.fecha_inicio as fecha_inicio_cohorte, co.fecha_cierre as fecha_cierre_cohorte, e.orden, e.id_formacion, f.nombre_formacion, cg.codigo_inscripcion FROM curso as c, espacio as e, formacion as f, cohorte as co, curso_grupo as cg where cg.id_curso= c.id and c.id_cohorte= co.id and f.id=e.id_formacion and c.espacio=e.id and cg.codigo_inscripcion='$codigo' order by e.orden, c.nombre, cg.denominacion";
					if ($nueva_consulta = $conexion->prepare($sql)) {
						$nueva_consulta->execute();
						$resultado = $nueva_consulta->get_result();
						if ($resultado->num_rows == 1) {
								echo json_encode(['resultado'=>true, 'curso'=>$resultado->fetch_assoc()]);
						}else {
								echo json_encode(array('resultado'=>false, 'error' => 'Existen mas de un resultados.'));
						}
					}else{
						echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
					}
					$conexion->close();
				}else{
					//$sql="SELECT c.id, co.año as cohorte, e.orden, e.id_formacion, f.nombre_formacion FROM curso as c, espacio as e, formacion as f, cohorte as co where c.id_cohorte= co.id and f.id=e.id_formacion and c.espacio=e.id group by e.orden, co.año";
					//$sql="SELECT c.*, cg.id as id_curso_grupo , cg.seccion, cg.denominacion, cg.fecha_inicio, cg.fecha_fin, co.año as cohorte, co.fecha_inicio as fecha_inicio_cohorte, co.fecha_cierre as fecha_cierre_cohorte, e.orden, e.id_formacion, f.nombre_formacion, cg.codigo_inscripcion FROM curso as c, espacio as e, formacion as f, cohorte as co, curso_grupo as cg where cg.id_curso= c.id and c.id_cohorte= co.id and f.id=e.id_formacion and c.espacio=e.id order by e.orden, c.nombre, cg.denominacion";
					//$sql="SELECT c.*, cg.id as id_curso_grupo , cg.seccion, cg.denominacion, cg.fecha_inicio, cg.fecha_fin, co.año as cohorte, co.fecha_inicio as fecha_inicio_cohorte, co.fecha_cierre as fecha_cierre_cohorte, e.orden, e.id_formacion, f.nombre_formacion, cg.codigo_inscripcion, p.id AS planificacion_id, p.id_curso_equipo_docente AS planificacion_equipo_docente, p.fecha AS planificacion_fecha, p.introducAS planificacion_introduccion, p.propositos AS planificacion_propositos, p.capacidades AS planificacion_capacidades, p.contenidos_generales AS planificacion_contenidos_generales,p.contenidos_especificos AS planificacion_contenidos_especificos, p.distribucion_temporal AS planificacion_distribucion_temporal, p.estrategia_metodologica AS planificacion_estrategia_metodologica, p.evaluacion AS planificacion_evaluacion, p.entorno AS planificacion_entorno, p.recursos AS planificacion_recursos, p.bibliografia AS planificacion_bibliografia FROM curso as c, espacio as e, formacion as f, cohorte as co, curso_grupo as cg LEFT JOIN planificaciones AS p ON p.id_curso_grupo = cg.id where cg.id_curso= c.id and c.id_cohorte= co.id and f.id=e.id_formacion and c.espacio=e.id order by e.orden, c.nombre, cg.denominacion";
					$sql="SELECT 
    c.*, 
    cg.id AS id_curso_grupo,
    cg.seccion, 
    cg.denominacion, 
    cg.fecha_inicio, 
    cg.fecha_fin, 
    co.año AS cohorte, 
    co.fecha_inicio AS fecha_inicio_cohorte, 
    co.fecha_cierre AS fecha_cierre_cohorte, 
    e.orden, 
    e.id_formacion, 
    f.nombre_formacion, 
    cg.codigo_inscripcion, 

    -- 👇 indicador de planificación
    EXISTS (
        SELECT 1 
        FROM planificaciones p 
        WHERE p.id_curso_grupo = cg.id
    ) AS tiene_planificacion,

    (SELECT COUNT(*) FROM curso_equipo_docente ced WHERE ced.id_curso_grupo = cg.id) AS cantidad_docentes,
    (SELECT COUNT(*) FROM curso_estudiante ce WHERE ce.id_curso_grupo = cg.id) AS cantidad_estudiantes

FROM 
    curso AS c
    JOIN espacio AS e ON c.espacio = e.id
    JOIN formacion AS f ON f.id = e.id_formacion
    JOIN cohorte AS co ON c.id_cohorte = co.id
    JOIN curso_grupo AS cg ON cg.id_curso = c.id

ORDER BY 
    e.orden, 
    c.nombre, 
    cg.denominacion";

					//$sql_instancias="SELECT i.*, co.año as cohorte, co.id, co.id_formacion FROM cohorte as co LEFT JOIN instancia_calificacion as i ON co.id = i.id_cohorte";
					$sql_instancias="SELECT i.id as id_instancia, i.nombre_instancia as nombre, i.fecha_inicio AS fechaDesde, i.fecha_cierre AS fechaHasta, i.tipo_calificacion AS tipoCalificacion, i.id_cohorte, co.año as cohorte, co.id, co.id_formacion FROM cohorte as co LEFT JOIN instancia_calificacion as i ON co.id = i.id_cohorte";
          if ($nueva_consulta = $conexion->prepare($sql)) {
							$nueva_consulta->execute();
							$resultado = $nueva_consulta->get_result();
							if ($resultado->num_rows >= 1) {
								if ($consulta_instancias = $conexion->prepare($sql_instancias)) {
									$consulta_instancias->execute();
									$resultado_instancias = $consulta_instancias->get_result();
									echo json_encode([$resultado->fetch_all(MYSQLI_ASSOC), $resultado_instancias->fetch_all(MYSQLI_ASSOC)]);
								}else{
									echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
								}
							}else {
									echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
							}
					}else{
								echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
					}
					$conexion->close();
				}
			}
      break;

    case 'POST':
      if(isset($dataObject->accion)){
        $accion= $dataObject->accion;
        if($accion == 'editarFuncion'){
          $id_curso_equipo_docente = $dataObject->id_curso_equipo_docente;
          $funcion = $dataObject->funcion;

          $sql = "UPDATE curso_equipo_docente SET funcion = ? WHERE id = ?";
          $stmt = $conexion->prepare($sql);
          $stmt->bind_param("si", $funcion, $id_curso_equipo_docente);
          $stmt->execute();
          if ($stmt->affected_rows >= 0) {
              $respuesta = ['success'=>true, 'msg'=>'Función editada correctamente'];
          } else {
              $respuesta = ['error'=>true, 'msg'=>'Error al editar la función'];
          }
          $stmt->close();
          echo json_encode($respuesta);
          exit;
        }
      }else{
        if(isset($dataObject->modo)){
            $modo = $dataObject->modo;
            
            if ($modo == 'guardarPresentacion') {
                $id_curso_grupo = intval($dataObject->id_curso_grupo);
                $presentacion = $dataObject->presentacion;
                $sql = "UPDATE curso_grupo SET presentacion = ? WHERE id = ?";
                if ($stmt = $conexion->prepare($sql)) {
                    $stmt->bind_param("si", $presentacion, $id_curso_grupo);
                    $stmt->execute();
                    if ($stmt->affected_rows >= 0) {
                        echo json_encode(['success' => true, 'msg' => 'Presentación guardada correctamente']);
                    } else {
                        echo json_encode(['error' => true, 'msg' => 'Error al guardar la presentación']);
                    }
                    $stmt->close();
                } else {
                    echo json_encode(['error' => true, 'msg' => 'Error al preparar la consulta']);
                }
                $conexion->close();
                exit;
            }
            
          if( ($modo=='asignarDocente') or 
                ($modo=='asignaEstudiante') or 
                ($modo=='Cambiar_estado') or 
                ($modo=='generarCodigoInscripcion') or
				        ($modo=='inscribirPorCodigo') or
                ($modo=='Cambiar_denominacion_grupo') ){

                if($modo=='asignarDocente'){
                    //coloca un docente a un curso
                    $id_curso_grupo = $dataObject->id_curso_grupo;
                    $idDocente= $dataObject->idDocente;
                    $fechaHora=date('Y-m-d H:i:s'); 
                    //Verifico que no este
                    $sql= "INSERT INTO curso_equipo_docente( id_usuario, id_curso_grupo, fecha_alta) VALUES ('$idDocente','$id_curso_grupo','$fechaHora')";
                    if ($nueva_consulta = $conexion->prepare($sql)) {
                        $nueva_consulta->execute();
                        $respuesta = ['success', 'se asigno el Docente'];
                    }else{
                        $respuesta = ['error', 'error en la asignacion'];
                    }
                    //debo obtener el id del grupo
                }
                if($modo=='asignaEstudiante'){ //llama cursoGrupoEstudiante
										$id_curso_grupo = $dataObject->id_curso_grupo;
										$idEstudiante = $dataObject->idEstudiante;
							
										// Obtener la fecha y hora actual
										$fechaHora = date('Y-m-d H:i:s');
                    
										// Esta consulta No sirve para educacion primaria 
										//inserta el estudiante en un solo curos (ejemplo en matematica de 1°A pero no en lengua de 1°A)
										//$sql= "INSERT INTO curso_estudiante(id_usuario, id_curso_grupo, fecha_inscripcion) VALUES ('".$idEstudiante."','".$id_curso_grupo."','".$fechaHora."')";
                    //$nueva_consulta = $conexion->prepare($sql);
                    //$nueva_consulta->execute();
                    //$respuesta = ['success', 'se asigno el estudiante'];
										
										
										//ESTOS PASOS INSERTAN AL ESTUDIANTE EN TODOS LOS CURSOS DEL AÑO Y LA DIVICION (EJEMPLO 1°A)
										// Y SI ES EDUCACION INICIAL A LA SALA CORRESPONDIENTE 
										
										// Consulta para obtener el id_curso y seccion del id_curso_grupo dado
										//$sql = "SELECT id_curso, seccion FROM curso_grupo WHERE id = :id_curso_grupo";
										$sql = "SELECT cg.seccion, e.orden FROM curso_grupo as cg, curso as c, espacio as e WHERE cg.id_curso=c.id and c.espacio=e.id and cg.id= $id_curso_grupo";
										$consulta = $conexion->prepare($sql);
										$consulta->execute();
										$cursoGrupoDataR = $consulta->get_result();
										if ($cursoGrupoDataR->num_rows == 1) {
											$cursoGrupoData=$cursoGrupoDataR->fetch_assoc();
										//if ($cursoGrupoData) {
											//$id_curso = $cursoGrupoData['id_curso'];
												$orden = $cursoGrupoData['orden'];
												$seccion = $cursoGrupoData['seccion'];
									
												// Consulta para obtener todos los id_curso_grupo que tienen el mismo id_curso y seccion
												//$sql = "SELECT id_curso_grupo FROM curso_grupo WHERE id_curso = :id_curso AND seccion = :seccion";
												$sql = "SELECT cg.id FROM curso_grupo as cg, curso as c, espacio as e WHERE cg.id_curso=c.id and c.espacio=e.id and e.orden =  '$orden' AND cg.seccion = '$seccion'";
												$consulta = $conexion->prepare($sql);
												$consulta->execute();
												$resultado = $consulta->get_result();
												$cursoGrupos = $resultado->fetch_all(MYSQLI_ASSOC);
									
												// Insertar el estudiante en cada curso_grupo
												foreach ($cursoGrupos as $cursoGrupo) {
													$id_curso_grupo = $cursoGrupo['id'];
													$sql = "INSERT INTO curso_estudiante (id_usuario, id_curso_grupo, fecha_inscripcion) 
																	VALUES ('$idEstudiante', '$id_curso_grupo', '$fechaHora')";
													$conexion->query($sql);
											}
									
												$respuesta = ['success', 'Se asignó el estudiante a el/los curso/s'];					
									}
									
                }
								
                if($modo=='Cambiar_estado'){ //llama cursos cambiarestado de curso
                    $ids=$dataObject->ids;
                    $estado=$dataObject->estado;
                    $ids_array = $ids;
                    $x=0;
                    foreach ($ids_array as $id) {
                        $sql= "UPDATE curso SET estado='$estado' WHERE id=".$id;
                        $nueva_consulta = $conexion->prepare($sql);
                        $nueva_consulta->execute();
                        $x=$x+1;
                    }
                    $respuesta = ['success', $x.' curso/s '.$estado.'/s' ];
                }

                //generar un codigo unico para la inscripcion
                if($modo=='generarCodigoInscripcion'){ //llama cursos  generarCodigoInscripcion al curso
                    $id_curso_grupo = $dataObject->id_curso_grupo;
                
                    //proceso para generara un codigo unico random
                    //$largo=8 ;
                    //$codigo_random=bin2hex(random_bytes($largo / 2));



                    $codigoUnico = getUniqueCode(8, $conexion);
                    //actualizo el codigo en el curso_grupo correspondiente                      
                    $sql= "UPDATE curso_grupo SET codigo_inscripcion = '$codigoUnico' WHERE curso_grupo.id =".$id_curso_grupo;
                    if( $nueva_consulta = $conexion->prepare($sql)){
                        $nueva_consulta->execute();
                        //envio respuesta con el codigo incluido
                        $respuesta = ['success', ' Codigo generado',  $codigoUnico ];
                    }else{
                        $respuesta = ['error', ' no se pudo realizar la consulta', '' ];
                    }
                }
				
                if($modo=='inscribirPorCodigo') {
					          $codigo = $dataObject->codigo;
                    $idEstudiante= $dataObject->id_usuario;
                
									// Obtener la fecha y hora actual
									$fechaHora = date('Y-m-d H:i:s');
									$año_actual = date('Y');
									//ESTOS PASOS INSERTAN AL ESTUDIANTE EN TODOS LOS CURSOS DEL AÑO Y LA DIVICION (EJEMPLO 1°A)
									// Y SI ES EDUCACION INICIAL A LA SALA CORRESPONDIENTE 
										
									// Consulta para obtener el id_curso y seccion del id_curso_grupo dado
									//$sql = "SELECT id_curso, seccion FROM curso_grupo WHERE id = :id_curso_grupo";
									$sql = "SELECT cg.seccion, e.orden, cg.id as id_curso_grupo FROM curso_grupo as cg, curso as c, espacio as e WHERE cg.id_curso=c.id and c.espacio=e.id and cg.codigo_inscripcion= '$codigo'";
									$consulta = $conexion->prepare($sql);
									$consulta->execute();
									$cursoGrupoDataR = $consulta->get_result();
									if ($cursoGrupoDataR->num_rows == 1) {
										$cursoGrupoData=$cursoGrupoDataR->fetch_assoc();
										//if ($cursoGrupoData) {
											//$id_curso = $cursoGrupoData['id_curso'];
										$orden = $cursoGrupoData['orden'];
										$seccion = $cursoGrupoData['seccion'];
										$id_curso_grupo = $cursoGrupoData['id_curso_grupo'];
										
										//si es primaria o sea eel orden es 1,2,3,4,5 o 6 o no es inicial S2,S3,S4,S5 Y NO ES JORNADA In
										if(($orden=='1') or ($orden=='2') or ($orden=='3')or ($orden =='4') or ($orden =='5') or ($orden =='6')){
											// TIENEN MAS ESPACIOS EN PRIMARIA POR LO TANTO TIENE MAS DE UN CURSO Y SE INSCRIBE EN CADA CURSO
											// PRIMERO obtener todos los id_curso_grupo que tienen el mismo id_curso y seccion EJEMPLO 1RO A 
											//$sql = "SELECT cg.id FROM curso_grupo as cg, curso as c, espacio as e WHERE cg.id_curso=c.id and c.espacio=e.id and e.orden =  '$orden' AND cg.seccion = '$seccion'";
											$sql = "SELECT cg.id FROM curso_grupo as cg, curso as c, espacio as e, cohorte as co WHERE cg.id_curso=c.id and c.espacio=e.id and c.id_cohorte=co.id and  c.estado='Abierto' and e.orden = '$orden' AND cg.seccion = '$seccion'";
											$consulta = $conexion->prepare($sql);
											$consulta->execute();
											$resultado = $consulta->get_result();
											$cursoGrupos = $resultado->fetch_all(MYSQLI_ASSOC);
											
											//FALTA PREGUNTAR SI  devuelve 0 cursos es ciclo CERRADO

											// Insertar el estudiante en cada curso_grupo
											foreach ($cursoGrupos as $cursoGrupo) {
												$id_curso_grupo = $cursoGrupo['id'];
												$sql = "INSERT INTO curso_estudiante (id_usuario, id_curso_grupo, fecha_inscripcion) 
																VALUES ('$idEstudiante', '$id_curso_grupo', '$fechaHora')";
												$conexion->query($sql);
											}
											$respuesta = ['success', 'Se asignó el estudiante a el/los curso/s'];
										}else{
											//SI ES INICIAL SOLO UN CURSO CREADO
											// verificar que no este inscripto 
											$sql_control = "SELECT * FROM `curso_estudiante` WHERE `id_usuario`=$idEstudiante and `id_curso_grupo`=$id_curso_grupo";
											$consulta_control = $conexion->prepare($sql_control);
											$consulta_control->execute();
											$apariciones = $consulta_control->get_result();
											if ($apariciones->num_rows >= 1) {
												$respuesta = ['error', 'Ya se encuentra inscripto'];
											}else{
												// SE INSERTA EN ESE CURSO AL ESTUDIANTE
												$sql = "INSERT INTO curso_estudiante (id_usuario, id_curso_grupo, fecha_inscripcion) 
																VALUES ('$idEstudiante', '$id_curso_grupo', '$fechaHora')";
												$conexion->query($sql);
												$respuesta = ['success', 'Se inscribio el estudiante al curso '];
											}
										}							
									}
				        }
                if($modo=='Cambiar_denominacion_grupo'){ //llama cursos cambiarestado de curso
                    $id_curso_grupo = $dataObject->id_curso_grupo;
                    $denominacion = $dataObject->denominacion;
                    $sql= "UPDATE curso_grupo SET denominacion = '$denominacion' WHERE curso_grupo.id=".$id_curso_grupo;
                    
                    if ($nueva_consulta = $conexion->prepare($sql)) {
                        $nueva_consulta->execute();
                        $respuesta = ['success', 'se cambio la denominacion del grupo'];
                    }else{
                        $respuesta = ['error', 'error en la consulta'];
                    }
                }

                $conexion->close();
                echo json_encode($respuesta);
            }else{
                if($modo=='buscarCursoID'){//llama curso.js
                    $id = $dataObject-> id_curso_grupo; //id del grupo_curso
                   // $sql= "SELECT c.id, c.nombre, c.espacio, c.estado, c.imagen, c.creado_por, c.f_creacion, c.descripcion, co.año as cohorte, co.id_formacion, e.nombre_espacio, e.orden FROM curso as c, espacio as e, cohorte as co where co.id=c.id_cohorte and c.espacio=e.id and c.id=".$id;
                    $sql= "SELECT 
														c.id, 
														c.nombre, 
														c.espacio, 
														c.estado, 
														c.imagen, 
                                                        cg.imagen_grupo_curso,
														c.creado_por, 
														c.f_creacion, 
														c.descripcion, 
														co.año as cohorte, 
														co.id_formacion, 
														e.nombre_espacio, 
														e.orden, 
														e.dictado,
														e.imagen as imagen_general,
														cg.id as id_curso_grupo, 
														cg.seccion, 
														cg.denominacion, 
														cg.fecha_inicio, 
														cg.fecha_fin, 
														cg.codigo_inscripcion,
														cg.presentacion
														FROM curso as c, espacio as e, cohorte as co, curso_grupo as cg 
														where cg.id_curso = c.id and co.id=c.id_cohorte and c.espacio=e.id and cg.id=".$id;
                }
                if($modo=='buscarInfoCurso'){ //llama cursoEspacio.js
                    $orden = $dataObject-> orden;
                    $cohorte = $dataObject-> cohorte;
                    $id_formacion= $dataObject-> id_formacion;
                   // $sql="SELECT c.*, e.orden, e.nombre_espacio FROM curso as c, espacio as e WHERE c.espacio = e.id and c.cohorte=".$cohorte." and e.orden=".$orden;
                    $sql= "SELECT 
														c.id, 
														c.nombre, 
														c.espacio, 
														c.estado, 
														c.imagen, 
														c.creado_por, 
														c.f_creacion, 
														c.descripcion, 
														co.año as cohorte, 
														co.id_formacion, 
														e.orden, 
														e.nombre_espacio,
														e.imagen asimagen_general
														FROM curso as c, espacio as e, cohorte as co WHERE co.id =c.id_cohorte and c.espacio = e.id and co.año=".$cohorte." and e.orden=".$orden." and co.id_formacion=".$id_formacion;
                }
                if($modo=='GruposPorOrden'){ //llama cursoEspacio.js
                    $orden = $dataObject-> orden;
                    $cohorte = $dataObject-> cohorte;
                    $id_formacion= $dataObject-> id_formacion;
                    $sql="SELECT cg.id, cg.seccion, cg.denominacion, co.año as cohorte, e.orden, co.id_formacion FROM curso_grupo as cg, curso as c, espacio as e, cohorte as co WHERE co.id =c.id_cohorte and cg.id_curso=c.id and c.espacio=e.id and e.orden=".$orden." and co.año=".$cohorte." and co.id_formacion=".$id_formacion." group by seccion";
                    //$sql="SELECT cg.id, cg.seccion, cg.denominacion, co.año as cohorte, e.orden, co.id_formacion FROM curso_grupo as cg, curso as c, espacio as e, cohorte as co WHERE co.id =c.id_cohorte and cg.id_curso=c.id and c.espacio=e.id and e.orden=".$orden." and co.año=".$cohorte." and co.id_formacion=".$id_formacion;
                }
                if($modo=='buscarDocentesEnCurso'){ //llama cursoEquipoDocente.js
                    $id_curso_grupo = $dataObject-> id_curso_grupo;
                    $sql="SELECT u.*, dc.id_curso_grupo, dc.id as id_curso_equipo_docente, dc.estado as estadoDocente, cg.seccion, cg.denominacion, dc.funcion from curso_equipo_docente as dc, (SELECT us.id, us.usuario, us.nombre, us.apellido, us.apodo, us.documento, p.imagen_perfil, p.color, p.fecnac, p.genero, p.email, p.telefono, p.calle, p.numero, p.piso, p.depto, p.ciudad, p.provincia FROM usuarios us LEFT JOIN usuario_perfil p ON us.id= p.id_usuario)u, curso_grupo as cg WHERE cg.id=dc.id_curso_grupo and u.id=dc.id_usuario and cg.id=".$id_curso_grupo;
                    //$sql="SELECT u.*, dc.id_curso_grupo, dc.id as id_curso_equipo_docente, dc.estado as estadoDocente, cg.seccion, cg.denominacion from curso_equipo_docente as dc, (SELECT us.id, us.usuario, us.nombre, us.apellido, us.apodo, us.documento, p.imagen_perfil, p.color, p.fecnac, p.genero, p.email, p.telefono, p.calle, p.numero, p.piso, p.depto, p.ciudad, p.provincia FROM usuarios us LEFT JOIN usuario_perfil p ON us.id= p.id_usuario)u, curso_grupo as cg WHERE cg.id=dc.id_curso_grupo and u.id=dc.id_usuario and cg.seccion='".$seccion."' and cg.id_curso=".$id_curso;
                    //SELECT dc.id_usuario, dc.id_curso_grupo, dc.estado, cg.seccion, cg.denominacion, u.nombre, u.apellido from curso_equipo_docente as dc, usuarios as u, curso_grupo as cg WHERE cg.id=dc.id_curso_grupo and u.id=dc.id_usuario and cg.seccion='".$seccion."' and cg.id_curso=".$id_curso;
                }
                if($modo=='buscarEstudiantesCurso'){ //llama cursoGrupoEstudiante
                    $id_curso_grupo = $dataObject-> id_curso_grupo;
                    //$cohorte = $dataObject-> cohorte;
                    $sql="SELECT u.*, cg.denominacion, ec.id as id_estudiante_curso 
                          FROM curso_estudiante as ec, curso_grupo as cg, 
                            (SELECT us.id, us.usuario, us.nombre, us.apellido, us.apodo, 
                                  us.documento, p.imagen_perfil, p.color, p.fecnac, 
                                  p.genero, p.email, p.telefono, p.calle, p.numero, 
                                  p.piso, p.depto, p.ciudad, p.provincia 
                            FROM usuarios us 
                            LEFT JOIN usuario_perfil p ON us.id= p.id_usuario)u 
                          WHERE ec.id_usuario = u.id and ec.id_curso_grupo=cg.id and cg.id=$id_curso_grupo 
                          ORDER BY u.apellido, u.nombre";
                }
                if($modo=='buscarGrupoCurso'){
                    $id = $dataObject-> id;
                    //$sql= "SELECT * FROM curso_grupo where id_curso=".$id;
                    $sql="SELECT g.*,eqd.id_usuario, eqd.nombre, eqd.apellido FROM curso_grupo as g LEFT JOIN (select ed.*, u.nombre, u.apellido from curso_equipo_docente as ed, usuarios as u where ed.id_usuario=u.id)eqd ON g.id=eqd.id_curso_grupo where g.id_curso=".$id;
                }
                if($modo=='buscarCursosUsuario'){ //misCursos.js principalEstudiante.js mennsajes.js
                    $id_usuario= $dataObject->id_usuario;
					$llama = (int) $dataObject->llama; //5=docente, 6=auxiliar, 7=estudiante, 8=tutor otros roles cursos []
                    //$llama = $dataObject->llama; //5=docente, 6=auxiliar, 7=estudiante, 8=tutor
                    //$sql="SELECT c.*, e.nombre_espacio, e.orden, cg.denominacion, cg.id as id_curso_grupo FROM curso as c, curso_grupo as cg, curso_equipo_docente as ed, espacio as e WHERE c.id=cg.id_curso and ed.id_curso_grupo = cg.id and c.espacio= e.id and ed.id_usuario=".$id_usuario;
                    //$sql="SELECT a.*, p.id as id_planificacion FROM (SELECT c.*, e.nombre_espacio, e.orden, cg.denominacion, cg.id as id_curso_grupo FROM curso as c, curso_grupo as cg, curso_equipo_docente as ed, espacio as e WHERE c.id=cg.id_curso and ed.id_curso_grupo = cg.id and c.espacio= e.id and ed.id_usuario=".$id_usuario.")a LEFT JOIN planificaciones as p ON a.id_curso_grupo = p.id_curso_grupo";
                    //$sql="SELECT a.*, p.id as id_planificacion, ce2.cant_estudiantes FROM (SELECT cg.id as id_curso_grupo, cg.id_curso, count(ce.id_curso_grupo) as cant_estudiantes FROM curso_grupo as cg LEFT JOIN curso_estudiante as ce ON cg.id=ce.id_curso_grupo group by ce.id_curso_grupo)ce2, (SELECT c.*, e.nombre_espacio, e.orden, cg.denominacion, cg.id as id_curso_grupo FROM curso as c, curso_grupo as cg, curso_equipo_docente as ed, espacio as e WHERE c.id=cg.id_curso and ed.id_curso_grupo = cg.id and c.espacio= e.id and ed.id_usuario=".$id_usuario.")a LEFT JOIN planificaciones as p ON a.id_curso_grupo = p.id_curso_grupo where ce2.id_curso_grupo =a.id_curso_grupo";
                    //$sql="SELECT a.*, p.id as id_planificacion, ce2.cant_estudiantes FROM (SELECT cg.id as id_curso_grupo, cg.id_curso,(count(cg.id)-1)as cant_estudiantes FROM curso_grupo as cg LEFT JOIN curso_estudiante as ce ON cg.id=ce.id_curso_grupo group by cg.id)ce2, (SELECT c.*, e.nombre_espacio, e.orden, cg.denominacion, cg.id as id_curso_grupo, cg.codigo_inscripcion, f.caratula as caratula_formacion, f.nivel as tipo_formacion FROM curso as c, curso_grupo as cg, curso_equipo_docente as ed, espacio as e, formacion as f WHERE e.id_formacion=f.id and c.id=cg.id_curso and ed.id_curso_grupo = cg.id and c.espacio= e.id and ed.id_usuario=".$id_usuario.")a LEFT JOIN planificaciones as p ON a.id_curso_grupo = p.id_curso_grupo where ce2.id_curso_grupo =a.id_curso_grupo";
                    $sql="";
					//si son cursos de docente o auxiliar
					if((($llama==6)||($llama==5))||(isset($dataObject->componenete))){
						$sql="SELECT 
                                a.*, 
                                CASE 
                                    WHEN EXISTS (
                                        SELECT 1 
                                        FROM planificaciones p 
                                        WHERE p.id_curso_grupo = a.id_curso_grupo
                                    ) THEN 1 
                                    ELSE 0 
                                END AS tiene_planificacion,

                                ce2.cant_estudiantes,

                                /* MENSAJES SIN LEER */
                                (
                                    SELECT COUNT(*)
                                    FROM mensajes m
                                    INNER JOIN mensajes_recibidos mr 
                                        ON mr.id_mensaje = m.id_mensaje
                                    INNER JOIN usuarios u 
                                        ON u.usuario = mr.usuario
                                    WHERE 
                                        m.id_curso = a.id_curso_grupo
                                        AND u.id = '$id_usuario'
                                        AND mr.estado = 0
                                ) AS mensajes_sin_leer

                            FROM (
                                SELECT 
                                    cg.id AS id_curso_grupo, 
                                    cg.id_curso, 
                                    COUNT(ce.id) AS cant_estudiantes
                                FROM curso_grupo AS cg
                                LEFT JOIN curso_estudiante AS ce 
                                    ON cg.id = ce.id_curso_grupo
                                GROUP BY cg.id
                            ) ce2

                            JOIN (
                                SELECT 
                                    c.*,
                                    co.año AS cohorte, 
                                    co.fecha_inicio, 
                                    co.fecha_cierre,
                                    e.nombre_espacio, 
                                    e.orden, 
                                    e.imagen AS imagen_general,
                                    cg.denominacion, 
                                    cg.id AS id_curso_grupo, 
                                    cg.codigo_inscripcion,
                                    cg.imagen_grupo_curso,
                                    cg.presentacion,
                                    f.caratula AS caratula_formacion, 
                                    f.nivel AS tipo_formacion,
                                    f.nombre_formacion
                                FROM curso AS c
                                JOIN curso_grupo AS cg 
                                    ON c.id = cg.id_curso
                                JOIN curso_equipo_docente AS ed 
                                    ON cg.id = ed.id_curso_grupo
                                JOIN espacio AS e 
                                    ON c.espacio = e.id
                                JOIN formacion AS f 
                                    ON e.id_formacion = f.id
                                JOIN cohorte AS co 
                                    ON c.id_cohorte = co.id
                                WHERE ed.id_usuario = '$id_usuario'
                            ) a 
                            ON ce2.id_curso_grupo = a.id_curso_grupo

                            ORDER BY 
                                a.tipo_formacion ASC, 
                                a.orden ASC, 
                                a.id_curso_grupo ASC";
					}
					//si son cursos de estudiante (o el tutor del estudiante)
					if($llama ==7 || $llama==8){ // si llama el estudiante o el tutor
                        $sql="SELECT 
                                a.*, 
                                CASE 
                                    WHEN EXISTS (
                                        SELECT 1 
                                        FROM planificaciones p 
                                        WHERE p.id_curso_grupo = a.id_curso_grupo
                                    ) THEN 1 
                                    ELSE 0 
                                END AS tiene_planificacion,

                                ce2.cant_estudiantes,

                                (
                                    SELECT COUNT(*)
                                    FROM mensajes m
                                    INNER JOIN mensajes_recibidos mr 
                                        ON mr.id_mensaje = m.id_mensaje
                                    INNER JOIN usuarios u 
                                        ON u.usuario = mr.usuario
                                    WHERE m.id_curso = a.id_curso_grupo
                                        AND u.id = '$id_usuario'
                                        AND mr.estado = 0
                                ) AS mensajes_sin_leer,

								CASE
									WHEN vf.valor IS NOT NULL
										AND vf.valor <> ''
										AND vf.valor = 'Logrado'
									THEN 1
									ELSE 0
								END AS aprobado,

								vf.valor AS nota_final

                            FROM (
                                SELECT 
                                    cg.id AS id_curso_grupo, 
                                    cg.id_curso, 
                                    COUNT(ce.id) AS cant_estudiantes
                                FROM curso_grupo AS cg
                                LEFT JOIN curso_estudiante AS ce 
                                    ON cg.id = ce.id_curso_grupo
                                GROUP BY cg.id
                            ) ce2

                            JOIN (
                                SELECT 
                                    c.*,
                                    co.año AS cohorte, 
                                    co.fecha_inicio, 
                                    co.fecha_cierre,
                                    e.nombre_espacio, 
                                    e.orden, 
                                    e.imagen AS imagen_general,
                                    cg.denominacion, 
                                    cg.id AS id_curso_grupo, 
                                    cg.codigo_inscripcion,
                                    cg.imagen_grupo_curso,
                                    cg.presentacion,
                                    f.caratula AS caratula_formacion, 
                                    f.nivel AS tipo_formacion,
                                    f.nombre_formacion,
									f.id as id_formacion
                                FROM curso AS c
                                JOIN curso_grupo AS cg 
                                    ON c.id = cg.id_curso
                                JOIN curso_estudiante AS es 
                                    ON cg.id = es.id_curso_grupo 
                                JOIN espacio AS e 
                                    ON c.espacio = e.id
                                JOIN formacion AS f 
                                    ON e.id_formacion = f.id
                                JOIN cohorte AS co 
                                    ON c.id_cohorte = co.id
                                WHERE es.id_usuario ='$id_usuario'
                            ) a 
                            ON ce2.id_curso_grupo = a.id_curso_grupo

							LEFT JOIN (
								SELECT
									v.id_curso,
									v.id_usuario,
									v.valor,
									ic.nombre_instancia
								FROM valoracion v
								INNER JOIN instancia_calificacion ic
									ON ic.id = v.id_instancia
								WHERE LOWER(ic.nombre_instancia) = 'final'
							) vf
								ON vf.id_curso = a.id
								AND vf.id_usuario = '$id_usuario'

                            ORDER BY 
                                a.tipo_formacion ASC, 
                                a.orden ASC, 
                                a.id_curso_grupo ASC";
					}
                }
                
                if($modo=='buscarClasesCursoUsuario'){
                    $id_curso= $dataObject->id_curso;
                    $id_grupo= $dataObject->id_grupo;
                    //$sql="SELECT cl.* FROM clase as cl WHERE cl.id_curso=".$id_curso." and cl.id_curso_grupo=".$id_grupo." ORDER BY cl.fecha asc";
										$sql="SELECT cl.* FROM clase as cl WHERE cl.id_curso_grupo=".$id_grupo." ORDER BY cl.fecha asc";
                }
                if($modo=='buscarCursoPlanificacion'){
                    $id_curso_grupo= $dataObject->id_curso_grupo;
                    //$sql="SELECT p.*, co.año as cohorte, e.nombre_espacio, e.orden, cg.denominacion FROM curso as c, curso_grupo as cg, curso_equipo_docente as ed, espacio as e, planificaciones as p, cohorte as co WHERE c.id_cohorte=co.id and p.id_curso_grupo = cg.id and c.id=cg.id_curso and ed.id_curso_grupo = cg.id and c.espacio= e.id and cg.id=".$id_curso_grupo;
                    $sql="SELECT 
                            p.*, 
                            co.año AS cohorte, 
                            e.nombre_espacio, 
                            e.orden, 
                            cg.denominacion,
                            u.nombre AS nombre_creador,
                            u.apellido AS apellido_creador
                        FROM planificaciones p

                        INNER JOIN curso_grupo cg ON p.id_curso_grupo = cg.id
                        INNER JOIN curso c ON cg.id_curso = c.id
                        INNER JOIN cohorte co ON c.id_cohorte = co.id
                        INNER JOIN espacio e ON c.espacio = e.id
                        LEFT JOIN usuarios u ON p.creado_por = u.id
                        WHERE cg.id = $id_curso_grupo";
                }
                if($modo=='buscarClases'){
                    $id_curso= $dataObject->id_curso;
                    $id_curso_grupo= $dataObject->id_curso_grupo;
                   // $sql="SELECT cl.* FROM clase as cl WHERE cl.id_curso=".$id_curso;
                   $sql="SELECT cl.* FROM clase as cl WHERE cl.id_curso_grupo=".$id_curso_grupo;
                }
                if($sql!=""){
                    if($nueva_consulta = $conexion->prepare($sql)) {
                        $nueva_consulta->execute();
                        $resultado = $nueva_consulta->get_result();
                        if ($resultado->num_rows >= 1) {
                            if($modo=='buscarCursoPlanificacion') {
                                    echo json_encode(['planificacion'=>$resultado->fetch_all(MYSQLI_ASSOC)]);
                                    exit();
                            }
                            if ($resultado->num_rows == 1){
                                if($modo=='buscarCursoID'){
                                    echo json_encode($resultado->fetch_assoc());
                                }else{
                                    echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
                                }
                            }else{
                                //si son mas de un resultado envio un arreglo con los resultados
                                    echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
                                
                            }
                        }else {
                            echo json_encode(array('resultado'=>false, 'error' => 'No existen Resultados.'));
                            exit();
                        }
                    }else{
                        echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query'));
                        exit();
                    }
                }else{
                    echo json_encode(array('resultado'=>false, 'error' => 'No se definió una consulta para este modo'));
                    exit();
                }
                $conexion->close();
            }
        }else{
            $respuesta = ['error', 'entro a nuevo'];
		    if(isset($dataObject->nuevo)){
				$nuevo= $dataObject->nuevo;
				if ($nuevo == 'AgregarGrupos') {
				    $id_curso = $dataObject->id_curso;
                    $cantidad = $dataObject->cantidad;
                    $fecha_inicio = date('Y-m-d'); // Puedes modificar esto según tus necesidades
                    $fecha_fin = date('Y-m-d', strtotime('+1 year')); // Puedes modificar esto según tus necesidades
                    $codigo_inscripcion = "";
                    //Verificar cuantos grupos hay en el curso
                    $sql_grupos="SELECT id FROM curso_grupo WHERE id_curso=$id_curso";
                    $resultado_curso = $conexion->query($sql_grupos);
                    $cant_grupos=$resultado_curso->num_rows;
                    $arregloSeccion = array("A", "B", "C", "D", "E", "F","G","H","I","J","K");

                    for ($i = 0; $i < $cantidad; $i++) {
                        $seccion =  $arregloSeccion[($cant_grupos+$i)];
                        $denominacion = $arregloSeccion[($cant_grupos+$i)];
                        $query = "INSERT INTO curso_grupo (id_curso, seccion, denominacion, fecha_inicio, fecha_fin, codigo_inscripcion) VALUES ('$id_curso', '$seccion', '$denominacion', '$fecha_inicio', '$fecha_fin', '$codigo_inscripcion')";
                        if (mysqli_query($conexion, $query)) {
                            $respuesta = ['success', 'Grupos agregados exitosamente'];
                        } else {
                            $respuesta = ['error', 'fallo ejecucion de la consulta'];
                        }
                    }
				}
                if ($nuevo == 'AgregarInstancias') {
					$id_formacion = $dataObject->id_formacion;
					$cohorte_año = $dataObject->cohorte_año;
					$instancias = $dataObject->arreglo_instancias;
					$error='';
							
					//con  formacion y año obtengo id_cohorte
					$sql_cohorte = "SELECT * FROM cohorte WHERE año='$cohorte_año' and id_formacion='$id_formacion'";
					if ($consulta_cohorte = $conexion->prepare($sql_cohorte)) {
						$consulta_cohorte->execute();
						$resultado_cohorte = $consulta_cohorte->get_result();
						$cohorte = $resultado_cohorte->fetch_assoc();
						$id_cohorte = $cohorte['id'];
					
						//elimino las instancias correspondientes al id_cohorte
						$sql_elimina_cohorte = "DELETE FROM instancia_calificacion WHERE id_cohorte=$id_cohorte";
						if ($nueva_consulta_elimina_instancia = $conexion->prepare($sql_elimina_cohorte)) {
							$nueva_consulta_elimina_instancia->execute();
							//crear las instancias de calificacion
										
				    	// Decodificar el JSON de instancias que viene del frontend
							$instancias_array = json_decode(json_encode($instancias), true);
															
							foreach ($instancias_array as $instancia) {
								$nombre = $instancia['nombre'];
								$fechaDesde = $instancia['fechaDesde'];
								$fechaHasta = $instancia['fechaHasta'];
								$tipoCalificacion = $instancia['tipoCalificacion'];
								// Construir la consulta de inserción
								$sql_instancias = "INSERT INTO instancia_calificacion(nombre_instancia, fecha_inicio, fecha_cierre, id_cohorte, tipo_calificacion) VALUES ('$nombre', '$fechaDesde', '$fechaHasta','$id_cohorte','$tipoCalificacion')";
								// Ejecutar la consulta
								if ($conexion->query($sql_instancias) === TRUE) {
									//Instancia insertada correctamente
								} else {
									$error= "Error al insertar instancia: " . $conexion->error;
								}
							}
						} else {
							$error = "Error de eliminación de instancias anteriores de la cohorte: " . $conexion->error;
						}
					} else {
						$error = "Error no se pudo obtener la cohorte: " . $conexion->error;
					}
					if ($error == '') {
						$respuesta = ['success', 'Instancia actualizada'];
					} else {
						$respuesta = ['error', 'fallo:' . $error];
					}
				}	
			}
            if(isset($_POST['nuevo'])){
			    $nuevo= $_POST['nuevo'];
                $respuesta = ['error', 'entro en hay nuevo'];
                if($nuevo=='cohorte'){  //crear cohorte
                    //tomo las variables pasadas por post
                    $cohorte= $_POST['cohorte'];
                    $grupos = $_POST['grupos'];
                    $seccion = $_POST['seccion'];
                    $id_formacion=$_POST['idFormacion'];
                    $orden=$_POST['orden']; 
                    $id_usuario=$_POST['id_usuario'];
                
                    $fechaInicio=$_POST['fechaInicio'];
                    $fechaCierre=$_POST['fechaCierre'];

                    $fechaInicioInscripcion=$_POST['fechaInicioInscripcion'];
                    $fechaCierreInscripcion=$_POST['fechaCierreInscripcion'];

                    $instancias=$_POST['instancias'];

                    $fechaHora=date('Y-m-d H:i:s'); 
                    if($seccion=="letras"){
                        //arreglo de letras para los grupos
                        $arregloSeccion = array("A", "B", "C", "D", "E", "F","G","H","I","J","K"); 
                    }else{
                        //arreglo de numeros para los grupos
                        $arregloSeccion = array("1", "2", "3", "4", "5", "6","7","8","9","10","11"); 
                    }
                    $error="";
                    $msj="";
                
                    // verificar que la cohorte no este creada
                    $sql_Cohorte="SELECT * FROM cohorte WHERE año='".$cohorte."' and id_formacion='".$id_formacion."'";
                    if($consulta_cohorte = $conexion->prepare($sql_Cohorte)) {
                        $consulta_cohorte->execute();
                        $resultado = $consulta_cohorte->get_result();
                        if ($resultado->num_rows > 0) {
                            //la cohorte existe
                            //tomo el id_cohorte para no crear duplicado la corte de la formacion y año
                            $fila = $resultado->fetch_assoc();
                            $id_cohorte = $fila['id'];
							$msj=$msj."- cohorte existe tomo id=".$id_cohorte;
                        }else{
                            // Creo la cohorte en la tabla cohorte
                            $sql_Inserta_Cohorte = "INSERT INTO cohorte( año, fecha_inicio, fecha_cierre, id_formacion) VALUES ('$cohorte','$fechaInicio','$fechaCierre','$id_formacion')";
                            if (mysqli_query($conexion, $sql_Inserta_Cohorte)) {
                                // Tomo el id_cohorte insertado
                                $id_cohorte = $conexion->insert_id;
                                $msj=$msj."- cohorte creada con id=".$id_cohorte;
                            } else {
                                // Pongo id_corte en 0 para marcar el error
                                $id_cohorte = 0;
                            }
                        }
                    }else{
                        //error en a consulta pongo cohorte  en 0 para evitar que continue ejecutando 
						// y devuelva el error
                        $id_cohorte=0;
                    }
                    if($id_cohorte<>0){
                        // Selecciono los espacios para crear los cursos
                        if ($orden == (-10)) {
                            // Selecciono TODOS los espacios de la formacion seleccionada 
							// que sean para estudiantes (en campo dictado)
                            $sql_espacios = "SELECT * FROM espacio WHERE id_formacion='$id_formacion' and dictado='Estudiantes'";
                        } else {
                            // Selecciono los espacios de la formacion seleccionada y el orden seleccionado
                            $sql_espacios = "SELECT * FROM espacio WHERE id_formacion='".$id_formacion."' and orden='".$orden."'";
                        }
                        // Por cada espacio seleccionado creo (INSERT) un curso
                        $consulta = $conexion->query($sql_espacios);
                        while ($esp = $consulta->fetch_array(MYSQLI_ASSOC)) {
                            // Verificar que el espacio no esté creado ya en la cohorte para no repetir
                            // y solo crear los nuevos
                            $sql_busca_esp = "SELECT id from curso where espacio='".$esp['id']."' and id_cohorte='".$id_cohorte."'";
                            $resultado_curso = $conexion->query($sql_busca_esp);
                            if ($resultado_curso->num_rows == 0) {
                               // No existe entonces creo el curso para el espacio en la cohorte
                                $sql2 = "INSERT INTO curso (nombre, espacio, id_cohorte, estado, imagen, creado_por, f_creacion, descripcion) VALUES ('".$esp['nombre_espacio']."', '".$esp['id']."', '".$id_cohorte."', 'Cerrado', '', '".$id_usuario."', '".$fechaHora."', '')";
                                $res1 = $conexion->query($sql2);
                                $msj=$msj."- el curso para espacio ".$esp['nombre_espacio']."(".$esp['id'].") se creo correctamente para la cohorte id:".$id_cohorte." no se creo el curso.";
                                // Leo el id del curso insertado
                                $id_curso = $conexion->insert_id;
                                // Creo los grupos para el curso
                                for ($i = 0; $i < $grupos; $i++) {
                                    //$sql3 = "INSERT INTO curso_grupo (id_curso, seccion, denominacion) VALUES ('".$id_curso."','".$arregloSeccion[$i]."', '".$arregloSeccion[$i]."')";
                                    $sql3 = "INSERT INTO curso_grupo (id_curso, seccion, denominacion, fecha_inicio, fecha_fin) VALUES ('".$id_curso."','".$arregloSeccion[$i]."', '".$arregloSeccion[$i]."','".$fechaInicioInscripcion."','".$fechaInicioInscripcion."')";
                                    if ($conexion->query($sql3)) {
                                        $msj=$msj."- se creo el grupo '".$arregloSeccion[$i]."' para el espacio ".$esp['nombre_espacio']."(".$esp['id'].")";
                                        // Grupo insertado correctamente
                                    }else{
                                        //$error = "Error al insertar grupo";
                                        $msj=$msj."- NO se creo el grupo '".$arregloSeccion[$i]."' para el espacio ".$esp['nombre_espacio']."(".$esp['id'].")";
                                    }
                                }
                            }else{
								//$error="cursos".$resultado_curso->num_rows;
                                $msj=$msj."- el espacio ".$esp['nombre_espacio']."(".$esp['id'].") ya existepara la cohorte id:".$id_cohorte." no se creo el curso.";
                                // el curso existe pero debo chequar si tiene los grupos creados
                                $fila_curso = $resultado_curso->fetch_assoc(); 
                                $id_curso = $fila_curso['id'];
                                //verificar que no este creados los grupos
                                for ($i = 0; $i < $grupos; $i++) {
                                    $sql_busca_grupo = "SELECT id from curso_grupo where id_curso='".$id_curso."' and seccion='".$arregloSeccion[$i]."'";
                                    $resultado_grupo = $conexion->query($sql_busca_grupo);
                                    if ($resultado_grupo->num_rows == 0) {
                                        //no existe el grupo lo creo
                                        $sql3 = "INSERT INTO curso_grupo (id_curso, seccion, denominacion, fecha_inicio, fecha_fin) VALUES ('".$id_curso."','".$arregloSeccion[$i]."', '".$arregloSeccion[$i]."','".$fechaInicioInscripcion."','".$fechaCierreInscripcion."')";
                                        if ($conexion->query($sql3)) {
                                            $msj=$msj."- se creo el grupo '".$arregloSeccion[$i]."' para el espacio ".$esp['nombre_espacio']."(".$esp['id'].")";
                                            // Grupo insertado correctamente
                                        } else {
                                            //$error = "Error al insertar grupo";
                                            $msj=$msj."- NO se creo el grupo '".$arregloSeccion[$i]."' para el espacio ".$esp['nombre_espacio']."(".$esp['id'].")";
                                        }
                                    }else{
                                        //el grupo existe no hago nada
                                        $msj=$msj."- el grupo '".$arregloSeccion[$i]."' para el espacio ".$esp['nombre_espacio']."(".$esp['id'].") ya existia.";
                                    }
                                }

							}
                        } // Fin del while crear cursos por espacio   
                        //crear las instancias de calificacion
                        $instancias_array = json_decode($instancias, true); // Decodificar el JSON de instancias
                    
                        //si existen instancias en en la base para la cohorte y la formacion las elimino
                        $sql_elimina_instancia="DELETE FROM instancia_calificacion WHERE id_cohorte=$id_cohorte";
                        if($nueva_consulta_elimina_instancia = $conexion->prepare($sql_elimina_instancia)) {
                            $nueva_consulta_elimina_instancia->execute();
                            $msj=$msj."- elimino instancias si habia para la cohorte id:".$id_cohorte;           
                        }
                        foreach ($instancias_array as $instancia) {
                            $nombre = $instancia['nombre'];
                            $fechaDesde = $instancia['fechaDesde'];
                            $fechaHasta = $instancia['fechaHasta'];
                            $tipoCalificacion = $instancia['tipoCalificacion'];
                            // Construir la consulta de inserción
                            $sql_instancias = "INSERT INTO instancia_calificacion(nombre_instancia, fecha_inicio, fecha_cierre, id_cohorte, tipo_calificacion) VALUES ('$nombre', '$fechaDesde', '$fechaHasta','$id_cohorte','$tipoCalificacion')";
                            // Ejecutar la consulta
                            if ($conexion->query($sql_instancias) === TRUE) {
                                //Instancia insertada correctamente
                                $msj=$msj."- se creo la instancia ".$instancia['nombre']." para la cohorte id:".$id_cohorte;           
                            } else {
                                $error= "Error al insertar instancia ";
                                $msj=$msj."- NO se pudo crear la instancia ".$instancia['nombre']." para la cohorte id:".$id_cohorte;
                            }
                        }
                    }else{
                        //error no se modifico nada
                        $error="error a nivle de cohorte, no se creo la cohorte.";
                        $msj=$msj." error a nivel de cohorte no se pudo realizar ninguna creacion";
                    }
                    // Cerrar la conexión
                    $conexion->close();
                
                    if($error==""){
                        $respuesta = ['success', 'Cohorte creada. ',$msj];
                    }else{
                        $respuesta = ['error', $error, $msj];
                    }
                }
                if ($nuevo == 'AgregarGrupos') {
                    $respuesta = ['error', 'entro en agregar'];
                    $id_curso = $_POST['id_curso'];
                    $cantidad = $_POST['cantidad'];
                    $fecha_inicio = date('Y-m-d'); // Puedes modificar esto según tus necesidades
                    $fecha_fin = date('Y-m-d', strtotime('+1 year')); // Puedes modificar esto según tus necesidades
                    $codigo_inscripcion = "";
                    //Verificar cuantos grupos hay en el curso
                    $sql_grupos="SELECT id FROM curso_grupo WHERE id_curso=$id_curso";
                    $resultado_curso = $conexion->query($sql_grupos);
                    $cant_grupos=$resultado_curso->num_rows;
                    $arregloSeccion = array("A", "B", "C", "D", "E", "F","G","H","I","J","K");

                    for ($i = 0; $i < $cantidad; $i++) {
                        $seccion =  $arregloSeccion[($cant_grupos+$i)];
                        $denominacion = $arregloSeccion[($cant_grupos+$i)];
                        $query = "INSERT INTO curso_grupo (id_curso, seccion, denominacion, fecha_inicio, fecha_fin, codigo_inscripcion) VALUES ('$id_curso', '$seccion', '$denominacion', '$fecha_inicio', '$fecha_fin', '$codigo_inscripcion')";
                        mysqli_query($conn, $query);
                    }
            
                    $respuesta = ['success', 'Grupos agregados exitosamente'];
                   // echo json_encode($response);
                   // exit();
                }
                if($nuevo=='DefinirFechasInscripcion'){
                    $error="";
                    $cohorte= $_POST['cohorte'];
                    $id_formacion=$_POST['idFormacion'];
                    $fechaInicioInscripcion=$_POST['fechaInicioInscripcion'];
                    $fechaCierreInscripcion=$_POST['fechaCierreInscripcion'];
                    //buscar los cursos de la formacion y la corte
                    $sql1="SELECT c.id FROM curso as c, espacio as e, cohorte as co WHERE c.espacio=e.id and c.id_cohorte=co.id and e.id_formacion=$id_formacion and co.año=$cohorte";
                    $consulta = $conexion->query($sql1);
                    $x=0;
                    while ($cur = $consulta->fetch_array(MYSQLI_ASSOC)) {
                        //por cada curso actualizar los grupos con periodo de inscripcion
                        $sql_grupo="UPDATE curso_grupo SET fecha_inicio='".$fechaInicioInscripcion."',fecha_fin='".$fechaCierreInscripcion."' WHERE id_curso=".$cur['id'];
                        $consulta2 = $conexion->query($sql_grupo);
                        $x=$x+1;
                    }
                    // Cerrar la conexión
                    $conexion->close();
                
                    if($error==""){
                        $respuesta = ['success', 'Periodo de inscripción establecido para los '.$x.' cursos'];
                    }else{
                        $respuesta = ['error', $error];
                    }
                }
                if($nuevo=='planificacion'){
                    //tomo las variables pasadas por post
					$id= $_POST['id'];
                    $id_curso_grupo= $_POST['id_curso_grupo'];
                    $id_curso_equipo_docente= $_POST['id_curso_equipo_docente'];

                    $fecha = $_POST['fecha'];
                    $introduccion=$_POST['introduccion'];
                    $propositos=$_POST['propositos'];
                    $capacidades=$_POST['capacidades']; 
                    $contenidos=$_POST['contenidos'];

                    $estrategia_metodologica=$_POST['estrategia_metodologica'];
                    $evaluacion=$_POST['evaluacion'];

                    $entorno=$_POST['entorno'];
                    $recursos=$_POST['recursos'];
                    $bibliografia=$_POST['bibliografia'];
                    //leo si hay un archivo sibodo tomo el nombre sino lo dejo en ''
                    $archivo = '';
                    if (isset($_FILES['archivo']) && $_FILES['archivo']['error'] === UPLOAD_ERR_OK) {
                        $archivo = $_FILES['archivo']['name'];
                    }
                    $creado_por=$_POST['creado_por'];
                    $titulo=$_POST['titulo'];

                    $capacidades_array = json_decode($capacidades, true);
                    $contenidos_array = json_decode($contenidos, true);

					//analiso si es editar o nuevo segun el valor de $id
					if($id===''){
						// query para crear la planificacion
                        //si existe archivo ponemos un nombre de archivo en blanco 
                        // luego de subir el archivo actualizamos el registro con el nombre del archivo subido
                        $aux_archivo="";
      	                $sql_planificacion = "INSERT INTO planificaciones
                                            (id_curso_grupo, 
                                             id_curso_equipo_docente, 
                                             fecha, introduccion, 
                                             propositos, 
                                             capacidades, 
                                             contenidos_generales, 
                                             contenidos_especificos, 
                                             distribucion_temporal, 
                                             estrategia_metodologica, 
                                             evaluacion, 
                                             entorno, 
                                             recursos, 
                                             bibliografia,
                                             archivo,
                                             creado_por,
                                             titulo) 
                                             VALUES (
                                             '$id_curso_grupo',
                                             '$id_curso_equipo_docente',
                                             '$fecha',
                                             '$introduccion',
                                             '$propositos',
                                             '$capacidades',
                                             '$contenidos',
                                             '',
                                             '',
                                             '$estrategia_metodologica',
                                             '$evaluacion',
                                             '$entorno',
                                             '$recursos',
                                             '$bibliografia',
                                             '$aux_archivo',
                                             '$creado_por',
                                             '$titulo')";
					}else{
						//query para editar la planificacion
						$sql_planificacion = "UPDATE planificaciones SET id_curso_grupo='$id_curso_grupo',id_curso_equipo_docente='$id_curso_equipo_docente',fecha='$fecha',introduccion='$introduccion',propositos='$propositos',capacidades='$capacidades',contenidos_generales='$contenidos',estrategia_metodologica='$estrategia_metodologica',evaluacion='$evaluacion',entorno='$entorno',recursos='$recursos',bibliografia='$bibliografia' WHERE id=".$id;
                    }
                
					if (mysqli_query($conexion, $sql_planificacion)) {
                        // correcto
                        if($id===''){ //es nueva planificacion 
                            //si se subio un archivo lo renombro con el id_planificacion y lo guardo en la carpeta correspondiente
                            if($archivo<>""){
                                // entonces tomo el id insertado para renombrar el archivo subido
                                $id_planificacion = $conexion->insert_id;
                                //priemro obtengo la extencion del archivo subido
                                $extencion = pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION);
                                //armo el nombre del archivo con el id_planificacion y la extencion
                                $nombre_archivo = "planificacion_".$id_planificacion.".".$extencion;
                                $ruta_archivo = "./planificaciones/".$nombre_archivo;
                                //si no existe la carpeta de planificaciones la creo
                                if (!file_exists('./planificaciones')){
                                    mkdir('./planificaciones', 0777, true);
                                }
                                //mover el archivo subido a la carpeta correspondiente
                                if (move_uploaded_file($_FILES['archivo']['tmp_name'], $ruta_archivo)) {
                                    //actualizar el registro de la planificacion con el nombre del archivo subido
                                    $sql_actualiza_archivo = "UPDATE planificaciones SET archivo='$nombre_archivo' WHERE id=$id_planificacion";
                                    mysqli_query($conexion, $sql_actualiza_archivo);
                                } else {
                                    //error al subir el archivo
                                    $error = "Error al subir el archivo.";
                                }
                            }
                        }else{ //es editar planificacion
                            //si se subio un archivo lo renombro con el id_planificacion y lo guardo en la carpeta correspondiente
                            if($archivo<>""){
                                // entonces tomo el id para renombrar el archivo subido
                                $id_planificacion = $id;
                                //priemro obtengo la extencion del archivo subido
                                $extencion = pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION);
                                //armo el nombre del archivo con el id_planificacion y la extencion
                                $nombre_archivo = "planificacion_".$id_planificacion.".".$extencion;
                                $ruta_archivo = "../planificaciones/".$nombre_archivo;
                                //si no existe la carpeta de planificaciones la creo
                                if (!file_exists('../planificaciones')) {
                                    mkdir('../planificaciones', 0777, true);
                                }
                                //mover el archivo subido a la carpeta correspondiente
                                if (move_uploaded_file($_FILES['archivo']['tmp_name'], $ruta_archivo)) {
                                    //actualizar el registro de la planificacion con el nombre del archivo subido
                                    $sql_actualiza_archivo = "UPDATE planificaciones SET archivo='$nombre_archivo' WHERE id=$id_planificacion";
                                    mysqli_query($conexion, $sql_actualiza_archivo);
                                } else {
                                    //error al subir el archivo
                                    $error = "Error al subir el archivo.";
                                }
                            }
                        }
                        $respuesta = ['success', 'Planificación guardada.'];
                    } else {
                        // marcar el error
				    	$respuesta = ['error', $error];
                    }
                }
			}
            echo json_encode($respuesta);
        }
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

    case 'DELETE':
        if(!isset($dataObject->id)){
			$respuesta= ['error','El id no debe estar vacío'];
        }else{
          if(isset($dataObject->tabla)){
            $id = $dataObject->id;
            $tabla=$dataObject->tabla;
			//si es tabla curso_estudiante
			if($tabla=='curso_estudiante'){
				//cuando sacamos un estudiante de un curso de un año lo sacamos de todos los cursos (solo lo puede hacer el secretario o director)
				//id es el id de la tabla curso_estudiante
				//query para obtener datos necesarios para eliminar todos los cursos del mismo año
				$sql_aux="SELECT ce.id_usuario, cg.seccion, e.orden, co.año as ciclo FROM curso_estudiante as ce, curso_grupo as cg, curso as c, espacio as e, cohorte as co WHERE co.id=c.id_cohorte and e.id=c.espacio and c.id=cg.id_curso and cg.id=ce.id_curso_grupo and ce.id=$id";
            	if ($consulta_Aux = $conexion->prepare($sql_aux)) {
					$consulta_Aux->execute();
					$resultado = $consulta_Aux->get_result();
                    if ($resultado->num_rows == 1) {
                        //hay resultados armo el arreglo asociativo
                        $datos = $resultado->fetch_assoc();
						//Obtener id_estudiante, orden (año Cursa), ciclo
                        $id_estudiante=$datos['id_usuario'];
						$seccion=$datos['seccion'];
						$orden=$datos['orden'];
						$ciclo=$datos['ciclo'];

						//La siguiente subconsulta obtiene todos los id de los cursos_grupo a eliminar 
						//SELECT cg.id FROM curso_grupo as cg, curso as c, espacio as e, cohorte as co WHERE co.id=c.id_cohorte and e.id=c.espacio and c.id=cg.id_curso and cg.seccion='$seccion' and e.orden=$orden and co.año=$ciclo
						//preparar la consulta de eliminacion
						$sql_del="DELETE FROM curso_estudiante 
														WHERE id_usuario = $id_estudiante 
															AND id_curso_grupo IN (
																	SELECT cg.id 
																	FROM curso_grupo cg
																	JOIN curso c     ON cg.id_curso = c.id
																	JOIN espacio e   ON e.id = c.espacio
																	JOIN cohorte co  ON co.id = c.id_cohorte
																	WHERE cg.seccion = '$seccion'
																		AND e.orden = '$orden'
																		AND co.año = '$ciclo')
						";
					}else{
						$respuesta = ['error','fallo la eliminación datos incorrectos'];
					}		
				}else{
					$respuesta = ['error','fallo la eliminación'];
				}
			}else{
                //si es tabla planificaciones 
                // Primero verifico si tiene archivo si es <> a '' 
                // si es asi obtengo el nombre para borrarlo de la carpeta 
                // Luego lo borro 
                // y finalmente elimino el registro de planificacion
                if($tabla=='planificaciones'){
                    //obtengo el nombre del archivo para eliminarlo de la carpeta
                    $sql_archivo="SELECT archivo FROM planificaciones where id='$id'";
                    if ($consulta_archivo = $conexion->prepare($sql_archivo)) {
                        $consulta_archivo->execute();
                        $resultado_archivo = $consulta_archivo->get_result();
                        if ($resultado_archivo->num_rows == 1) {
                            //hay resultados armo el arreglo asociativo
                            $datos = $resultado_archivo->fetch_assoc();
                            $archivo=$datos['archivo'];
                            if($archivo<>""){
                                //elimino el archivo de la carpeta
                                $ruta_archivo = "./planificaciones/".$archivo;
                                if (file_exists($ruta_archivo)) {
                                    unlink($ruta_archivo);
                                }else{
                                    //error no existe el archivo para eliminar
                                    $respuesta = ['warning','No se encontró el archivo para eliminar, se eliminó la planificación pero el archivo no se pudo eliminar'];
                                }
                            }
                            $sql_del="DELETE FROM ".$tabla." where id='$id' ";
                        }else{
                            $respuesta = ['error','fallo la eliminación datos incorrectos'];
                        }
                    }else{
                         $respuesta = ['error','fallo la eliminación'];
                    }
                }else{
    				$sql_del="DELETE FROM ".$tabla." where id='$id' ";
                }
			}
          }else{
            $id = $dataObject->id;
            $sql_del="DELETE FROM institucion where id='$id' ";
          }
    //ejecuto la consulta de eliminación
          if ($nueva_consulta = $conexion->prepare($sql_del)) {
            $nueva_consulta->execute();
			if($tabla=='curso_grupo'){
			    //eliminar todas las menciones
				$mensajeError="";
				// tabla curso_estudiante 
				$sql_curso_estudiante="DELETE FROM curso_estudiante where id_curso_grupo='$id' ";
				if ($nueva_consulta = $conexion->prepare($sql_curso_estudiante)) {
					$nueva_consulta->execute();
				}else{
					$mensajeError="error de eliminación en la tabla curso_estudiante<br>";
				}
				// tabla curso_equipo_docente 
				$sql_curso_equipo_docente="DELETE FROM curso_equipo_docente where id_curso_grupo='$id' ";
				if ($nueva_consulta = $conexion->prepare($sql_curso_equipo_docente)) {
					$nueva_consulta->execute();
				}else{
					$mensajeError="error de eliminación en la tabla curso_equipo_docente<br>";
				}
				// tabla  clase 
				$sql_clase="DELETE FROM clase where id_curso_grupo='$id' ";
				if ($nueva_consulta = $conexion->prepare($sql_clase)) {
					$nueva_consulta->execute();
				}else{
					$mensajeError="error de eliminación en la tabla clase<br>";
				}
				// tabla planificaciones
				$sql_planificaciones="DELETE FROM planificaciones where id_curso_grupo='$id' ";
				if ($nueva_consulta = $conexion->prepare($sql_planificaciones)) {
					$nueva_consulta->execute();
				}else{
					$mensajeError="error de eliminación en la tabla planificaciones<br>";
				}
				//chequeo que no hay errores
				if($mensajeError==''){
					$respuesta = ['success','Eliminación realizada '];
				}else{
					$respuesta = ['warning','Eliminación realizada parcialmente, '.$mensajeError];
				}
			}else{
				$respuesta = ['success','Eliminación realizada '];
			}
          }else{
            $respuesta = ['error','fallo la eliminación'];
          }    
        }
        echo json_encode($respuesta);
    break;
}

function generateUniqueCode($length) {
    // Genera un código alfanumérico aleatorio
    return bin2hex(random_bytes($length / 2));
}

function isCodeUnique($code, $conexion) {
    // Comprueba la unicidad del código en la base de datos
    $sql_busca="SELECT id FROM curso_grupo WHERE codigo_inscripcion = '$code'";
    $stmt = $conexion->prepare($sql_busca);
    $stmt->execute();
    $resultados = $stmt->get_result();
    return $resultados->num_rows == 0;
}

function getUniqueCode($length, $conexion) {
    //pdo es la conexion
    do {
        $code = generateUniqueCode($length);
    } while (!isCodeUnique($code, $conexion));
    return $code;
}


?>