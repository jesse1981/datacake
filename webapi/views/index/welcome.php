<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Lighthouse</title>
	<link rel="stylesheet" media="all" href="/css/main.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-ui-map/3.0-rc1/jquery.ui.map.extensions.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-ui-map/3.0-rc1/jquery.ui.map.extensions.min.js"></script>
	<script src="/js/map.js"></script>
	<script src="/js/functions.js"></script>
  </head>

  <body>
    <div id="top_panel">
      <button id="top_button" onclick="toggleHeatmap()">Toggle Heatmap</button>
      <button id="top_button" onclick="changeGradient()">Change gradient</button>
      <button id="top_button" onclick="changeRadius()">Change radius</button>
      <button id="top_button" onclick="changeOpacity()">Change opacity</button>
    </div>
    <div id="map"></div>
  	<div id="bottom_form">
  		<form>
  			<fieldset>
  				<legend id="legend">Crime</legend>
  				<label for="crime">Show</label><input type="checkbox" id="crime" class="enable-field" />
  				<div class="map-filter crime">
  					<label for="timeofday">Time of Day</label>
  					<select id="timeofday">
  						<option value="">Any</option>
  						<option value="Day">Day</option>
  						<option value="Night">Night</option>
  					</select>
  					<label for="dayofweek">Day of Week</label>
  					<select id="dayofweek">
  						<option value="">Any</option>
  						<option value="Weekday">Weekday</option>
  						<option value="Weekend">Weekend</option>
  					</select>
  				</div>
  			</fieldset>
  			<fieldset>
  				<legend>Infrastructure</legend>
  				<label for="infrastructre">Show</label><input type="checkbox" id="infrastructre" class="enable-field"/>
  				<div class="map-filter infrastructre">
  				
  				</div>
  			</fieldset>
  			<fieldset>
  				<legend>Businesses</legend>
  				<label for="businesses">Show</label><input type="checkbox" id="businesses" class="enable-field"/>
  				<div class="map-filter businesses">
  				
  				</div>
  			</fieldset>
  			<fieldset>
  				<legend>Weather</legend>
  				<label for="weather">Show</label><input type="checkbox" id="weather" class="enable-field" />
  				<div class="map-filter weather">
  				
  				</div>
  			</fieldset>
  		</form>
  	</div>
      <script>	
	$('.enable-field').click(function() {
		if ($(this).prop("checked")) {
			var id = $(this).attr('id');
			createHeatmap(id);
		}
	});
    </script>
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDy07BesCpsPPYc9E_l4L9v1E7-a7Utf3Q&libraries=visualization&callback=initMap">
    </script>
  </body>
</html>