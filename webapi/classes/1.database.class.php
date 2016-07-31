<?php

define('DB_ERR_MISSINGSCHEMA',-1,true);
define('DB_ERR_OBJNOTEXIST',-2,true);

class database {
    
    protected $link;
    var $db;
    var $dbType;
    
    public function __construct($options=array()) {
        $this->initialize($options);
    }
    public function __destruct() {
        // commenting out to refer to:
        // https://bugs.php.net/bug.php?id=30525
        //$this->close();
    }
    
    private function connect($options) {
        switch ($this->getDbType()) {
            case "mysql":
                $server = $options["SERVER"].":".$options["PORT"];
				$this->link = mysqli_connect('localhost', $options["USER"], $options["PASS"], $options["NAME"]);
                break;
            case "psql":
                $connstring = "host=".$options["SERVER"]." port=".$options["PORT"]." dbname=".$options["NAME"]." user=".$options["USER"]." password=".$options["PASS"];
                $this->link = pg_connect($connstring);
                break;
            default:
                
                break;
        }
        if ($this->link) {
            switch ($this->getDbType()) {
                case "mysql":
                    //$this->db = mysql_select_db($options["NAME"],$this->link);
                break;
            case "psql":
                
                break;
            }
            if (!$this->link) {
                log_error('database','connect', mysql_error());
            }
        }
        else {
            log_error('database','connect', "Unable to connect to server!");
        }
        return $this->link;
    }
    public function close() {
        if ($this->link) {
            switch ($this->getDbType()) {
                case "mysql":
                    mysql_close($this->link);
                    break;
                case "psql":
                    pg_close($this->link);
                    break;
            }
            return true;
        }
        return false;
    }
    
    public function initialize($options) {
        if (!count($options)) {
            $options = array("TYPE"=>DB_TYPE,"SERVER"=>DB_SERVER,"NAME"=>DB_NAME,"USER"=>DB_USER,"PASS"=>DB_PASS,"PORT"=>DB_PORT);
            $this->setDbType(DB_TYPE);
        }
        else {
            $this->setDbType($options["TYPE"]);
        }
        $this->link = $this->connect($options);
    }
    public function query($sql) {
        if ($this->link) {
            //var_dump ($this->link);
            switch ($this->getDbType()) {
                case "mysql":
                    //$result = mysql_query($sql.";",$this->link);
					$result = mysqli_query($this->link, $sql);
                    if (!$result) {
                        //$errorno = mysql_errno($this->link);
                        //$errorstr = mysql_error($this->link);
                        echo "MySQL Error: ($errorno) $errorstr | Query: $sql<br/>";
                    }
                    break;
                case "psql":
                    $result = pg_query($this->link,$sql);
                    if (!$result) {
                        $errorstr = pg_last_error($this->link);
                        echo "PostgreSQL Error: $errorstr | Query: $sql<br/>";
                    }
                    break;
            }
            return $result;
        }
        else return false;
    }
    public function getLastId() {
        return mysql_insert_id($this->link);
    }
    public function getNumRows($res) {
        if ($res) {
            switch ($this->getDbType()) {
                case "mysql":
                    return mysql_num_rows($res);
                    break;
                case "psql":
                    return pg_num_rows($res);
                    break;
            }
        }
        else return false;
    }
    public function getTable($res) {
        if ($res) {
            $result = array();
            $count = 0;
            switch ($this->getDbType()) {
                case "mysql":
                    //while ($row = mysql_fetch_assoc($res)) {
					while ($row = mysqli_fetch_assoc($res)) { 
                        foreach ($row as $field=>$value) {
                            $result[$count][$field] = $value;
                        }
                        $count++;
                    }
                    break;
                case "psql":
                    while ($row = pg_fetch_assoc($res)) {
                        foreach ($row as $field=>$value) {
                            $result[$count][$field] = $value;
                        }
                        $count++;
                    }
                    break;
            }
            return $result;
        }
        else return false;
    }
    public function search($obj,$fields,$ops,$vals) {
        $result = array();
        $joinedResults = array();
        $object_id = $obj->object_id;
        $sql = "SELECT DISTINCT i.id AS item 
                FROM items i 
                INNER JOIN meta m ON i.id=m.item_id 
                WHERE i.object_id = $object_id AND ";
        $count = 0;
        $sqlW = "";
        
        $objFields = $obj->fields;
        array_push($objFields,array("id"=>0));
        
        foreach ($objFields as $a=>$b) {
            for ($i=0;$i<count($fields);$i++) {
                $col = substr($fields[$i], strpos($fields[$i], ".")+1);
                $add = false;
                $addJoin = false;
                
                //echo "COL = $col<br/>";
                //echo "OBJ = ".$obj->name."<br/>";
                //echo "obF = $a<br/><br/>";
                
                if (($obj->name.".id"==$fields[$i]) && ($a=="id")) {
                    //echo "This has been reached!<br/><br/>";
                    
                    $f = "i.id";
                    $v = $vals[$i];
                    $add = true;
                }
                else if (is_object($objFields[$a])) {
                    $joinedObj = new object($objFields[$a]->name);
                    $joinedResults = $this->search($joinedObj,$fields,$ops,$vals);
                    foreach ($joinedResults as $id) {
                        if ($sqlW) $sqlW .= " AND ";
                        $sqlW .= "(`key`='$a' AND (".$obj->getDbField('string')." like 'array(%$id)' or ".$obj->getDbField('string')." like 'array(%$id,%)'))";
                        $add = true;
                        $addJoin = true;
                    }
                }
                else if ((substr($fields[$i],0,strlen($obj->name))==$obj->name) && ($a==$col)) {
                    switch($obj->datatypes[$col]) {
                        case "string":
                            $f = $obj->getDbField($obj->datatypes[$col]);
                            $v = "'".$vals[$i]."'";
                            break;
                        case "blob":
                            $f = "MD5(".$obj->getDbField($obj->datatypes[$col],FALSE).")";
                            $v = "'".fileToHash($vals[$i])."'";
                            break;
                        default:
                            $f = $obj->getDbField($obj->datatypes[$col]);
                            $v = $vals[$i];
                            break;
                    }
                    $add = true;
                }
                if (($add) && (!$addJoin)) {
                    $op = $ops[$i];
                    if ($sqlW) $sqlW .= " AND ";
                    $sqlW .= "($f $op $v)";
                }
            }
        }
        if ($sqlW) {
            //echo "$sql".""."$sqlW<br/>";
            
            $res = $obj->query($sql.$sqlW);
            $tab = $obj->getTable($res);
            if ($res) foreach ($tab as $item) $result[] = $item["item"];
        }
        return $result;
    }
    public function pg_getLastId($table) {
        $table = $table."_id_seq";
        $sql = "SELECT last_value FROM $table";
        $res = $this->query($sql);
        $tab = $this->getTable($res);
        $id = (int)$tab[0]["last_value"];
        
        return $id;
    }
    
    public function getDbType() {
        return $this->dbType;
    }
    public function setDbType($value) {
        $this->dbType = $value;
    }
    
    public function getAllItems($object) {
        $result = array();
        $sql = "SELECT i.id AS item
                FROM items i
                INNER JOIN objects o ON i.object_id=o.id
                WHERE o.label = '$object'";
        $res = $this->query($sql);
        if ($this->getNumRows($res)) {
            $tab = $this->getTable($res);
            foreach ($tab as $item) {
                $insert = new object($object);
                $insert->load($item["item"]);
                $result[] = $insert;
            }
            return $result;
        }
        else return array();
    }
    public function getDbField($datatype) {
        switch($datatype) {
            case "string":
                $return = "value_str";
                break;
            case "blob":
                $return = "filename";
                break;
            default:
                $return = "value_num";
                break;
        }
        return $return;
    }
}

class object extends database {
    var $object_id = 0;
    var $id = 0;
    var $name = "";
    var $select = "";
    var $fields = array();
    var $datatypes = array();
    var $labels = array();
    var $searchOps = array();
    var $searchVal = array();
    
    public function __construct($name) {
        $this->initialize(array());
        $exists = false;
        $handle = fopen(DB_SCHEMA,'r');
        if ($handle) {
            $buffer = fread($handle,filesize(DB_SCHEMA));
            $schema = new SimpleXMLElement($buffer);
            
            fclose($handle);
            foreach($schema->object as $object) {
                               
                $children   = (array)$object->children();
                $atts       = (array)$object->attributes();
                
                if ((isset($atts["@attributes"])) && 
                    ($atts["@attributes"]["name"]==$name)) {
                    
                    $exists = true;
                    $this->name = $name;
                    $this->object_id = $this->getObjectId($name);
                    
                    // prepare select field
                    if (isset($atts["@attributes"]["select"])) $this->select = $atts["@attributes"]["select"];
                                        
                    foreach ($children as $k => $v) {
                        $this->fields[$k] = "";
                        // Check attributes
                        $childNodes = (array)$children[$k]->attributes();
                        if (count($childNodes)) {
                            foreach ($childNodes["@attributes"] as $a=>$b) {
                                if (substr($a,0,3)=="to_") {
                                    $this->fields[$k] = new join($b,$a);
                                    break;
                                }
                                elseif ($a=="type") {
                                    $this->datatypes[$k] = $b;
                                }
                                elseif ($a=="label") {
                                    $this->labels[$k] = $b;
                                }
                            }
                        }
                    }
                }
            }
            if (!$exists) {
                return DB_ERR_OBJNOTEXIST;
            }
            else return $this;
        }
        else return DB_ERR_MISSINGSCHEMA;
    }
    
    public function load($id,&$obj=null) {
        if (!is_numeric($id)) return false;
        if ($obj==null) $obj=$this;
        $sql = $this->getSelect($id);
        $res = $this->query($sql);
        $tab = $this->getTable($res);
        
        foreach ($tab as $item) {
            if (isset($obj->fields[$item["key"]])) {
                if (is_object($obj->fields[$item["key"]])) {
                    $objects = eval('return '.$item[$obj->getDbField('string')].';');
                    for ($i=0;$i<count($objects);$i++) {
                        $obj->fields[$item["key"]]->create();
                        $obj->fields[$item["key"]]->objects[$i]->load($objects[$i]);
                    }
                }
                else $obj->fields[$item["key"]] = $item[$obj->getDbField($obj->datatypes[$item["key"]])];
            }
        }
        $obj->id = $id;
        return $obj;
    }
    public function save(&$obj=null) {
        if ($obj==null) $obj = $this;
        $sql_write = "";
        $joined = "";
        
        if (!(int)$this->id) {
            $sql = "INSERT INTO items (object_id) VALUES (".$obj->object_id.")";
            $res = $this->query($sql);
            $obj->id = $this->getLastId();
        }
        
        $sql = $obj->getSelect($this->id);
        $res = $obj->query($sql);
        $tab = $obj->getTable($res);
                        
        foreach ($obj->fields as $k=>$v) {
            if (is_object($obj->fields[$k])) {
                $jCount = 0;
                $joined = "array(";
                foreach ($obj->fields[$k]->objects as $join) {
                    $join = $obj->save($join);
                    if ($jCount) $joined .= ",";
                    $joined .= $join->id;
                    $jCount++;
                }
                $joined .= ")";
                
                //echo "$joined<br/>";
            }
            $exists = false;
            foreach ($tab as $item) {
                if ($item["key"]==$k) {
                    $exists = true;
                    if (($obj->datatypes[$k]=='blob') && (file_exists($v))){
                        // save filename and blob data
                        $filename = explode('/',$v);
                        $filename = $filename[(count($filename)-1)];
                        $sql_write = "UPDATE meta SET ".$obj->getDbField('blob')."='$filename' WHERE item_id=".$obj->id." AND `key`='$k';";
                        $this->query ($sql_write);

                        $sql_write = "UPDATE download SET `data`='".fileToVar($v)."' WHERE item_id=".$obj->id." AND `key`='$k';";
                        $this->query ($sql_write);

                        unlink($v);
                    }
                    else if (is_object($obj->fields[$k])) {
                        $sql_write = "UPDATE meta SET ".$obj->getDbField('string')."='$joined' WHERE item_id=".$obj->id." AND `key`='$k';";
                        
                        //echo "$sql_write<br/>";
                        
                        $this->query ($sql_write);
                    }
                    else {
                        $sql_write = "UPDATE meta SET ".$obj->getDbField($obj->datatypes[$k])."='$v' WHERE item_id=".$obj->id." AND `key`='$k';";
                        $this->query ($sql_write);
                    }
                }
            }
            if (!$exists) {
                if (($obj->datatypes[$k]=='blob') && (file_exists($v))) {
                    $filename = explode('/',$v);
                    $filename = $filename[(count($filename)-1)];

                    $fieldName = $obj->getDbField('blob');
                    $valueBlob = fileToVar($v);

                    $id = $obj->id;

                    $sql_write = "INSERT INTO download (item_id,`key`,`data`) VALUES($id,$k,'$valueBlob');";
                    $this->query ($sql_write);

                    $sql_write = "INSERT INTO meta (item_id,`key`,$fieldName) VALUES($id,$k,'$filename');";
                    $this->query ($sql_write);

                    unlink($v);
                }
                else if (is_object($obj->fields[$k])) {
                    $sql_write = "INSERT INTO meta (item_id,`key`,".$obj->getDbField('string').") VALUES (";
                    $sql_write .= $obj->id . ",";
                    $sql_write .= "'$k',";
                    $sql_write .= "'$joined');";
                    
                    $this->query ($sql_write);
                    
                }
                else {
                    $sql_write = "INSERT INTO meta (item_id,`key`,".$obj->getDbField($obj->datatypes[$k]).") VALUES (";
                    $sql_write .= $obj->id . ",";
                    $sql_write .= "'$k',";
                    if (($obj->getDbField($obj->datatypes[$k])=="string") || ($obj->getDbField($obj->datatypes[$k]=="blob"))) $v = "'$v'";
                    $sql_write .= "$v);";

                    $this->query ($sql_write);
                }
            }
        }
        if ($sql_write) {
            //$this->query ($sql_write);
            return $obj;
        }
        else return false;
    }
    
    public function delete(&$obj=null) {
        if ($obj==null)$obj = $this;
        foreach ($obj->fields as $field) {
            if (is_object($field)) {
                foreach ($field->objects as $o) $this->delete($o);
            }
        }
        $sql = "DELETE FROM meta WHERE item_id=".$obj->id;
        $res = $this->query($sql);
        $sql = "DELETE FROM items WHERE id=".$obj->id;
        $res = $this->query($sql);
        $obj = new object($obj->name);
    }
    
    private function getSelect($id) {
        $sql = "SELECT  o.id AS object,
                        i.id AS item,
                        m.key,
                        m.".$this->getDbField("string").",
                        m.".$this->getDbField("blob").",
                        m.".$this->getDbField("number")."
                FROM items i
                INNER JOIN objects o ON i.object_id = o.id
                LEFT JOIN meta m ON m.item_id=i.id 
                WHERE i.id = $id";
        return $sql;
    }
    private function getObjectId($object) {
        $sql = "SELECT * FROM objects WHERE label = '$object'";
        $res = $this->query($sql);
        if (!$this->getNumRows($res)) {
            $sql = "INSERT INTO objects (label) VALUES ('$object')";
            $res = $this->query($sql);
            return (int)$this->getLastId();
        }
        else {
            $tab = $this->getTable($res);
            return (int)$tab[0]["id"];
        }
    }
}

class join {
    var $name = "";
    var $objects = array();
    var $parentRel = "";
    
    public function __construct($name,$parentRel) {
        $this->name = $name;
        $this->parentRel = $parentRel;
    }
    
    public function create() {
        if ((!count($this->objects)) || ($this->parentRel=='to_many')) {
            $this->objects[] = new object($this->name);
        }
    }
}
?>