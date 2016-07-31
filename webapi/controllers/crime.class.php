<?php
class crime {
	public function getAssets() {
		$data = new database();
		$dash = new dashboard();
		$post = $dash->getPost();
		
		$keys = array("bcsrgrp","month","daynight","weekdayend");
		$sql = "SELECT * FROM crime WHERE 1=1";
		foreach ($post as $k=>$v){
			if (in_array($keys,$k)) $sql .= " AND $k='$v'";
		}
		$res = $db->query($sql);
		$tab = $db->getTable($res);
		$csv = arrayToCsv($tab);
		
		echo $csv;
	}
}
?>