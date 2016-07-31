var map;
var datasets = {
	crime: "http://datacake.logisofttech.com.au/crime/getAssets",
	lights: "http://datacake.logisofttech.com.au/lights/getAssets",
	buildings: "http://datacake.logisofttech.com.au/buildings/getAssets",
	weather: "http://datacake.logisofttech.com.au/weather/getAssets",
	restaurants: "http://datacake.logisofttech.com.au/restaurants/getAssets"
};
var heatmaps = {
	crime: {},
	lights: {},
	buildings: {},
	weather: {},
	restaurants: {}
};
var kmllayers = {
	crime: "",
	lights: "http://googlemaps.github.io/js-v2-samples/ggeoxml/cta.kml", //"http://datacake.logisofttech.com.au/kml/lights.kml",
	buildings: "",
	weather: "",
	restaurants: ""
};
var kmllayers_used = {
	crime: {},
	lights: {},
	buildings: {},
	weather: {},
	restaurants: {}
};
  
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
function removeHeatmap(ds) {
	heatmaps[ds].setMap(null);
}
function createKml(ds) {
	kmllayers_used[ds] = new google.maps.KmlLayer({
	  url: kmllayers[ds],
	  map: map
	});

}
function removeKml(ds) {
	kmllayers_used.setMap(null);
}

// Google Functions
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