<?php
include "conectar.php";
$conexion = conectarDB();
$id_curso_grupo = 23;

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

        foreach ($clases as &$clase) {
            $clase['materiales'] = array_values(array_filter($materiales, function($m) use ($clase) {
                return $m['id_clase'] == $clase['id'];
            }));
        }
        unset($clase);
    }
    
    foreach($clases as $c) {
        if ($c['id'] == 26) {
            echo "Clase 26 materiales count: " . count($c['materiales']) . "\n";
            echo json_encode($c['materiales']) . "\n";
        }
    }
}
?>
