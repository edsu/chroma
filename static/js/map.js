(function($) {

  var map = L.map('map', {
    center: [35.8951, -97.0363],
    zoom: 5,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
  });

  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22
  }).addTo(map);
 
  $.getJSON("/js/newspapers.json", function(data) {
    newspapers = data;
  });

  var newspaperLayer = L.geoJson().addTo(map);

  function listen() {
    var socket = new WebSocket('ws://'+ document.location.host + "/stream");
    socket.onerror = function (error) {
      console.log(error);
    }
    socket.onmessage = function (search) {
      add(search);
    }
  }

  function add(msg) {
    var update = JSON.parse(msg.data);
    var lccn = update.lccn;
    var newspaper = newspapers[lccn];
    if (! newspaper['geo']) {
      console.log('missing geo: ' + update);
      return;
    }

    var opts = {
      radius: 4,
      fillColor: "red",
      color: "red",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.2
    };

    var circle = new L.CircleMarker(new L.LatLng(newspaper.geo[0], newspaper.geo[1]), opts);
    map.addLayer(circle);
  }

  $(document).ready(listen);

})(jQuery);
