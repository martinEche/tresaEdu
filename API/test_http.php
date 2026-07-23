<?php
require 'vendor/autoload.php'; // if needed, but we can just use file_get_contents
$url = "http://localhost/tresatecedutech/tresaedu-git/PLataforma-educativa--Tresatec-Demofinal/API/operarCalendario.php?id_usiario=101";
$res = file_get_contents($url);
$data = json_decode($res, true);
if (is_array($data)) {
    echo count($data) . " events returned from API.\n";
    foreach ($data as $e) {
        if ($e['id_curso_grupo'] == 23) {
            echo "Found course 23 event: " . $e['evento'] . "\n";
        }
    }
} else {
    echo "Error or not array: " . $res . "\n";
}
?>
