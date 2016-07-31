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
      <form>
      	<fieldset class = "fieldset">
      		<legend class="legend">Crime</legend>
      		<input type="button" id="crime" value="Show Me!" class="button_on enable-field"/>
      		<div  class="map-filter crime">
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
      	<fieldset class = "fieldset">
      		<legend class="legend">Lights</legend>
      		<input type="button" id="lights" value="Show Me!" class="button_on enable-field"/>
      		<div class="map-filter lights">
      		
      		</div>
      	</fieldset>
      	<fieldset class = "fieldset">
      		<legend class="legend">Businesses</legend>
      		<input type="button" id="businesses" value="Show Me!" class="button_on enable-field"/>      		
			<div class="map-filter businesses">
      		
      		</div>
      	</fieldset>
      	<fieldset class = "fieldset">
      		<legend class="legend">Weather</legend>
      		<input type="button" id="weather" value="Show Me!" class="button_on enable-field"/> 
      		<div class="map-filter weather">
      		
      		</div>
      	</fieldset>
      </form>
    </div>
    <div id="map"></div>

    <script>
	$('.enable-field').click(function() {
		var id = $(this).attr('id');
		var d_sets = ["crime"];
		var k_layers = ["lights"];
		if ($(this).hasClass("button_on")) {
			// enable
			if (d_sets.indexOf(id)>=0) createHeatmap(id);
			else if (k_layers.indexOf(id)>=0) createKml(id);
			
			$(this).val("Hide");
			$(this).removeClass("button_on").addClass('button_off');
		}
		else {
			// disable
			if (d_sets.indexOf(id)>=0) removeHeatmap(id);
			else if (k_layers.indexOf(id)>=0) removeKml(ds);
			
			$(this).val("Show Me!");
			$(this).removeClass("button_off").addClass('button_on');
		}
	});
    </script>
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDy07BesCpsPPYc9E_l4L9v1E7-a7Utf3Q&libraries=visualization&callback=initMap">
    </script>
  </body>
</html>