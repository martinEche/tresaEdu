<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input");
$dataObject = json_decode($JSONData);

switch ($method) {
    //PROMOCIÓN DE ESTUDIANTES
    case 'POST':
        if (!isset($dataObject->accion) || $dataObject->accion !== 'promover') {
            echo json_encode([
                "error" => true,
                "mensaje" => "Acción no válida"
            ]);
            exit;
        }

        $cohorte_origen  = intval($dataObject->cohorte_origen);
        $cohorte_destino = intval($dataObject->cohorte_destino);
        $curso_origen    = $dataObject->curso_origen;   // ej: 6-A
        $curso_destino   = $dataObject->curso_destino;  // ej: 1-A
        $estudiantes     = $dataObject->estudiantes;

        if (
            empty($cohorte_origen) ||
            empty($cohorte_destino) ||
            empty($curso_origen) ||
            empty($curso_destino) ||
            empty($estudiantes)
        ) {
            echo json_encode([
                "error" => true,
                "mensaje" => "Datos incompletos"
            ]);
            exit;
        }
        // obtengo seccion y orden del curso destino
        list($ordenDestino, $seccionDestino) = explode("-", $curso_destino);
        // busco todos los cursos_grupos de la cohorte orden y seccion destino
        $sqlCursoDestino="SELECT cg.id as id_curso_grupo, e.id as id_espacio, e.nombre_espacio, e.orden, cg.seccion 
                            FROM cohorte as co, curso as c, 
                            espacio as e, 
                            curso_grupo as cg 
                            WHERE cg.id_curso=c.id 
                                and e.id=c.espacio 
                                and c.id_cohorte=co.id 
                                and co.id= ?
                                and e.orden= ? 
                                and cg.seccion= ?";

        $stmt = $conexion->prepare($sqlCursoDestino);
        $stmt->bind_param("iis", $cohorte_destino, $ordenDestino, $seccionDestino);
        $stmt->execute();

        $res = $stmt->get_result();

        if ($res->num_rows === 0) {
            echo json_encode([
                "error" => true,
                "mensaje" => "No existe el curso destino para esa formación"
            ]);
            exit;
        }

        // obtengo datos del curso destino
        $cursosDestinoData = $res->fetch_all(MYSQLI_ASSOC);
       // $id_curso_grupo_destino = $cursosDestinoData['id_curso_grupo'];

        // PROMOVER ESTUDIANTES

        $promovidos = [];
        $omitidos   = [];

        foreach ($estudiantes as $id_usuario) {
            echo "\nProcesando estudiante ID: $id_usuario\n";
            
            foreach ($cursosDestinoData as $cursoDestino) {
                $id_curso_grupo_destino = $cursoDestino['id_curso_grupo'];
                echo "  Intentando inscribir en curso_grupo ID: $id_curso_grupo_destino\n";
                // evitar doble inscripción
                $check = $conexion->prepare("
                    SELECT id FROM curso_estudiante
                    WHERE id_usuario = ?
                    AND id_curso_grupo = ?
                ");
                $check->bind_param("ii", $id_usuario, $id_curso_grupo_destino);
                $check->execute();
                $checkRes = $check->get_result();

                if ($checkRes->num_rows > 0) {
                    continue;
                }

                // insertar estudiante en el curso_grupo destino
                $insert = $conexion->prepare("
                    INSERT INTO curso_estudiante
                    (id_usuario, id_curso_grupo)
                    VALUES (?, ?)
                ");

                if ($insert->bind_param("ii", $id_usuario, $id_curso_grupo_destino) &&
                    $insert->execute()) {

                    $promovidos[$id_usuario] = true;
                }
            }
        }

        echo json_encode([
            "error" => false,
            "promovidos" => $promovidos,
            "omitidos" => $omitidos,
            "mensaje" => "Proceso de promoción finalizado"
        ]);

        break;

    default:
        echo json_encode([
            "error" => true,
            "mensaje" => "Método no permitido"
        ]);
        break;
}
?>