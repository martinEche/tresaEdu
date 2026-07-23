<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['modo'] = 'buscarActividad';
$_GET['id_trabajo'] = 7;
$_GET['id_estudiante'] = 1;
$_GET['id_curso_grupo'] = 14;

// Mock the valid token for the test if necessary, or bypass it
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer dummy';

include '../API/operarEntregas.php';
?>
