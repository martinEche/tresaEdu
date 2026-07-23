<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset('utf8mb4');

//$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
//$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
//$buscar = $dataObject-> buscar;
$sql_usuarios= "SELECT usuarios.* FROM usuarios order by usuarios.apellido, usuarios.nombre, usuarios.usuario";
//si no llega un ciclo actua ltomo referencia 2024 para que no de error
$cicloActual=isset($_GET['ciclo'])?$_GET['ciclo']:'2024';

if(isset($_GET['id_usiario'])){
    $id_usuario=$_GET['id_usiario'];
    $sql_cursos="SELECT 
					a.*, 
					(CASE 
						WHEN p.id_curso_grupo IS NOT NULL THEN 1 
						ELSE 0 
					END) AS tiene_planificacion,
					ce2.cant_estudiantes
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
						c.*, 
						co.año AS cohorte,
						e.nombre_espacio, 
						e.orden, 
						cg.denominacion, 
						cg.id AS id_curso_grupo, 
						cg.codigo_inscripcion, 
						f.caratula AS caratula_formacion, 
						f.nivel AS tipo_formacion
					FROM curso AS c
					JOIN curso_grupo AS cg ON c.id = cg.id_curso
					JOIN curso_equipo_docente AS ed ON cg.id = ed.id_curso_grupo
					JOIN espacio AS e ON c.espacio = e.id
					JOIN formacion AS f ON e.id_formacion = f.id
					JOIN cohorte AS co ON c.id_cohorte = co.id
					WHERE ed.id_usuario = $id_usuario
				) a ON ce2.id_curso_grupo = a.id_curso_grupo

				LEFT JOIN (
					SELECT DISTINCT id_curso_grupo
					FROM planificaciones
				) p ON a.id_curso_grupo = p.id_curso_grupo";
}else{
    $sql_cursos="SELECT cg.*, c.*, e.*, co.año as cohorte FROM curso_grupo as cg, curso as c, espacio as e, cohorte as co where co.id = c.id_cohorte and e.id=c.espacio and cg.id_curso=c.id and c.estado='abierto'";
}
$sql_estudiantes="SELECT e.* FROM curso_grupo as cg, curso as c, curso_estudiante as e where cg.id=e.id_curso_grupo and cg.id_curso=c.id and c.estado='abierto' group by e.id_usuario";
$sql_docentes="SELECT ed.* FROM curso_equipo_docente as ed, curso as c, curso_grupo as cg where c.id=cg.id_curso and cg.id= ed.id_curso_grupo and c.estado='Abierto' group by ed.id_usuario";

//matricula general
$sql_Matricula="SELECT co.año, es.orden, COUNT(DISTINCT e.id_usuario) AS total_estudiantes FROM curso_grupo AS cg INNER JOIN curso AS c ON cg.id_curso = c.id INNER JOIN curso_estudiante AS e ON cg.id = e.id_curso_grupo INNER JOIN cohorte AS co ON co.id = c.id_cohorte INNER JOIN espacio AS es ON c.espacio = es.id WHERE c.estado = 'abierto' GROUP BY co.año, es.orden ORDER BY co.año, es.orden";
//matricula inicial
$sql_Matricula_Inicial="SELECT co.año, es.orden, COUNT(DISTINCT e.id_usuario) AS total_estudiantes FROM curso_grupo AS cg INNER JOIN curso AS c ON cg.id_curso = c.id INNER JOIN curso_estudiante AS e ON cg.id = e.id_curso_grupo INNER JOIN cohorte AS co ON co.id = c.id_cohorte INNER JOIN espacio AS es ON c.espacio = es.id WHERE co.año='$cicloActual' and es.orden like 'S%' GROUP BY co.año, es.orden ORDER BY es.orden ASC";
//matricula Primaria
$sql_Matricula_Primaria="SELECT co.año, es.orden, COUNT(DISTINCT e.id_usuario) AS total_estudiantes FROM curso_grupo AS cg INNER JOIN curso AS c ON cg.id_curso = c.id INNER JOIN curso_estudiante AS e ON cg.id = e.id_curso_grupo INNER JOIN cohorte AS co ON co.id = c.id_cohorte INNER JOIN espacio AS es ON c.espacio = es.id WHERE co.año='$cicloActual' and not(es.orden like 'S%') GROUP BY co.año, es.orden ORDER BY es.orden ASC";

if ($nueva_consulta = $conexion->prepare($sql_usuarios)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    $usuarios=$resultado->num_rows;
}else{
    $usuarios = 'error';
}
$nueva_consulta ->close();

if ($nueva_consulta = $conexion->prepare($sql_cursos)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    $cursos=$resultado->num_rows;
    $arregloCursos=$resultado->fetch_all(MYSQLI_ASSOC);
}else{
    $cursos = 'error';
}
$nueva_consulta ->close();

if ($nueva_consulta = $conexion->prepare($sql_estudiantes)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    $estudiantes=$resultado->num_rows;
}else{
    $estudiantes = 'error';
}
$nueva_consulta ->close();

if ($nueva_consulta = $conexion->prepare($sql_docentes)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    $docentes=$resultado->num_rows;
}else{
    $docentes = 'error';
}
$nueva_consulta ->close();

//MATRICULA
//primero obtengo las formaciones de las cuales tengo cohortes creadas
//formaciones que se han creado cohorte
$slq_formaciones="SELECT co.id_formacion, f.nombre_formacion, n.denominacion as nivel 
					FROM cohorte as co 
					INNER JOIN formacion AS f ON co.id_formacion = f.id 
					INNER JOIN nivel as n ON f.nivel =n.id 
					group by 1";
// por cada formacionobtengo dos consultas:
// el general historico de matricula cuantos estudiantes en 2024 cuantos en 2025 cunatos en 2026 en cada formacion
// luego obtengo por cada formacion el detalle de matricula por orden es decir cuantos en 1ro, en 2do en 3ro pero del siclo actual
if($nueva_consulta = $conexion->prepare($slq_formaciones)) {
	$nueva_consulta->execute();
	$resultado = $nueva_consulta->get_result();
	$formaciones=$resultado->fetch_all(MYSQLI_ASSOC);
	foreach($formaciones as &$formacion){
		$id_formacion=$formacion['id_formacion'];
		$sql_Matricula_Formacion="SELECT co.año, es.orden, COUNT(DISTINCT e.id_usuario) AS total_estudiantes 
									FROM curso_grupo AS cg 
									INNER JOIN curso AS c ON cg.id_curso = c.id 
									INNER JOIN curso_estudiante AS e ON cg.id = e.id_curso_grupo 
									INNER JOIN cohorte AS co ON co.id = c.id_cohorte 
									INNER JOIN espacio AS es ON c.espacio = es.id 
									WHERE es.id_formacion=? 
									 GROUP BY co.año, es.orden 
									 ORDER BY co.año asc, es.orden asc";
		if ($nueva_consulta2 = $conexion->prepare($sql_Matricula_Formacion)) {
			$nueva_consulta2->bind_param("i", $id_formacion);
			$nueva_consulta2->execute();
			$resultado2 = $nueva_consulta2->get_result();
			$formacion['matricula']=$resultado2->fetch_all(MYSQLI_ASSOC);
		}else{
			$formacion['matricula'] = 'error';
		}
		$nueva_consulta2 ->close();	
	}
}else{
	$formaciones = 'error';
}

//Matricula General
if ($nueva_consulta = $conexion->prepare($sql_Matricula)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    $matricula=$resultado->fetch_all(MYSQLI_ASSOC);
}else{
    $matricula = 'error';
}
$nueva_consulta ->close();

//Matricula Inicial
if ($nueva_consulta = $conexion->prepare($sql_Matricula_Inicial)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    $matriculaI=$resultado->fetch_all(MYSQLI_ASSOC);
}else{
    $matriculaI = 'error';
}
$nueva_consulta ->close();

//Matricula Primaria
if ($nueva_consulta = $conexion->prepare($sql_Matricula_Primaria)) {
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();
    $matriculaP=$resultado->fetch_all(MYSQLI_ASSOC);
}else{
    $matriculaP = 'error';
}
$nueva_consulta ->close();

echo json_encode(
	['usuarios'=>$usuarios, 
	 'cursos'=>$cursos, 
	  'estudiantes'=>$estudiantes, 
	  'docentes'=>$docentes,
	  'matricula'=>$matricula,
	  'matriculaI'=>$matriculaI,
	  'matriculaP'=>$matriculaP,
	  'arregloCursos'=>$arregloCursos,
	  'formaciones'=>$formaciones
	]);

$conexion->close();
?>