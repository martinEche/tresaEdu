<?php
require_once __DIR__ . '/config_cors.php';
header('Content-Type: application/json');

// Manejar preflight requests

// Configuración
$DEEPSEEK_API_KEY = 'TU_API_KEY_AQUI'; // Cambia esto
$DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

// Obtener datos
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['imagen_base64']) || empty($data['imagen_base64'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No se proporcionó imagen']);
    exit();
}

// Extraer solo el base64 (sin el prefijo data:image/...)
$base64Data = $data['imagen_base64'];
if (strpos($base64Data, 'base64,') !== false) {
    $parts = explode('base64,', $base64Data);
    $base64Data = $parts[1];
}

// Preparar el prompt con instrucciones específicas
$prompt = "Analiza esta imagen y conviértela a HTML siguiendo estas reglas:

1) Convierte TODO el texto a HTML semántico (h1, h2, p, ul, ol, li, etc.)
2) Conserva la estructura y formato del documento original
3) Si hay tablas, conviértelas a <table>, <tr>, <td>
4) Si hay listas, usa <ul> o <ol>
5) Mantén los estilos de texto (negrita, cursiva) usando <strong> y <em>
6) Detecta imágenes o dibujos dentro del documento
7) Para cada imagen/dibujo encontrado:
   - Genera un nombre único: imagen_1.png, imagen_2.png, etc.
   - Reemplaza en el HTML con: <img src='NOMBRE_ARCHIVO'>
8) Devuelve SOLAMENTE un JSON válido con este formato exacto:

{
  \"html\": \"AQUI_VA_EL_HTML_COMPLETO\",
  \"imagenes\": [
    {
      \"nombre\": \"imagen_1.png\",
      \"base64\": \"BASE64_DE_LA_IMAGEN_EXTRAIDA\"
    }
  ]
}

IMPORTANTE: Si no hay imágenes en el documento, devuelve un array vacío en 'imagenes'.
IMPORTANTE: El JSON debe ser válido y parseable.";

// Preparar la solicitud para DeepSeek
$payload = [
    'model' => 'deepseek-chat', // o 'deepseek-vision' si está disponible
    'messages' => [
        [
            'role' => 'user',
            'content' => [
                [
                    'type' => 'text',
                    'text' => $prompt
                ],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => "data:image/jpeg;base64,{$base64Data}"
                    ]
                ]
            ]
        ]
    ],
    'max_tokens' => 4000,
    'temperature' => 0.1,
    'response_format' => ['type' => 'json_object']
];

// Enviar a DeepSeek
$ch = curl_init($DEEPSEEK_API_URL);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $DEEPSEEK_API_KEY,
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_TIMEOUT => 60
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $curlError]);
    exit();
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'error' => 'Error de API DeepSeek',
        'codigo' => $httpCode,
        'respuesta' => $response
    ]);
    exit();
}

// Procesar respuesta
$responseData = json_decode($response, true);

if (!isset($responseData['choices'][0]['message']['content'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Respuesta inválida de DeepSeek']);
    exit();
}

$content = $responseData['choices'][0]['message']['content'];

// Intentar extraer JSON de la respuesta
$jsonResult = null;

// Método 1: Intentar parsear directamente
$jsonResult = json_decode($content, true);

// Método 2: Buscar JSON entre backticks
if (json_last_error() !== JSON_ERROR_NONE) {
    if (preg_match('/```json\s*([\s\S]*?)\s*```/', $content, $matches)) {
        $jsonResult = json_decode($matches[1], true);
    }
}

// Método 3: Buscar cualquier JSON válido
if (json_last_error() !== JSON_ERROR_NONE) {
    if (preg_match('/\{[\s\S]*\}/', $content, $matches)) {
        $jsonResult = json_decode($matches[0], true);
    }
}

// Si no se pudo obtener JSON válido
if (json_last_error() !== JSON_ERROR_NONE || !$jsonResult) {
    // Crear respuesta de fallback
    $jsonResult = [
        'html' => '<div class="contenido-documento"><p>Documento convertido:</p><pre>' . 
                  htmlspecialchars($content) . '</pre></div>',
        'imagenes' => []
    ];
}
$html = $jsonResult['html'];
$imagenes = $jsonResult['imagenes'] ?? [];

/* ===============================
   GUARDAR IMÁGENES
=================================*/

foreach($imagenes as $img){

    $nombre = $img["nombre"];
    $base64 = $img["base64"];

    file_put_contents(
        $carpetaImagenes . $nombre,
        base64_decode($base64)
    );

    // reemplazar ruta en html
    $html = str_replace(
        $nombre,
        "imagenesGeneradas/" . $nombre,
        $html
    );
}

/* ===============================
   RESPUESTA FINAL
=================================*/

echo json_encode([
    "html" => $html
]);

?>