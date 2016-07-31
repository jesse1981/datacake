function fetchFile(url,fn) {
	var myRequest = new XMLHttpRequest();
	myRequest.onreadystatechange = function() {
		if ((myRequest.readyState = 4) && (myRequest.responseText.length > 1)) {
			fn(myRequest.responseText);
		}
	}
	myRequest.open("GET", url, false);
	myRequest.setRequestHeader('Content-Type', 'text/html');
	myRequest.send();
}
function csvToArray(buffer) {
	var result = [];
	var rows = buffer.split("\r\n");
	for (var i in rows) {
		var row = [];
		var cols = rows[i];
		cols		= cols.split(",");
		for (var a in cols) {
			row.push(cols[a]);
		}
		result.push(row);
	}
	return result;
}