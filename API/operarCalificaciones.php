<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); 

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$modo = $dataObject->modo;


$method = $_SERVER['REQUEST_METHOD'];

if($method==='POST'){      

    if(isset($dataObject->modo) && isset($dataObject->id_usuario) && isset($dataObject->ciclo)){
        $modo = $dataObject->modo;
        $id_usuario= $dataObject->id_usuario;
        $ciclo= $dataObject->ciclo;

        //Modo buscar Cursos Calificaciones e instancias
        if(($modo=='buscarCursosyCalificaciones') && ($id_usuario!='')){
            $cohort_filter = "AND CURRENT_TIMESTAMP(6) BETWEEN co.fecha_inicio AND co.fecha_cierre";
            if (isset($dataObject->id_cohorte) && !empty($dataObject->id_cohorte)) {
                $id_cohorte = (int)$dataObject->id_cohorte;
                $cohort_filter = "AND co.id = $id_cohorte";
            }

            //busca cursos
            $sql="SELECT 
                    c.id,
                    e.nombre_espacio,
                    e.orden,
                    cg.seccion,
                    cg.denominacion,
                    f.nombre_formacion,
                    co.año,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM valoracion v
                            INNER JOIN instancia_calificacion ic
                                ON ic.id = v.id_instancia
                            WHERE v.id_curso = c.id
                                AND v.id_usuario = ce.id_usuario
                                AND UPPER(ic.nombre_instancia) = 'FINAL'
                                AND (
                                    (
                                        v.valor REGEXP '^[0-9]+([.][0-9]+)?$'
                                        AND CAST(v.valor AS DECIMAL(10,2)) >= 6
                                    )
                                    OR
                                    UPPER(TRIM(v.valor)) = 'LOGRADO'
                                )
                        )
                        THEN 1
                        ELSE 0
                    END AS aprobado

                FROM curso_estudiante ce
                JOIN curso_grupo cg 
                    ON ce.id_curso_grupo = cg.id
                JOIN curso c 
                    ON cg.id_curso = c.id
                JOIN espacio e 
                    ON c.espacio = e.id
                JOIN cohorte co 
                    ON c.id_cohorte = co.id
                JOIN formacion f
                    ON co.id_formacion = f.id
                WHERE ce.id_usuario = '$id_usuario'
                $cohort_filter";
                
            if($nueva_consulta = $conexion->prepare($sql)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows >= 1) {
                    $cursos=$resultado->fetch_all(MYSQLI_ASSOC);
                }else {
                    $cursos = [];
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query1'));
                exit;
            }
            // buscarCalificaciones
            $sql_valoraciones_simple="SELECT 
                                        v.*,
                                        co.id AS id_cohorte
                                    FROM valoracion v
                                    JOIN curso c 
                                        ON c.id = v.id_curso
                                    JOIN cohorte co 
                                        ON co.id = c.id_cohorte
                                    WHERE v.id_usuario = '$id_usuario'
                                    $cohort_filter";
                
            if($nueva_consulta = $conexion->prepare($sql_valoraciones_simple)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows >= 1) {
                    $valoraciones= $resultado->fetch_all(MYSQLI_ASSOC);
                }else {
                    $valoraciones=[];
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query2'));
                exit;
            }
            //buscar instancias
            $sql_instancias_simple="SELECT DISTINCT i.*
                                    FROM instancia_calificacion AS i
                                    JOIN cohorte AS co 
                                        ON i.id_cohorte = co.id
                                    JOIN curso AS c 
                                        ON c.id_cohorte = co.id
                                    JOIN curso_grupo AS cg 
                                        ON cg.id_curso = c.id
                                    JOIN curso_estudiante AS ce 
                                        ON ce.id_curso_grupo = cg.id
                                    WHERE ce.id_usuario = $id_usuario
                                    $cohort_filter
                                    ORDER BY i.fecha_inicio ASC";
            if($nueva_consulta = $conexion->prepare($sql_instancias_simple)) {
                $nueva_consulta->execute();
                $resultado = $nueva_consulta->get_result();
                if ($resultado->num_rows >= 1) {
                    $instancias= $resultado->fetch_all(MYSQLI_ASSOC);
                }else {
                    $instancias=[];
                }
            }else{
                echo json_encode(array('resultado'=>false, 'error' => 'No se pudo realizar la query3'));
                exit;
            }
            // muestro cursos valoraciones e instancias
            echo json_encode(['resultado'=>true, 'cursos'=>$cursos, 'valoraciones'=> $valoraciones, 'instancias'=>$instancias]);
        }else{
            echo json_encode(array('resultado'=>false, 'error' => 'No es modo buscarCursosyCalificaciones'));
            exit;
        }
    }else{
        echo json_encode(array('resultado'=>false, 'error' => 'No estan la variables minimas'));
    }
}else{
    echo json_encode(array('resultado'=>false, 'error' => 'No es methodo POST'));
    //echo json_encode(array('resultado'=>true, 'cursos'=>[], 'valoraciones'=>[],  'instancias'=>[]));
}
$conexion->close();
?>
                