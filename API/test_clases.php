<?php
$url = "http://localhost/tresatecedutech/tresaedu-git/PLataforma-educativa--Tresatec-Demofinal/API/operarClases.php";
$data = ['modo' => 'buscarClases', 'id_curso_grupo' => 23];
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
if ($result === FALSE) {
    echo "Error fetching data.";
} else {
    $clases = json_decode($result, true);
    if(isset($clases['error'])){
        echo "Error: " . $clases['error'];
    } else {
        foreach($clases as $c) {
            echo "Clase: " . $c['id'] . "\n";
            echo "Materiales: " . (isset($c['materiales']) ? count($c['materiales']) : "undefined") . "\n";
            echo "Actividades: " . (isset($c['trabajos']) ? count($c['trabajos']) : "undefined") . "\n";
        }
    }
}
?>
