<?php
class restaurants extends template {
	public function getAssets() {
		$data = new database();
		$dash = new dashboard();
		$post = $dash->getPost();
		
		$keys = array("bcsrgrp","month","daynight","weekdayend");
		$sql = "SELECT 'blank1' as blank1,'blank2' as blank2, latitude,longitude FROM restaurants WHERE 1=1";
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