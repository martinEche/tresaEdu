<?php
// enviar_email.php
require_once __DIR__ . '/config_env.php';

function enviarEmailPlataforma($destinatario, $asunto, $mensajeHtml) {
    if (empty($destinatario)) return false;

    // Obtener host o dominio para el remitente
    $host = $_SERVER['HTTP_HOST'] ?? 'tresatec.com.ar';
    $host = preg_replace('/^www\./i', '', $host);
    $from = "noreply@" . $host;

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8" . "\r\n";
    $headers .= "From: Plataforma Educativa <$from>" . "\r\n";
    $headers .= "Reply-To: <$from>" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    // Enviar el correo usando la función nativa mail() de PHP con el parámetro -f para el Return-Path
    return @mail($destinatario, $asunto, $mensajeHtml, $headers, "-f" . $from);
}

function obtenerPlantillaEmail($titulo, $contenidoPrincipal, $urlAcceso) {
    $btnTexto = "Ingresar a la Plataforma";
    return '
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333; }
            .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e1e8ed; }
            .header { background-color: #1b2a4e; color: #ffffff; padding: 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .content { padding: 30px; line-height: 1.6; }
            .content h2 { color: #1b2a4e; margin-top: 0; }
            .btn { display: inline-block; padding: 12px 25px; margin: 20px 0; color: #ffffff !important; background-color: #28a745; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e1e8ed; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="' . obtenerFrontendUrlDinamico() . '/API/uploads/espacios/escudo_solo_instituto.png" alt="Logo" style="height: 50px; vertical-align: middle; margin-right: 15px;">
                <h1 style="display: inline-block; vertical-align: middle; margin: 0;">Plataforma Educativa</h1>
            </div>
            <div class="content">
                <h2>' . htmlspecialchars($titulo) . '</h2>
                <p>' . $contenidoPrincipal . '</p>
                <div style="text-align: center;">
                    <a href="' . htmlspecialchars($urlAcceso) . '" class="btn" style="color: #ffffff;">' . $btnTexto . '</a>
                </div>
            </div>
            <div class="footer">
                <p>Este es un correo automático, por favor no lo respondas.</p>
                <p>© ' . date('Y') . ' Plataforma Educativa. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    ';
}

function obtenerFrontendUrlDinamico() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['SERVER_PORT'] ?? 80) == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'tresatec.com.ar';
    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    $frontendPath = preg_replace('/\/api$/i', '', $scriptDir);
    return $protocol . $host . rtrim($frontendPath, '/');
}
?>
