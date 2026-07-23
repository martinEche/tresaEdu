<?php

require_once __DIR__ . '/config_cors.php';
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

include "conectar.php";

require_once 'validarToken.php';
$tokenData = validarToken(); // Protegemos el endpoint (obliga a tener token)

$conexion = conectarDB();
if (!$conexion) {
    echo json_encode(["success" => false, "message" => "Error de conexion a la base de datos."]);
    exit;
}
$conexion->set_charset('utf8mb4');

// Capa de autorización: Solo Tesorero (Rol 13) tiene acceso.
// Verificamos si el usuario tiene asignado el rol 13 en la base de datos.
$idUsuarioLogueado = intval($tokenData->id);
$sql_check_rol = "SELECT 1 FROM rol WHERE id_usuario = ? AND rol = '13'";
$tiene_rol_tesorero = false;

if ($stmt_check = $conexion->prepare($sql_check_rol)) {
    $stmt_check->bind_param("i", $idUsuarioLogueado);
    $stmt_check->execute();
    $stmt_check->store_result();
    if ($stmt_check->num_rows > 0) {
        $tiene_rol_tesorero = true;
    }
    $stmt_check->close();
}

if (!$tiene_rol_tesorero) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Acceso denegado. El usuario " . $idUsuarioLogueado . " (usuario: " . ($tokenData->usuario ?? 'desconocido') . ") no posee el rol de Tesorero (13) en la base de datos.",
        "debug" => [
            "token_id" => $idUsuarioLogueado,
            "token_usuario" => $tokenData->usuario ?? null,
            "token_rol" => $tokenData->rol ?? null
        ]
    ]);
    exit;
}

$JSONData = file_get_contents("php://input");
$dataObject = json_decode($JSONData);

// Helper para extraer parámetros de cualquier método (JSON, POST, GET)
function getParam($key, $default = null) {
    global $dataObject;
    if (isset($_GET[$key])) {
        return $_GET[$key];
    }
    if (isset($_POST[$key])) {
        return $_POST[$key];
    }
    if ($dataObject && isset($dataObject->$key)) {
        return $dataObject->$key;
    }
    return $default;
}

switch($method){
    case 'GET':
        $accion = getParam('accion');
        
        if ($accion === 'metricas') {
            // KPIs de cobranza
            $sql_totales = "SELECT 
                COALESCE(SUM(monto_final), 0) as facturado_total,
                COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto_final ELSE 0 END), 0) as cobrado_total,
                COALESCE(SUM(CASE WHEN estado != 'pagado' AND fecha_vencimiento >= CURDATE() THEN monto_final ELSE 0 END), 0) as pendiente_total,
                COALESCE(SUM(CASE WHEN estado != 'pagado' AND fecha_vencimiento < CURDATE() THEN monto_final ELSE 0 END), 0) as vencido_total,
                COUNT(id) as total_cuotas,
                SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as cuotas_pagadas,
                SUM(CASE WHEN estado != 'pagado' AND fecha_vencimiento < CURDATE() THEN 1 ELSE 0 END) as cuotas_vencidas
            FROM cuotas";
            
            $res = $conexion->query($sql_totales);
            $metricas = $res->fetch_assoc();
            
            echo json_encode([
                "success" => true,
                "metricas" => $metricas
            ]);
            exit;
            
        } elseif ($accion === 'estudiante_cuotas') {
            $id_estudiante = intval(getParam('id_estudiante', 0));
            if ($id_estudiante === 0) {
                echo json_encode(["success" => false, "message" => "ID de estudiante invalido"]);
                exit;
            }
            
            // Buscar cuotas y unirlas con sus pagos si existen
            $sql = "SELECT c.*, p.metodo, p.fecha_pago, p.archivo_comprobante 
                    FROM cuotas c 
                    LEFT JOIN pagos p ON c.id = p.id_cuota 
                    WHERE c.id_usuario_estudiante = ? 
                    ORDER BY c.anio DESC, c.mes DESC";
            
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("i", $id_estudiante);
                $stmt->execute();
                $resultado = $stmt->get_result();
                $cuotas = $resultado->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                
                // Obtener datos del alumno
                $sql_est = "SELECT id, nombre, apellido, documento, usuario FROM usuarios WHERE id = ?";
                $stmt_est = $conexion->prepare($sql_est);
                $stmt_est->bind_param("i", $id_estudiante);
                $stmt_est->execute();
                $alumno = $stmt_est->get_result()->fetch_assoc();
                $stmt_est->close();
                
                echo json_encode([
                    "success" => true,
                    "cuotas" => $cuotas,
                    "alumno" => $alumno
                ]);
            } else {
                echo json_encode(["success" => false, "message" => "Error en la consulta"]);
            }
            exit;
            
        } elseif ($accion === 'alertas') {
            // Cuotas adeudadas (vencidas e impagas)
            $sql = "SELECT c.id, c.mes, c.anio, c.monto_final, c.fecha_vencimiento, 
                           u.id as id_usuario, u.nombre, u.apellido, u.documento
                    FROM cuotas c
                    JOIN usuarios u ON c.id_usuario_estudiante = u.id
                    WHERE c.estado != 'pagado' AND c.fecha_vencimiento < CURDATE()
                    ORDER BY c.fecha_vencimiento ASC";
                    
            $res = $conexion->query($sql);
            $alertas = [];
            if ($res) {
                $alertas = $res->fetch_all(MYSQLI_ASSOC);
            }
            
            echo json_encode([
                "success" => true,
                "alertas" => $alertas
            ]);
            exit;
            
        } elseif ($accion === 'buscar_estudiantes') {
            $buscar = $conexion->real_escape_string(getParam('buscar', ''));
            $cohorte_filtro = intval(getParam('cohorte', 0));
            
            $where_sub = "";
            if ($cohorte_filtro > 0) {
                $where_sub = " AND co.id = $cohorte_filtro ";
            }
            
            // Query para listar alumnos con conteos de cuotas
            $sql = "SELECT 
                        u.id, 
                        u.nombre, 
                        u.apellido, 
                        u.documento,
                        SUM(CASE WHEN c.estado = 'pagado' THEN 1 ELSE 0 END) as pagadas,
                        SUM(CASE WHEN c.estado != 'pagado' AND c.fecha_vencimiento >= CURDATE() THEN 1 ELSE 0 END) as pendientes,
                        SUM(CASE WHEN c.estado != 'pagado' AND c.fecha_vencimiento < CURDATE() THEN 1 ELSE 0 END) as vencidas,
                        COALESCE(SUM(c.monto_final), 0) as total_facturado,
                        COALESCE(SUM(CASE WHEN c.estado = 'pagado' THEN c.monto_final ELSE 0 END), 0) as total_pagado
                    FROM usuarios u
                    LEFT JOIN cuotas c ON u.id = c.id_usuario_estudiante
                    WHERE u.id IN (
                        SELECT DISTINCT ce.id_usuario 
                        FROM curso_estudiante ce
                        JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id
                        JOIN curso c_sub ON cg.id_curso = c_sub.id
                        JOIN cohorte co ON c_sub.id_cohorte = co.id
                        WHERE 1=1 $where_sub
                    ) ";
            
            if ($buscar !== '') {
                $sql .= " AND (u.nombre LIKE '%$buscar%' OR u.apellido LIKE '%$buscar%' OR u.documento LIKE '%$buscar%') ";
            }
            
            $sql .= " GROUP BY u.id ORDER BY u.apellido, u.nombre";
            
            $res = $conexion->query($sql);
            $estudiantes = [];
            if ($res) {
                $estudiantes = $res->fetch_all(MYSQLI_ASSOC);
            }
            
            echo json_encode([
                "success" => true,
                "estudiantes" => $estudiantes
            ]);
            exit;
            
        } elseif (isset($_GET['cohorte'])) { 
            $cohorte = intval($_GET['cohorte']);
            $sql = "SELECT mes FROM cuotas_mes WHERE cohorte = $cohorte";
            $res = $conexion->query($sql);

            $meses = [];
            while ($row = $res->fetch_assoc()) {
                $meses[] = intval($row['mes']);
            }
           
            echo json_encode([
                "success" => true,
                "mesesGenerados" => $meses,
            ]);
            exit;
        } else {
            // Busca todos los meses creados independiente de la cohorte
            $sql_cuotas_generadas = "SELECT cm.id, f.nombre_formacion, cm.cohorte, cm.mes, cm.anio, cm.fecha_creacion 
                                     FROM cuotas_mes as cm
                                     JOIN cohorte as co ON cm.cohorte = co.id 
                                     JOIN formacion as f ON f.id = co.id_formacion
                                     ORDER BY cm.fecha_creacion DESC";
            $res = $conexion->query($sql_cuotas_generadas);
            $mesesTodos = [];
            if ($res) {
                $mesesTodos = $res->fetch_all(MYSQLI_ASSOC);
            }
            echo json_encode([
                "success" => true,
                "mesesGeneradosTodos" => $mesesTodos
            ]);
            exit;
        }
        break;
        
    case 'POST':
        $accion = getParam('accion');
        
        if ($accion === 'registrar_pago') {
            $id_cuota = intval(getParam('id_cuota'));
            $descuento = floatval(getParam('descuento', 0));
            $recargo = floatval(getParam('recargo', 0));
            $metodo = $conexion->real_escape_string(getParam('metodo', 'efectivo'));
            
            if ($id_cuota <= 0) {
                echo json_encode(["success" => false, "mensaje" => "ID de cuota invalido"]);
                exit;
            }
            
            // Buscar la cuota
            $res_cuota = $conexion->query("SELECT monto_original, impuestos, id_usuario_estudiante, mes, anio FROM cuotas WHERE id = $id_cuota");
            if ($res_cuota->num_rows == 0) {
                echo json_encode(["success" => false, "mensaje" => "No se encontro la cuota especificada"]);
                exit;
            }
            $cuota = $res_cuota->fetch_assoc();
            
            $monto_original = floatval($cuota['monto_original']);
            $impuestos = floatval($cuota['impuestos']);
            
            // Calcular monto final
            $subtotal = $monto_original + ($monto_original * $impuestos / 100);
            $monto_final = $subtotal - $descuento + $recargo;
            
            // Procesar subida de archivo si existe
            $archivo_nombre = null;
            if (isset($_FILES['comprobante']) && $_FILES['comprobante']['error'] === UPLOAD_ERR_OK) {
                $dir_subida = __DIR__ . '/uploads/comprobantes/';
                if (!file_exists($dir_subida)) {
                    mkdir($dir_subida, 0777, true);
                }
                
                $extension = pathinfo($_FILES['comprobante']['name'], PATHINFO_EXTENSION);
                $nombre_original_clean = preg_replace("/[^a-zA-Z0-9\._-]/", "_", pathinfo($_FILES['comprobante']['name'], PATHINFO_FILENAME));
                $archivo_nombre = "comprobante_" . $id_cuota . "_" . uniqid() . "." . $extension;
                
                if (!move_uploaded_file($_FILES['comprobante']['tmp_name'], $dir_subida . $archivo_nombre)) {
                    echo json_encode(["success" => false, "mensaje" => "Error al guardar el archivo fisico del comprobante"]);
                    exit;
                }
            }
            
            // Actualizar cuota
            $sql_upd = "UPDATE cuotas SET estado = 'pagado', descuento = ?, recargo = ?, monto_final = ? WHERE id = ?";
            if ($stmt = $conexion->prepare($sql_upd)) {
                $stmt->bind_param("dddi", $descuento, $recargo, $monto_final, $id_cuota);
                if ($stmt->execute()) {
                    $stmt->close();
                    
                    // Buscar si el estudiante tiene un tutor vinculado
                    $id_tutor = 0;
                    $res_tutor = $conexion->query("SELECT id_tutor FROM vinculo WHERE id_estudiante = " . intval($cuota['id_usuario_estudiante']) . " LIMIT 1");
                    if ($res_tutor && $res_tutor->num_rows > 0) {
                        $row_tutor = $res_tutor->fetch_assoc();
                        $id_tutor = intval($row_tutor['id_tutor']);
                    }
                    if ($id_tutor === 0) {
                        $id_tutor = intval($cuota['id_usuario_estudiante']);
                    }

                    // Insertar en pagos
                    $sql_pago = "INSERT INTO pagos(id_cuota, id_usuario_tutor, monto_pagado, metodo, archivo_comprobante, estado_mp) 
                                 VALUES (?, ?, ?, ?, ?, 'aprobado')";
                    if ($stmt_p = $conexion->prepare($sql_pago)) {
                        $stmt_p->bind_param("iidss", $id_cuota, $id_tutor, $monto_final, $metodo, $archivo_nombre);
                        $stmt_p->execute();
                        $stmt_p->close();
                    }
                    
                    echo json_encode([
                        "success" => true,
                        "mensaje" => "Pago registrado correctamente",
                        "monto_final" => $monto_final,
                        "comprobante" => $archivo_nombre
                    ]);
                } else {
                    if ($archivo_nombre) {
                        unlink($dir_subida . $archivo_nombre);
                    }
                    echo json_encode(["success" => false, "mensaje" => "Error al actualizar el estado de la cuota: " . $stmt->error]);
                    $stmt->close();
                }
            } else {
                echo json_encode(["success" => false, "mensaje" => "Error al preparar la consulta de actualizacion"]);
            }
            exit;
            
        } elseif ($accion === 'crear_notificacion') {
            $id_usuario = intval(getParam('id_usuario'));
            $titulo = $conexion->real_escape_string(getParam('titulo', 'Aviso de Pago'));
            $desarrollo = $conexion->real_escape_string(getParam('desarrollo', ''));
            
            if ($id_usuario <= 0 || empty($desarrollo)) {
                echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios para la notificacion."]);
                exit;
            }
            
            $sql = "INSERT INTO notificaciones(titulo, desarrollo, tipo, id_usuario) VALUES (?, ?, 'cuotas', ?)";
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("ssi", $titulo, $desarrollo, $id_usuario);
                if ($stmt->execute()) {
                    // Buscar si el usuario tiene correos electrónicos registrados en usuario_perfil
                    $email = '';
                    $email2 = '';
                    $nombre = '';
                    $apellido = '';
                    
                    $sql_user = "SELECT u.nombre, u.apellido, up.email, up.email2 
                                 FROM usuarios u 
                                 LEFT JOIN usuario_perfil up ON u.id = up.id_usuario 
                                 WHERE u.id = ?";
                    if ($stmt_u = $conexion->prepare($sql_user)) {
                        $stmt_u->bind_param("i", $id_usuario);
                        $stmt_u->execute();
                        $res_u = $stmt_u->get_result();
                        if ($row_u = $res_u->fetch_assoc()) {
                            $email = trim($row_u['email'] ?? '');
                            $email2 = trim($row_u['email2'] ?? '');
                            $nombre = $row_u['nombre'] ?? '';
                            $apellido = $row_u['apellido'] ?? '';
                        }
                        $stmt_u->close();
                    }
                    
                    $email_enviado = false;
                    if (!empty($email) || !empty($email2)) {
                        require_once __DIR__ . '/enviar_email.php';
                        
                        $destinatarios = [];
                        if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                            $destinatarios[] = $email;
                        }
                        if (!empty($email2) && filter_var($email2, FILTER_VALIDATE_EMAIL)) {
                            $destinatarios[] = $email2;
                        }
                        
                        if (!empty($destinatarios)) {
                            $asuntoEmail = $titulo;
                            $cuerpoEmail = "Hola " . htmlspecialchars($nombre . " " . $apellido) . ",<br><br>" .
                                           "Tienes una nueva notificación en la plataforma:<br><br>" .
                                           "<strong>" . htmlspecialchars($titulo) . "</strong><br>" .
                                           nl2br(htmlspecialchars($desarrollo)) . "<br><br>" .
                                           "Por favor, ingresa a la plataforma para más detalles.";
                            
                            $urlAcceso = obtenerFrontendUrlDinamico();
                            $htmlEmail = obtenerPlantillaEmail($titulo, $cuerpoEmail, $urlAcceso);
                            
                            foreach ($destinatarios as $dest) {
                                if (enviarEmailPlataforma($dest, $asuntoEmail, $htmlEmail)) {
                                    $email_enviado = true;
                                }
                            }
                        }
                    }
                    
                    $msg = "Notificacion enviada correctamente";
                    if ($email_enviado) {
                        $msg .= " y notificada por correo electronico.";
                    }
                    echo json_encode(["success" => true, "mensaje" => $msg]);
                } else {
                    echo json_encode(["success" => false, "mensaje" => "Error al insertar notificacion"]);
                }
                $stmt->close();
            } else {
                echo json_encode(["success" => false, "message" => "Error en la consulta"]);
            }
            exit;
            
        } elseif ($accion === 'facturar_faltantes') {
            $cohorte = intval(getParam('cohorte'));
            $mes = intval(getParam('mes'));
            $anio = intval(getParam('anio'));
            
            if ($cohorte <= 0 || $mes <= 0 || $anio <= 0) {
                echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios para buscar estudiantes faltantes."]);
                exit;
            }
            
            // 1. Obtener la plantilla de cuota existente para esta cohorte, mes y año para usar sus valores
            // (monto_original, impuestos, fecha_vencimiento)
            $sql_plantilla = "SELECT monto_original, impuestos, fecha_vencimiento 
                              FROM cuotas 
                              WHERE mes = ? AND anio = ? 
                                AND id_usuario_estudiante IN (
                                    SELECT DISTINCT ce.id_usuario 
                                    FROM curso_estudiante ce
                                    JOIN curso_grupo cg ON cg.id = ce.id_curso_grupo
                                    JOIN curso c ON c.id = cg.id_curso
                                    WHERE c.id_cohorte = ?
                                )
                              LIMIT 1";
            
            $monto_original = 0;
            $impuestos = 21; // fallback
            $fecha_vencimiento = '';
            
            if ($stmt_p = $conexion->prepare($sql_plantilla)) {
                $stmt_p->bind_param("iii", $mes, $anio, $cohorte);
                $stmt_p->execute();
                $res_plantilla = $stmt_p->get_result();
                if ($res_plantilla && $res_plantilla->num_rows > 0) {
                    $row_plantilla = $res_plantilla->fetch_assoc();
                    $monto_original = floatval($row_plantilla['monto_original']);
                    $impuestos = floatval($row_plantilla['impuestos']);
                    $fecha_vencimiento = $row_plantilla['fecha_vencimiento'];
                }
                $stmt_p->close();
            }
            
            if ($monto_original <= 0 || empty($fecha_vencimiento)) {
                echo json_encode([
                    "success" => false, 
                    "mensaje" => "No se pudieron obtener los datos base (monto/vencimiento) del período para generar las nuevas cuotas."
                ]);
                exit;
            }
            
            // 2. Buscar estudiantes activos de la cohorte que NO tengan cuotas en ese período
            $sql_faltantes = "SELECT DISTINCT ce.id_usuario 
                              FROM curso_estudiante ce
                              JOIN curso_grupo cg ON cg.id = ce.id_curso_grupo
                              JOIN curso c ON c.id = cg.id_curso
                              WHERE c.id_cohorte = ? 
                                AND ce.id_usuario NOT IN (
                                    SELECT id_usuario_estudiante 
                                    FROM cuotas 
                                    WHERE mes = ? AND anio = ?
                                )";
            
            $estudiantes_faltantes = [];
            if ($stmt_f = $conexion->prepare($sql_faltantes)) {
                $stmt_f->bind_param("iii", $cohorte, $mes, $anio);
                $stmt_f->execute();
                $res_faltantes = $stmt_f->get_result();
                while ($row = $res_faltantes->fetch_assoc()) {
                    $estudiantes_faltantes[] = intval($row['id_usuario']);
                }
                $stmt_f->close();
            }
            
            if (empty($estudiantes_faltantes)) {
                echo json_encode([
                    "success" => true,
                    "mensaje" => "Todos los alumnos de la cohorte ya tienen facturación generada para este período."
                ]);
                exit;
            }
            
            // 3. Crear cuotas para los estudiantes faltantes
            $estado = 'pendiente';
            $descuento = 0;
            $recargo = 0;
            $fechaHora = date('Y-m-d H:i:s');
            $monto_total = $monto_original + ($monto_original * $impuestos / 100);
            $creadas = 0;
            $errores = 0;
            
            foreach ($estudiantes_faltantes as $id_usuario) {
                $sql_cuota = "INSERT INTO cuotas(
                                    id_usuario_estudiante, mes, anio, monto_original, impuestos,
                                    descuento, recargo, monto_final, estado,
                                    fecha_vencimiento, fecha_creacion
                                ) VALUES (
                                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?    
                                )";
                if ($stmt = $conexion->prepare($sql_cuota)) {
                    $stmt->bind_param(
                        "iiidddddsss",
                        $id_usuario,
                        $mes,
                        $anio,
                        $monto_original,
                        $impuestos,
                        $descuento,
                        $recargo,
                        $monto_total,
                        $estado,
                        $fecha_vencimiento,
                        $fechaHora
                    );
                    if ($stmt->execute()) {
                        $creadas++;
                    } else {
                        $errores++;
                    }
                    $stmt->close();
                } else {
                    $errores++;
                }
            }
            
            if ($creadas > 0) {
                echo json_encode([
                    "success" => true,
                    "mensaje" => "Facturación completada con éxito. Se generó la cuota para $creadas alumno(s) nuevo(s)." . ($errores > 0 ? " Hubo errores al crear $errores cuota(s)." : "")
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "mensaje" => "No se pudieron generar cuotas para los estudiantes faltantes debido a errores internos."
                ]);
            }
            exit;
            
        } else {
            // Accion por defecto: Generacion de cuotas
            if (isset($dataObject->cohorte) 
                && isset($dataObject->mes) 
                && isset($dataObject->monto_original) 
                && isset($dataObject->fecha_vencimiento)) {
                
                $cohorte            = intval($dataObject->cohorte);
                $mes                = intval($dataObject->mes);
                $monto_original     = floatval($dataObject->monto_original);
                $fecha_vencimiento  = $conexion->real_escape_string($dataObject->fecha_vencimiento);

                // Obtener nivel de la formacion asociada
                $sql_nivel = "SELECT n.denominacion as nivel_nombre, co.año as ciclo
                              FROM cohorte co 
                              JOIN formacion f ON co.id_formacion = f.id 
                              JOIN nivel n ON f.nivel = n.id
                              WHERE co.id = $cohorte";
                $res_nivel = $conexion->query($sql_nivel);
                if ($res_nivel && $res_nivel->num_rows > 0) {
                    $row_nivel = $res_nivel->fetch_assoc();
                    $nivel_val = $row_nivel['nivel_nombre'];
                    $ciclo = intval($row_nivel['ciclo']);
                } else {
                    // Fallback si no se encuentra
                    $nivel_val = 'General';
                    $ciclo = date('Y');
                }

                // Tomar los estudiantes activos
                $sql_estudiantes_activos = "SELECT DISTINCT ce.id_usuario 
                                            FROM curso_estudiante ce
                                            JOIN curso_grupo cg ON cg.id = ce.id_curso_grupo
                                            JOIN curso c ON c.id = cg.id_curso
                                            JOIN cohorte co ON co.id = c.id_cohorte
                                            WHERE co.id = $cohorte";

                $res_est = $conexion->query($sql_estudiantes_activos);
                if ($res_est && $res_est->num_rows >= 1) {
                    $estudiantes_activos = $res_est->fetch_all(MYSQLI_ASSOC);

                    $estado     = 'pendiente';
                    $descuento  = 0;
                    $recargo    = 0;
                    $impuestos  = isset($dataObject->iva) ? floatval($dataObject->iva) : 21; // IVA
                    $fechaHora  = date('Y-m-d H:i:s');
                    $monto_total = $monto_original + ($monto_original * $impuestos / 100);
                    $errores = 0;

                    foreach ($estudiantes_activos as $est) {
                        $id_usuario = $est['id_usuario'];
                        
                        $sql_cuota = "INSERT INTO cuotas(
                                            id_usuario_estudiante, mes, anio, monto_original, impuestos,
                                            descuento, recargo, monto_final, estado,
                                            fecha_vencimiento, fecha_creacion
                                        ) VALUES (
                                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?    
                                        )";
                        if ($stmt = $conexion->prepare($sql_cuota)) {
                            $stmt->bind_param(
                                "iiidddddsss",
                                $id_usuario,
                                $mes,
                                $ciclo,
                                $monto_original,
                                $impuestos,
                                $descuento,
                                $recargo,
                                $monto_total,
                                $estado,
                                $fecha_vencimiento,
                                $fechaHora
                            );
                            if (!$stmt->execute()) {
                                $errores++;
                            }
                            $stmt->close();
                        } else {
                            $errores++;
                        }
                    }

                    if ($errores == 0) {
                        // Crear el registro en cuotas_mes incluyendo el nivel obtenido
                        $sql_cuotas_mes="INSERT INTO cuotas_mes(cohorte, nivel, mes, anio, fecha_creacion) 
                                        VALUES ($cohorte, '$nivel_val', $mes, $ciclo, '$fechaHora')";
                        if ($conexion->query($sql_cuotas_mes)) {
                            echo json_encode(["success" => true, "mensaje" => 'Se crearon todas las cuotas']);
                        } else {
                            echo json_encode(["success" => false, "mensaje" => "No se pudo crear entrada en tabla cuotas_mes: " . $conexion->error]);
                        }
                    } else {
                        echo json_encode(["success" => false, "mensaje" => "No se pudieron crear $errores cuotas"]);
                    }

                } else {
                    echo json_encode(["success" => false, "mensaje" => 'Error: no hay estudiantes activos']);
                }
            } else {
                echo json_encode(["success" => false, "mensaje" => 'Error: faltan variables para generar cuotas']);
            }
        }
        break;
        
    case 'PUT':
        $accion = getParam('accion');
        
        if ($accion === 'actualizar_estado') {
            $id_cuota = intval(getParam('id_cuota'));
            $nuevo_estado = $conexion->real_escape_string(getParam('estado'));
            
            if ($id_cuota <= 0 || !in_array($nuevo_estado, ['pendiente', 'pagado', 'vencido'])) {
                echo json_encode(["success" => false, "mensaje" => "Datos invalidos para actualizar estado"]);
                exit;
            }
            
            // Si el nuevo estado no es pagado, borrar registro en pagos y el comprobante del disco si existiera
            if ($nuevo_estado !== 'pagado') {
                $res_pago = $conexion->query("SELECT archivo_comprobante FROM pagos WHERE id_cuota = $id_cuota");
                if ($res_pago && $res_pago->num_rows > 0) {
                    $row_pago = $res_pago->fetch_assoc();
                    $archivo = $row_pago['archivo_comprobante'];
                    if ($archivo) {
                        $ruta = __DIR__ . '/uploads/comprobantes/' . $archivo;
                        if (file_exists($ruta)) {
                            unlink($ruta);
                        }
                    }
                    $conexion->query("DELETE FROM pagos WHERE id_cuota = $id_cuota");
                }
            }
            
            $sql = "UPDATE cuotas SET estado = ? WHERE id = ?";
            if ($stmt = $conexion->prepare($sql)) {
                $stmt->bind_param("si", $nuevo_estado, $id_cuota);
                if ($stmt->execute()) {
                    echo json_encode(["success" => true, "mensaje" => "Estado de la cuota actualizado correctamente."]);
                } else {
                    echo json_encode(["success" => false, "mensaje" => "Error al actualizar estado en base de datos."]);
                }
                $stmt->close();
            } else {
                echo json_encode(["success" => false, "message" => "Error al preparar la consulta"]);
            }
            exit;
        }
        break;
        
    case 'DELETE':
        $accion = getParam('accion');
        
        if ($accion === 'eliminar_cuota') {
            $id_cuota = intval(getParam('id'));
            if ($id_cuota <= 0) {
                echo json_encode(["success" => false, "mensaje" => "ID invalido"]);
                exit;
            }
            
            // Borrar comprobante físico y pagos
            $res_pago = $conexion->query("SELECT archivo_comprobante FROM pagos WHERE id_cuota = $id_cuota");
            if ($res_pago && $res_pago->num_rows > 0) {
                $row_pago = $res_pago->fetch_assoc();
                $archivo = $row_pago['archivo_comprobante'];
                if ($archivo) {
                    $ruta = __DIR__ . '/uploads/comprobantes/' . $archivo;
                    if (file_exists($ruta)) {
                        unlink($ruta);
                    }
                }
                $conexion->query("DELETE FROM pagos WHERE id_cuota = $id_cuota");
            }
            
            if ($conexion->query("DELETE FROM cuotas WHERE id = $id_cuota")) {
                echo json_encode(["success" => true, "mensaje" => "Cuota eliminada correctamente"]);
            } else {
                echo json_encode(["success" => false, "mensaje" => "Error al eliminar cuota: " . $conexion->error]);
            }
            exit;
            
        } elseif ($accion === 'eliminar_mes_generado') {
            $cohorte = intval(getParam('cohorte'));
            $mes = intval(getParam('mes'));
            $anio = intval(getParam('anio'));
            
            if ($cohorte <= 0 || $mes <= 0 || $anio <= 0) {
                echo json_encode(["success" => false, "mensaje" => "Variables invalidas para deshacer"]);
                exit;
            }
            
            // Verificar si ya existen cuotas cobradas
            $sql_verificar = "SELECT COUNT(c.id) as cobradas
                              FROM cuotas c
                              WHERE c.mes = $mes AND c.anio = $anio AND c.estado = 'pagado'
                              AND c.id_usuario_estudiante IN (
                                  SELECT ce.id_usuario 
                                  FROM curso_estudiante ce 
                                  JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id 
                                  JOIN curso c_sub ON cg.id_curso = c_sub.id 
                                  WHERE c_sub.id_cohorte = $cohorte
                              )";
            $res_verificar = $conexion->query($sql_verificar);
            $row_verificar = $res_verificar->fetch_assoc();
            if (intval($row_verificar['cobradas']) > 0) {
                echo json_encode([
                    "success" => false, 
                    "mensaje" => "No se puede revertir la facturacion: ya existen cuotas marcadas como PAGADAS."
                ]);
                exit;
            }
            
            // Iniciar eliminacion
            $conexion->begin_transaction();
            try {
                // 1. Eliminar cuotas
                $sql_del_cuotas = "DELETE FROM cuotas 
                                   WHERE mes = $mes AND anio = $anio AND estado = 'pendiente'
                                   AND id_usuario_estudiante IN (
                                       SELECT ce.id_usuario 
                                       FROM curso_estudiante ce 
                                       JOIN curso_grupo cg ON ce.id_curso_grupo = cg.id 
                                       JOIN curso c_sub ON cg.id_curso = c_sub.id 
                                       WHERE c_sub.id_cohorte = $cohorte
                                   )";
                $conexion->query($sql_del_cuotas);
                
                // 2. Eliminar mes generado
                $sql_del_mes = "DELETE FROM cuotas_mes WHERE cohorte = $cohorte AND mes = $mes AND anio = $anio";
                $conexion->query($sql_del_mes);
                
                $conexion->commit();
                echo json_encode(["success" => true, "mensaje" => "Generacion revertida correctamente."]);
            } catch (Exception $e) {
                $conexion->rollback();
                echo json_encode(["success" => false, "mensaje" => "Error al deshacer operacion: " . $e->getMessage()]);
            }
            exit;
        }
        break;
}

$conexion->close();

?>