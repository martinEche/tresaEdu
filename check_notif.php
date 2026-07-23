<?php
$c=mysqli_connect('localhost','root','','petit_db_jul_26');
$p = password_hash('30649632', PASSWORD_DEFAULT);
$r=mysqli_query($c,"UPDATE usuarios SET clave='$p' WHERE documento='30649632' OR usuario='30649632'");
if($r) {
    echo "Password successfully updated to DNI: 30649632\n";
} else {
    echo mysqli_error($c);
}
?>
