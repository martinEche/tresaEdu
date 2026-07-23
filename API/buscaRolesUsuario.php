<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint

$conexion = conectarDB(); //ejecuta la funcion del conectar
$conexion->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$raw = file_get_contents("php://input");
$dataObject = json_decode($raw);

if (!$dataObject) {
    echo json_encode([
        'resultado' => false,
        'error' => 'JSON inválido o vacío'
    ]);
    exit;
}

$sql="";

//si llega el id de usuario
if(isset($dataObject-> id_usuario)){
    $id_usuario = $dataObject-> id_usuario;
    $sql="SELECT roles.* FROM usuarios, rol, roles WHERE roles.id=rol.rol and usuarios.id= rol.id_usuario and usuarios.id= $id_usuario order by usuarios.id, rol.rol, usuarios.apellido, usuarios.nombre, usuarios.usuario";
}
//si llega el nombre de usuario para buscarRolesUsuario
if(isset($dataObject-> usuario)){
    $usuario = $dataObject-> usuario;
    $sql="SELECT roles.* FROM usuarios, rol, roles WHERE roles.id=rol.rol and usuarios.id= rol.id_usuario and usuarios.usuario= '$usuario' order by usuarios.id, rol.rol, usuarios.apellido, usuarios.nombre, usuarios.usuario";
}

if(isset($dataObject->modo)){
    $modo = $dataObject->modo;
    if($modo =='MostrarRolesDisponibles'){
        $id_usuario = $dataObject-> id_usuario;
        $rol= $dataObject-> rol;
        $sql="SELECT * from roles where id not in (SELECT roles.id FROM usuarios, rol, roles WHERE roles.id=rol.rol and usuarios.id= rol.id_usuario and usuarios.id= $id_usuario order by usuarios.id, rol.rol, usuarios.apellido, usuarios.nombre, usuarios.usuario)";    
    }
}

if ($sql != "") {

    if ($nueva_consulta = $conexion->prepare($sql)) {

        $nueva_consulta->execute();

        // Obtener metadata del result set
        $meta = $nueva_consulta->result_metadata();
        if (!$meta) {
            echo json_encode(['resultado' => false, 'error' => 'No hay metadata']);
            exit;
        }

        $row = [];
        $params = [];

        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }

        call_user_func_array([$nueva_consulta, 'bind_result'], $params);

        $data = [];
        while ($nueva_consulta->fetch()) {
            $data[] = array_map(fn($v) => $v, $row);
        }

        if (count($data) >= 1) {

            echo json_encode($data);

        } else {
            echo json_encode([
                'resultado' => false,
                'error' => 'No existen Resultados.'
            ]);
        }

        $nueva_consulta->close();

    } else {
        echo json_encode([
            'resultado' => false,
            'error' => 'No se pudo conectar a BD'
        ]);
    }

} else {
    echo json_encode([
        'resultado' => false,
        'error' => 'No se recibieron datos'
    ]);
}
$conexion->close();

?>