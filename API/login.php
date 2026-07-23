<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config_cors.php';
header("Content-Type: text/html; charset=utf-8");
$method = $_SERVER['REQUEST_METHOD'];

require_once __DIR__ . "/conectar.php";
$conexion = conectarDB(); //ejecuta la funcion del conectar

$JSONData = file_get_contents("php://input"); //lee un dato pasada por cualquier fuente al servidor y lo coloca en la variable JSONData
$dataObject = json_decode($JSONData);    //convierte el formato json a un formato php
    
$conexion->set_charset('utf8mb4');
	    
$usuario = $dataObject-> usuario;
$pas =	$dataObject-> clave;

if ($method !== 'POST') {
    echo json_encode(array('conectado' => false, 'error' => 'Método no permitido'));
    $conexion->close();
    exit;
}
if (!isset($usuario) || !isset($pas)) {
    echo json_encode(array('conectado' => false, 'error' => 'Datos incompletos'));
    $conexion->close();
    exit;
}

if ($nueva_consulta = $conexion->prepare("SELECT u.*, rol.rol FROM (SELECT us.id, us.usuario, us.nombre, us.apellido, us.apodo, us.documento, us.clave, p.imagen_perfil, p.color, p.fecnac, p.genero, p.email, p.telefono, p.calle, p.numero, p.piso, p.depto, p.ciudad, p.provincia FROM usuarios us LEFT JOIN usuario_perfil p ON us.id= p.id_usuario)u INNER JOIN rol ON u.id = rol.id_usuario WHERE u.usuario = ? ORDER BY rol.rol ASC LIMIT 1")) {
   
    $nueva_consulta->bind_param('s', $usuario);
    $nueva_consulta->execute();
    $nueva_consulta->store_result();

    if ($nueva_consulta->num_rows >= 1) {
        // Asegúrate de que el número de variables en bind_result coincida con el número de columnas seleccionadas
        $nueva_consulta->bind_result($id, $usuario, $nombre, $apellido, $apodo, $documento, $clave, $imagen_perfil, $color, $fecnac, $genero, $email, $telefono, $calle, $numero, $piso, $depto, $ciudad, $provincia, $rol);

        $nueva_consulta->fetch();

        $datos = [
            'id' => $id,
            'usuario' => $usuario,
            'nombre' => $nombre,
            'apellido' => $apellido,
            'apodo' => $apodo,
            'documento' => $documento,
            'imagen_perfil' => $imagen_perfil,
            'color' => $color,
            'fecnac' => $fecnac,
            'genero' => $genero,
            'email' => $email,
            'telefono' => $telefono,
            'calle' => $calle,
            'numero' => $numero,
            'piso' => $piso,
            'depto' => $depto,
            'ciudad' => $ciudad,
            'provincia' => $provincia,
            'rol' => $rol
        ];

        $encriptado_db = $clave; 
        if (password_verify($pas, $encriptado_db)){
            require_once __DIR__ . '/vendor/autoload.php';
            require_once __DIR__ . '/config_env.php';
            
            $tiempoActual = time();
            $expiracion = $tiempoActual + (60 * 60 * 24 * 180); // 6 meses (aprox 180 días) de expiración.
            $payload = [
                'iss' => JWT_ISSUER,
                'iat' => $tiempoActual,
                'exp' => $expiracion,
                'data' => [
                    'id' => $id,
                    'usuario' => $usuario,
                    'rol' => $rol
                ]
            ];
            
            $jwt = \Firebase\JWT\JWT::encode($payload, JWT_SECRET_KEY, 'HS256');
            
            // Enviamos la cookie HttpOnly
            setcookie("sessionToken", $jwt, [
                'expires' => $expiracion,
                'path' => '/',
                // 'domain' => 'localhost', // Comentado para permitir el dominio dinámico de la IP
                'secure' => false, // false porque estás en localhost/IP (sin HTTPS). En prod debe ser true.
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            
            echo json_encode([
                'conectado' => true, 
                'infoUser' => $datos,
                'token' => $jwt // Se envía para que Flutter lo pueda capturar vía postMessage
            ]);
        } else {
            echo json_encode(['conectado' => false, 'error' => 'La clave es incorrecta, vuelva a intentarlo.']);
        }
    } else {
        echo json_encode(['conectado' => false, 'error' => 'El usuario no existe o no posee un rol']);
    }
    $nueva_consulta->close();
} else {
    echo json_encode(['conectado' => false, 'error' => 'No se pudo conectar a BD']);
}
$conexion->close();
?>