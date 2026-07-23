<?php
include "API/conectar.php";
$conexion = conectarDB();
$id_trabajo = 6; // from previous DB dump id_trabajo=6 was the reentrega one
$id_estudiante = 1;

$sql_entrega = "SELECT e.*, ea.adjunto, ea.nombre_archivo 
                FROM entregas e 
                LEFT JOIN entrega_adjunto ea ON e.id_entrega = ea.id_entrega 
                WHERE e.id_trabajo = ? AND e.id_estudiante = ? LIMIT 1";
$stmt_entrega = $conexion->prepare($sql_entrega);
$stmt_entrega->bind_param("ii", $id_trabajo, $id_estudiante);
$stmt_entrega->execute();
$res = $stmt_entrega->get_result();
if($row = $res->fetch_assoc()){
    print_r($row);
} else {
    echo "No entrega found!";
}
?>
