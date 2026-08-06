<?php
require_once __DIR__ . '/config_cors.php';
require_once __DIR__ . '/enviar_push.php';
include_once __DIR__ . '/conectar.php';

header('Content-Type: text/html; charset=utf-8');

$conexion = conectarDB();
$conexion->set_charset('utf8mb4');

$accion = $_POST['accion'] ?? '';
$resultado = null;

if ($accion === 'enviar_test') {
    $token = trim($_POST['token'] ?? '');
    $titulo = trim($_POST['titulo'] ?? 'Mensaje de Prueba iOS');
    $cuerpo = trim($_POST['cuerpo'] ?? 'Esta es una prueba de notificación directa desde el servidor');
    
    if (!empty($token)) {
        $resultado = enviarPushFirebase($token, $titulo, $cuerpo, ['tipo' => 'test', 'url' => 'https://www.institutopetitdemeurville.com.ar/Mensajes']);
    } else {
        $resultado = ['error' => 'No seleccionaste ningún token'];
    }
}

// Consultar los últimos 30 tokens registrados
$tokens = [];
$res = $conexion->query("
    SELECT t.id, t.usuario_id, t.token, t.platform, t.actualizado, u.usuario, u.nombre, u.apellido 
    FROM fcm_tokens t
    LEFT JOIN usuarios u ON t.usuario_id = u.id
    ORDER BY t.actualizado DESC
    LIMIT 30
");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $tokens[] = $row;
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Diagnóstico y Prueba de Notificaciones Push</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 25px; }
        .card { background: #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        h1, h2 { color: #38bdf8; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #334155; }
        th { background: #0f172a; color: #94a3b8; }
        .badge-ios { background: #0284c7; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .badge-android { background: #16a34a; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        button { background: #38bdf8; color: #0f172a; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
        button:hover { background: #7dd3fc; }
        input, select { background: #0f172a; border: 1px solid #475569; color: white; padding: 8px 12px; border-radius: 6px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
        pre { background: #020617; padding: 15px; border-radius: 6px; border: 1px solid #1e293b; color: #a5f3fc; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔔 Diagnóstico de Notificaciones Push (Firebase + APNs)</h1>
        <p>Esta herramienta permite ver qué dispositivos se han registrado en la base de datos y enviar notificaciones de prueba individuales.</p>
    </div>

    <?php if ($resultado !== null): ?>
    <div class="card" style="border-left: 4px solid #38bdf8;">
        <h2>📡 Respuesta de Firebase:</h2>
        <pre><?php echo htmlspecialchars(json_encode($resultado, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?></pre>
    </div>
    <?php endif; ?>

    <div class="card">
        <h2>🚀 Enviar Push de Prueba</h2>
        <form method="POST">
            <input type="hidden" name="accion" value="enviar_test">
            
            <label>Seleccionar Token / Usuario de destino:</label>
            <select name="token" required>
                <option value="">-- Seleccionar destinatario --</option>
                <?php foreach ($tokens as $tk): ?>
                    <option value="<?php echo htmlspecialchars($tk['token']); ?>">
                        [<?php echo strtoupper($tk['platform']); ?>] <?php echo htmlspecialchars($tk['nombre'] . ' ' . $tk['apellido'] . ' (' . $tk['usuario'] . ')'); ?> - Act: <?php echo $tk['actualizado']; ?>
                    </option>
                <?php endforeach; ?>
            </select>

            <label>Título:</label>
            <input type="text" name="titulo" value="Mensaje de Prueba" required>

            <label>Cuerpo / Mensaje:</label>
            <input type="text" name="cuerpo" value="Probando la recepción de notificaciones en el dispositivo" required>

            <button type="submit">Enviar Notificación Push</button>
        </form>
    </div>

    <div class="card">
        <h2>📱 Dispositivos Registrados (Últimos 30 en MySQL)</h2>
        <?php if (empty($tokens)): ?>
            <p style="color: #f87171;">⚠️ No hay tokens guardados en la tabla <code>fcm_tokens</code> todavía.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Plataforma</th>
                        <th>Usuario</th>
                        <th>Actualizado</th>
                        <th>Token (primeros 30 chars)</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($tokens as $tk): ?>
                        <tr>
                            <td>
                                <span class="<?php echo $tk['platform'] === 'ios' ? 'badge-ios' : 'badge-android'; ?>">
                                    <?php echo strtoupper($tk['platform'] ?? 'DESCONOCIDO'); ?>
                                </span>
                            </td>
                            <td><?php echo htmlspecialchars($tk['nombre'] . ' ' . $tk['apellido'] . ' (@' . $tk['usuario'] . ')'); ?></td>
                            <td><?php echo htmlspecialchars($tk['actualizado']); ?></td>
                            <td style="font-family: monospace; font-size: 11px; color: #94a3b8;"><?php echo htmlspecialchars(substr($tk['token'], 0, 35)) . '...'; ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</body>
</html>
