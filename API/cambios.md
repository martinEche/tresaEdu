# 📋 Documento de Arquitectura, Cambios y Seguridad

Este documento centraliza el registro histórico de las actualizaciones críticas implementadas en la plataforma, divididas por categorías para facilitar su lectura y mantenimiento.

---

## 🔒 1. Seguridad y Prevención de Vulnerabilidades

### Autenticación JWT Segura (Híbrida)
- **Rediseño Completo:** Transición de sesiones nativas de PHP a **JSON Web Tokens (JWT)** firmados con clave simétrica estricta.
- **Cliente Web (React):** Los JWT se transmiten en una **Cookie HttpOnly**, mitigando ataques XSS (robo de sesión mediante Javascript).
- **Cliente Móvil (Flutter):** Autenticación mediante cabecera estándar `Authorization: Bearer <token>`.
- **Middleware Global (`validarToken.php`):** Actúa como proxy inverso en cada endpoint protegido, denegando accesos no autorizados (`401 Unauthorized`).
- **Control de Acceso (RBAC):** Se reparó un error donde no se respetaba el rol de mayor jerarquía. Ahora el token JWT hereda siempre el máximo rol disponible (`ORDER BY rol ASC LIMIT 1`).

### Prevención de Ejecución de Código Remoto (RCE)
- **Lista Blanca de Extensiones:** Se blindó el endpoint de subida de archivos en `operarMensajes.php`. Solo se admiten formatos seguros (PDF, DOC, JPG, MP4, etc.), bloqueando scripts maliciosos (`.php`, `.exe`).
- **Defensa en el Servidor:** Inclusión de un archivo `.htaccess` en `/adjuntos/` que impide la ejecución de cualquier script subido a esa carpeta.

### Centralización de Orígenes (CORS Estricto)
- Se eliminó el código duplicado de cabeceras en todos los archivos, trasladando la lógica estricta de dominios permitidos a un único archivo maestro: `config_cors.php`.
- **Denegación Explícita:** Si una petición proviene de un navegador web cuyo `Origin` no está en la lista blanca (`ALLOWED_ORIGINS`), el servidor aborta la conexión inmediatamente con un estado `403 Forbidden`.

---

## ⚡ 2. Optimizaciones de Rendimiento y Arquitectura

### Archivo Maestro de Configuración (`config_env.php`)
- **Centralización de Variables:** Se eliminaron las credenciales hardcodeadas (DB, JWT, URLs) esparcidas en múltiples archivos. Todo se unificó en `config_env.php`.
- **Interruptor de Entorno:** Permite cambiar toda la aplicación de Desarrollo Local a Producción con una sola variable (`ENV_MODE = 'prod'`), asegurando que nunca se filtren IPs o credenciales por error al desplegar.
- Se eliminó `config_jwt.php`, pasando a depender completamente del entorno maestro.

### Refactorización del Sistema Push (Firebase)
- **Resolución del Problema N+1:** El script `notificarFirebase.php` fue reescrito de cero. En lugar de hacer 3 consultas SQL por destinatario en un bucle lento (ej. 150 consultas para un grupo de 50 alumnos), ahora todo se procesa en una única y masiva consulta relacional (`LEFT JOIN` con `IN (...)`).
- **Eliminación del Loopback:** Se quitó la mala práctica de forzar peticiones HTTP hacia el propio servidor (`enviar_push.php`). Ahora el envío de Firebase se invoca directamente en memoria (`enviarPushFirebase()`).
- **Patches RTDB en Lote:** Se creó un Helper para no repetir código al enviar actualizaciones a la Base de Datos en Tiempo Real de Firebase.
- **Cancelación de Auto-Push:** Lógica añadida para excluir al autor del mensaje del arreglo de notificaciones cuando escribe en un canal grupal.
- **Enrutamiento Dinámico:** La URL base (`FRONTEND_URL`) se extrae desde el archivo de configuración maestro en lugar de hardcodearla.

---

## 🐛 3. Corrección de Bugs (Frontend y Backend)

### Backend (PHP)
- **Error 500 en Creación de Grupos:** La base de datos denegaba la operación por faltar el campo `imagen`. Se parcheó forzando un string vacío por defecto.

### Frontend (React)
- **Saneamiento de Autocompletado:** El componente `MensajesCrudForm.js` intercepta y limpia strings sucios (ej: `admin <<admin admin>>`) mediante Regex antes del envío de red, evitando el fallo silencioso del backend.
- **Interceptor Axios Global:** Se agregó un *guardián* de red en `src/index.js`. Ante cualquier respuesta `401 Unauthorized`, purga los estados y expulsa al usuario a la pantalla de Login al instante.
- **Bug de Borrado de Grupos (Estado Fantasma):** Se estructuró correctamente el payload del `DELETE` en la propiedad `data` de la configuración de Axios. Al confirmar la eliminación exitosa en el backend, la UI se sincroniza refrescando automáticamente el listado de grupos.
- **Ajustes de Interfaz (UI):** Corrección de margen inferior en el Footer, alineación del menú hamburguesa roto en dispositivos móviles y separación de márgenes en hilos de respuestas (Mensajes 1 a 1).
- **Desbloqueo de Recursos de Login:** La ruta `GET` en `operarConfiguracion.php` es ahora pública, logrando cargar la imagen institucional en el Login sin solicitar el JWT.

---

## 🚀 4. Guía de Pase a Producción (Checklist Crítico)

Al migrar a un servidor productivo (en vivo), **deben completarse obligatoriamente** los siguientes ajustes para proteger la plataforma.

### Archivo Maestro (`config_env.php`)
- [ ] Cambiar `define('ENV_MODE', 'dev');` a `define('ENV_MODE', 'prod');` en la línea 9.
- [ ] Completar las credenciales de Base de Datos de Producción (`DB_USER`, `DB_PASS`, `DB_NAME`).
- [ ] Actualizar la constante `JWT_SECRET_KEY` por una frase inquebrantable (mín. 64 caracteres) en el bloque de producción.
- [ ] Asegurarse de que el dominio de producción esté en `ALLOWED_ORIGINS` y `FRONTEND_URL`.

### Entorno y Servidor
- [ ] **Apagar Modo Debug:** Eliminar `ini_set('display_errors', 1);` de los archivos. Los errores internos no deben filtrarse al público.
- [ ] **Certificado SSL:** Todo el tráfico debe enrutarse por **HTTPS**. De lo contrario fallará la cámara web y el navegador bloqueará la inyección de Cookies Seguras.
- [ ] **Asegurar las Cookies:** En `login.php` y `logout.php`, modificar la directiva de la cookie pasando de `'secure' => false` a `'secure' => true`.
- [ ] **Cuenta de Servicio Firebase:** Mover el archivo de credenciales (`firebase_service_account.json`) a un directorio inaccesible desde la web (fuera de `public_html`), o denegar su acceso absoluto con `.htaccess`.

### Compilación y Apps
- [ ] **React (Build de Producción):** En `src/config.js` inyectar la URL pública de la API. Luego generar la aplicación mediante `npm run build`. Únicamente se debe subir el contenido de la carpeta de compilación final al servidor.
- [ ] **Flutter (Constantes URL):** En `lib/core/constants/api_constants.dart`, conmutar las rutas locales por las variables de producción ya preparadas.
- [ ] **Firmado del App Móvil (Keystore):** Compilar la app (`appbundle` o `apk --release`) firmada formalmente con las llaves criptográficas de la institución.
- [ ] **Certificados SHA en Consola Firebase:** Dar de alta los hashes `SHA-1` y `SHA-256` correspondientes a las llaves de producción en la configuración de Firebase para Android, garantizando que el servicio de Push Notifications sea autorizado por Google.
