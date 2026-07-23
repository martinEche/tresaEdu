<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

if(isset($_GET['id_tutor'])){
    $id_tutor = $_GET['id_tutor'];

    $sql_vinculados = "SELECT 
                            u.id AS estudiante_id, 
                            u.usuario, 
                            u.nombre, 
                            u.apellido, 
                            u.apodo, 
                            u.documento, 
                            u.estado, 
                            up.imagen_perfil,
                            c.id AS curso_id, 
                            c.nombre AS curso_nombre, 
                            cg.seccion, 
                            cg.denominacion, 
                            cg.fecha_inicio, 
                            cg.fecha_fin,
                            e.orden
                        FROM usuarios u
                        JOIN vinculo v ON u.id = v.id_estudiante
                        LEFT JOIN usuario_perfil up ON u.id = up.id_usuario
                        LEFT JOIN curso_estudiante ce ON u.id = ce.id_usuario
                        LEFT JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id
                        LEFT JOIN curso c ON cg.id_curso = c.id
                        LEFT JOIN espacio e ON c.espacio = e.id 
                        WHERE v.id_tutor = ?";
    
    if(isset($_GET['agrupado'])){
        $sql_vinculados =$sql_vinculados." GROUP BY e.orden"; 
    } else{}

    if ($nueva_consulta = $conexion->prepare($sql_vinculados)) {
        $nueva_consulta->bind_param("i", $id_tutor); // Falta corregida: Asigna el parámetro
        $nueva_consulta->execute();
        $resultado = $nueva_consulta->get_result();
        
        if ($resultado->num_rows >= 1) {
             while ($fila = $resultado->fetch_assoc()) {
                $estudiantes[] = $fila;
             }
        }else{
            $estudiantes = $sql_vinculados;
        }

        echo json_encode(['error' => false, 'datos' => $estudiantes]);
        $nueva_consulta->close();
    } else {
        echo json_encode(['error' => true, 'mensaje' => 'Error en la consulta']);
    }
}

$conexion->close();
?>
