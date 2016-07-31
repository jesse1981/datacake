<?php
class crime extends template {
	public function getAssets() {
		$data = new database();
		$dash = new dashboard();
		$post = $dash->getPost();
		
		$keys = array("bcsrgrp","month","daynight","weekdayend");
		$sql = "SELECT * FROM crime WHERE 1=1";
		foreach ($post as $k=>$v){
			if (in_array($keys,$k)) $sql .= " AND $k='$v'";
		}
		$res = $data->query($sql);
		$tab = $data->getTable($res);
		$csv = arrayToCsv($tab);
		
		echo $csv;
	}
}
?>