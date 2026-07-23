<?php
/**
 * ARCHIVO DE CONFIGURACIÓN
 */

define('ENV_MODE', 'dev'); // Opciones: 'dev' (Desarrollo local) o 'prod' (Producción)

// ==========================================
// 1. BASE DE DATOS
// ==========================================
if (ENV_MODE === 'prod') {
    define('DB_HOST', 'localhost');
    define('DB_USER', 'usuario_prod');
    define('DB_PASS', 'password_seguro_prod');
    define('DB_NAME', 'nombre_bd_prod');
} else {
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'petit_db_jul_26');
}

// ==========================================
// 2. SEGURIDAD JWT (JSON Web Tokens)
// ==========================================
if (ENV_MODE === 'prod') {
    define('JWT_SECRET_KEY', 'nJ82dT8Cjz/E999VMq7GK1OzWNKB2pUZV9OKs5hYZ/o=');
    define('JWT_ISSUER', 'https://www.institutopetitdemeurville.com.ar/API');
} else {
    define('JWT_SECRET_KEY', 'TresaJJJe90HiPEr_-!SSegura_2000!');
    define('JWT_ISSUER', 'http://localhost/tresaedu-git/');
}

// ==========================================
// 3. CORS (Orígenes Permitidos)
// ==========================================
if (ENV_MODE === 'prod') {
    // En producción solo permitimos peticiones desde el dominio oficial
    define('ALLOWED_ORIGINS', [
        'https://www.institutopetitdemeurville.com.ar'
    ]);
} else {
    // En desarrollo permitimos IPs locales para probar en React y Móvil
    define('ALLOWED_ORIGINS', [
        'http://localhost:3000',
        'http://172.17.197.86:3000',
    ]);
}

// ==========================================
// 4. FIREBASE Y NOTIFICACIONES
// ==========================================
define('FIREBASE_DB_URL', 'https://fibase-santa-default-rtdb.firebaseio.com');

// URL del Frontend (usada para que las notificaciones Push sepan a dónde redirigir al tocarse)
if (ENV_MODE === 'prod') {
    define('FRONTEND_URL', 'https://www.institutopetitdemeurville.com.ar');
} else {
    define('FRONTEND_URL', 'http://172.17.197.86:3000');
}
?>
