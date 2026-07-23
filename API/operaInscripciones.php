<?php

require_once __DIR__ . '/config_cors.php';
$method = $_SERVER['REQUEST_METHOD'];
if ($method == "OPTIONS") {
    http_response_code(200);
    exit();
}

// Aquí va el resto de tu código PHP...
include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$data = json_decode($JSONData);    //convierte el formato json a un formato php

//$data = json_decode(file_get_contents("php://input"), true);

if (isset($data ->usuario) && isset($data->clave) && isset($data->nombre) && isset($data->apellido) && isset($data->documento) && isset($data->codigo)) {
    $usuario = $data->usuario;
    $clave = password_hash($data->clave, PASSWORD_DEFAULT);
    $nombre = $data->nombre;
    $apellido = $data->apellido;
    $documento = $data->documento;
    $codigo = $data->codigo;
    $hijos = $data->hijos;
    $estado=1;

    // Obtener id_curso_grupo
    $stmtCurso = $conexion->prepare("SELECT id FROM curso_grupo WHERE codigo_inscripcion = ?");
    $stmtCurso->bind_param("s", $codigo);
    $stmtCurso->execute();
    $result = $stmtCurso->get_result();
    $curso = $result->fetch_assoc();
    $id_curso_grupo = $curso['id'];

    if (!$id_curso_grupo) {
        http_response_code(400);
        echo json_encode(["error" => "Código de curso inválido"]);
        exit();
    }

    // Insertar tutor 
    $stmt = $conexion->prepare("INSERT INTO usuarios (usuario, clave, nombre, apellido, documento, estado) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $usuario, $clave, $nombre, $apellido, $documento, $estado);

    if ($stmt->execute()) {
        $id_tutor = $stmt->insert_id;
        // Asignar rol al tutor
        $stmtRol = $conexion->prepare("INSERT INTO rol (id_usuario, rol) VALUES (?, 8)");
        $stmtRol->bind_param("i", $id_tutor);
        $stmtRol->execute();

        $fecha_inscripcion = date('Y-m-d H:i:s');
        $usuario_inscribio = 0;
        
        // Inscribir tutor
        //$stmtInscripcion = $conexion->prepare("INSERT INTO curso_estudiante (id_usuario, id_curso_grupo, fecha_inscripcion, usuario_inscribio) VALUES (?, ?, ?, ?)");
        //$stmtInscripcion->bind_param("iisi", $id_tutor, $id_curso_grupo, $fecha_inscripcion, $usuario_inscribio);
        //$stmtInscripcion->execute();

        // Insertar usuarios tutelados
        foreach ($hijos as $hijo) {
            $encript_pass = $clave; //usamos la misma  contraseña que el tutor
            $stmtHijo = $conexion->prepare("INSERT INTO usuarios (usuario, clave, nombre, apellido, documento, estado) VALUES (?, ?, ?, ?, ?, ?)");
            $stmtHijo->bind_param("ssssss",$hijo->documento, $encript_pass, $hijo->nombre, $hijo->apellido, $hijo->documento, $estado);
            if ($stmtHijo->execute()) {
                $id_hijo = $stmtHijo->insert_id;
                //cargar la fecha de nacieimiento en tabla perfil
                $fecha_nac = $hijo->fecnac;
                $stmtPerfil = $conexion->prepare("INSERT INTO usuario_perfil( id_usuario, fecnac) VALUES (?, ?)");
                $stmtPerfil->bind_param("is", $id_hijo, $fecha_nac);
                $stmtPerfil->execute(); 

                // Asignar rol al tutelado como estudiante
                $stmtRolHijo = $conexion->prepare("INSERT INTO rol (id_usuario, rol) VALUES (?, 7)");
                $stmtRolHijo->bind_param("i", $id_hijo);
                $stmtRolHijo->execute();

                // Inscribir estudiante tutelado
                $stmtInscripcionHijo = $conexion->prepare("INSERT INTO curso_estudiante (id_usuario, id_curso_grupo, fecha_inscripcion, usuario_inscribio) VALUES (?, ?, ?, ?)");
                $stmtInscripcionHijo->bind_param("iisi", $id_hijo, $id_curso_grupo, $fecha_inscripcion, $usuario_inscribio);
                $stmtInscripcionHijo->execute();

                //insertar vinculo tutor estudiante
                $stmtVinculo = $conexion->prepare("INSERT INTO vinculo (id_estudiante, id_tutor, descripcion) VALUES (?,?,'')");
                $stmtVinculo->bind_param("ii", $id_hijo, $id_tutor);
                $stmtVinculo->execute();

            }
        }

        echo json_encode(["success" => true, "message" => "Usuarios registrados con éxito. Ingrese el usuario DNI y la contraseña para ingresar a la plataforma, recuerde  que  la  contraseña del estudiante es la misma que la del tutor."]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al registrar el usuario"]);
    }

    $stmt->close();
} else {
    if(isset($data ->id_usuario) && isset($data->codigo) && isset($data ->modulo)){
        if($data ->modulo=='inscribirPorCodigo'){
            $id_estudiante=$data ->id_usuario;
            $codigo = $data->codigo;
    
            $fecha_inscripcion = date('Y-m-d H:i:s');
            $usuario_inscribio = 0;

            // Obtener id_curso_grupo
            $stmtCurso = $conexion->prepare("SELECT id FROM curso_grupo WHERE codigo_inscripcion = ?");
            $stmtCurso->bind_param("s", $codigo);
            $stmtCurso->execute();
            $result = $stmtCurso->get_result();
            $curso = $result->fetch_assoc();
            $id_curso_grupo = $curso['id'];

            if (!$id_curso_grupo) {
                http_response_code(400);
                echo json_encode(["error" => "Código de curso inválido"]);
                exit();
            }
            // Inscribir estudiante tutelado
            $stmtInscripcionHijo = $conexion->prepare("INSERT INTO curso_estudiante (id_usuario, id_curso_grupo, fecha_inscripcion, usuario_inscribio) VALUES (?, ?, ?, ?)");
            $stmtInscripcionHijo->bind_param("iisi", $id_estudiante, $id_curso_grupo, $fecha_inscripcion, $usuario_inscribio);
            $stmtInscripcionHijo->execute();
        }

    }else{
        echo json_encode(["success" => false, "error" => "Datos incompletos"]);
    }
}
$conexion->close();
?>
