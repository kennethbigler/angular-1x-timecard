<?php
$headers = array('http'=>array('method'=>'GET','header'=>'Content: type=application/json \r\n'.'$agent \r\n'.'$hash'));
$context=stream_context_create($headers);
$str = file_get_contents("storage.txt",FILE_USE_INCLUDE_PATH,$context);
$str=json_decode($str,true);
echo json_encode($str);
/*$str = file_get_contents('data.txt');
header('Content-Type: application/json');
$json = json_encode($str, true);
echo $json;*/
?>