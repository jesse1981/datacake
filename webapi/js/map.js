var map;
var datasets = {
	crime: "http://datacake.logisofttech.com.au/crime.csv",
	infrastructre: "",
	businesses: ""
}
var heatmaps = {
	crime: {},
	infrastructre: {},
	businesses: {}
}
  
function initMap(csv) {
	map = new google.maps.Map(document.getElementById('map'), {
	  zoom: 13,
	  center: {lat: -33.89239, lng: 151.21479},
	  mapTypeId: 'satellite'
	});
}

function preparePoints(ds,cb) {
	fetchFile(datasets[ds],function(buffer){
		csv = csvToArray(buffer);
		cb(csv);
	});
}
function getPoints(csv) {
		var points = [];
        var count = 0;
		for (var i in csv){
			if (count) points.push(new google.maps.LatLng(csv[i][8], csv[i][9]));
			count++;
		}
		return points;
    }
function createHeatmap(ds) {
	preparePoints(ds,function(csv){
		heatmaps[ds] = new google.maps.visualization.HeatmapLayer({
		  data: getPoints(csv),
		  map: map
		});
	})		
}

function toggleHeatmap() {
	heatmap.setMap(heatmap.getMap() ? null : map);
  }
function changeGradient() {
	var gradient = [
	  'rgba(0, 255, 255, 0)',
	  'rgba(0, 255, 255, 1)',
	  'rgba(0, 191, 255, 1)',
	  'rgba(0, 127, 255, 1)',
	  'rgba(0, 63, 255, 1)',
	  'rgba(0, 0, 255, 1)',
	  'rgba(0, 0, 223, 1)',
	  'rgba(0, 0, 191, 1)',
	  'rgba(0, 0, 159, 1)',
	  'rgba(0, 0, 127, 1)',
	  'rgba(63, 0, 91, 1)',
	  'rgba(127, 0, 63, 1)',
	  'rgba(191, 0, 31, 1)',
	  'rgba(255, 0, 0, 1)'
	]
	heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}
function changeRadius() {
	heatmap.set('radius', heatmap.get('radius') ? null : 20);
}
function changeOpacity() {
	heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}