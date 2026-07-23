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
        //No hay GET
    break;
    case 'POST':
        //el data debe traer: id_formacion, cohorte_año,'nuevo': 'RepetirDocentesCohorteAnterior'
        if(!isset($dataObject->id_formacion) || !isset($dataObject->cohorte_año) || !isset($dataObject->nuevo)){
            $respuesta= ['resultado'=>false,'error'=>'Faltan datos'];
        }else{
            $id_formacion = $dataObject->id_formacion;
            $cohorte_año = $dataObject->cohorte_año;
            $nuevo = $dataObject->nuevo;
            // nuevo debe ser 'RepetirDocentesCohorteAnterior'
            if($nuevo == 'RepetirDocentesCohorteAnterior'){
                //obtener id de la cohorte anterior
                $año_anterior = $cohorte_año - 1;
                $sql_cohorte_anterior = "SELECT id FROM cohorte WHERE id_formacion = ? AND año = ?";
                if($stmt = $conexion->prepare($sql_cohorte_anterior)){
                    $stmt->bind_param("ii", $id_formacion, $año_anterior);
                    $stmt->execute();
                    $resultado = $stmt->get_result();
                    if($resultado->num_rows == 1){
                        $fila = $resultado->fetch_assoc();
                        $id_cohorte_anterior = $fila['id'];
                        //obtener id de la cohorte actual
                        $sql_cohorte_actual = "SELECT id FROM cohorte WHERE id_formacion = ? AND año = ?";
                        if($stmt2 = $conexion->prepare($sql_cohorte_actual)){
                            $stmt2->bind_param("ii", $id_formacion, $cohorte_año);
                            $stmt2->execute();
                            $resultado2 = $stmt2->get_result();
                            if($resultado2->num_rows == 1){
                                $fila2 = $resultado2->fetch_assoc();
                                $id_cohorte_actual = $fila2['id'];
                                // obtengo los cursos de la cohorte anterior tabla curso (importante aqui el campo espacio que dice que materia es), 
                                // la tabla curso_grupo tiene una relacion con la tabla curso mediante id_curso, en esta tabla importante campo seccion,
                                // la tabla curso_equipo_docente tiene relacion con curso_grupo mediante id_curso_grupo y alli estan los docentes asignados a cada curso grupo mediante el id_usuario (docente))
                                // copiar los docentes de la cohorte anterior siguiendo la logica curso_grupo y curso en la actual
                                $sql_docentes_anterior = "SELECT ced.id_usuario, cg.seccion, cg.id as id_curso_grupo,c.espacio 
                                                            FROM curso_equipo_docente ced 
                                                            JOIN curso_grupo cg ON ced.id_curso_grupo = cg.id 
                                                            JOIN curso c ON cg.id_curso = c.id 
                                                            WHERE c.id_cohorte = ?";
                                if($stmt3 = $conexion->prepare($sql_docentes_anterior)){
                                    $stmt3->bind_param("i", $id_cohorte_anterior);
                                    $stmt3->execute();
                                    $resultado3 = $stmt3->get_result();
                                    if($resultado3->num_rows >= 1){
                                        $docentes_anterior = $resultado3->fetch_all(MYSQLI_ASSOC);
                                        // ahora por cada docente buscar el id_curso_grupo en la cohorte actual y asignar el docente
                                        foreach($docentes_anterior as $docente){
                                            $id_usuario = $docente['id_usuario'];
                                            $espacio = $docente['espacio'];
                                            $seccion = $docente['seccion'];
                                            //buscar id_curso_grupo en la cohorte actual
                                            $sql_curso_grupo_actual = "SELECT cg.id
                                                                        FROM curso_grupo cg
                                                                        JOIN curso c ON cg.id_curso = c.id
                                                                        WHERE c.id_cohorte = ? AND c.espacio = ? AND cg.seccion = ?";
                                            if($stmt4 = $conexion->prepare($sql_curso_grupo_actual)){
                                                $stmt4->bind_param("iss", $id_cohorte_actual, $espacio, $seccion);
                                                $stmt4->execute();
                                                $resultado4 = $stmt4->get_result();
                                                if($resultado4->num_rows == 1){
                                                    $fila4 = $resultado4->fetch_assoc();
                                                    $id_curso_grupo_actual = $fila4['id'];
                                                    // insertar en curso_equipo_docente
                                                    $fecha_alta = date('Y-m-d H:i:s');
                                                    $sql_insertar_docente = "INSERT INTO curso_equipo_docente (id_curso_grupo, id_usuario, fecha_alta) VALUES (?, ?, ?)";
                                                    if($stmt5 = $conexion->prepare($sql_insertar_docente)){
                                                        $stmt5->bind_param("iis", $id_curso_grupo_actual, $id_usuario, $fecha_alta);
                                                        $stmt5->execute();
                                                        $stmt5->close();
                                                    }
                                                }
                                                $stmt4->close();
                                            }
                                        }
                                        $respuesta = ['resultado'=>true,'mensaje'=>'Planta docente repetida de la cohorte anterior'];
                                    }else{
                                        $respuesta = ['resultado'=>false,'error'=>'No hay docentes en la cohorte anterior'];
                                    }
                                    $stmt3->close();
                                }else{
                                    $respuesta = ['resultado'=>false,'error'=>'Error en la consulta de docentes de la cohorte anterior'];
                                }
                            }else{
                                $respuesta = ['resultado'=>false,'error'=>'No se encontró la cohorte actual'];
                            }
                        }else{
                            $respuesta = ['resultado'=>false,'error'=>'No se encontró la cohorte actual'];
                        }
                    }else{
                        $respuesta = ['resultado'=>false,'error'=>'No se encontró la cohorte anterior'];
                    }  
                    $stmt->close();
                }else{
                    $respuesta = ['resultado'=>false,'error'=>'Error en la consulta de cohorte anterior'];
                }  
            }else{
                $respuesta = ['resultado'=>false,'error'=>'Acción no reconocida'];
            }
        }
        echo json_encode($respuesta);
    break;
    case 'PUT':
    break;
    case 'DELETE':
    break;
}
?>