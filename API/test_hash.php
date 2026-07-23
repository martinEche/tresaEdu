<?php
require_once __DIR__ . '/config_cors.php';
$hash = password_hash("admin", PASSWORD_BCRYPT);
echo $hash . "\n";
echo (password_verify("admin", $hash) ? "Verified" : "Failed") . "\n";
?>
