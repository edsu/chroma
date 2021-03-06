(function($) {

  L.Icon.Default.imagePath = '/images/';

  var map = L.map('map', {
    center: [38.3, -97.0363],
    zoom: 5
  });

  L.tileLayer('https://ssl_tiles.cloudmade.com/82fc33f781f34ccd999c5ddefa49420e//1/256/{z}/{x}/{y}.png', {
    maxZoom: 22,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
  }).addTo(map);
 
  function listen() {
    var wsproto = document.location.protocol == "https:" ? "wss:" : "ws:";
    var socket = new WebSocket(wsproto + '//'+ document.location.host + "/stream");
    socket.onerror = function (error) {
      console.log(error);
    }
    socket.onmessage = function (search) {
      add(search);
    }
  }

  function add(msg) {
    var update = JSON.parse(msg.data);
    if (isBot(update.userAgent)) return;

    var lccn = update.lccn;
    var newspaper = newspapers[lccn];
    if (! newspaper || ! newspaper['geo']) {
      console.log('missing geo: ' + update.lccn);
      return;
    }

    var opts = {
      radius: 6,
      fillColor: "red",
      color: "red",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.2,
      bounceOnAdd: true
    };

    latlng = new L.LatLng(newspaper.geo[0], newspaper.geo[1]);
    var marker = new L.Marker(latlng, opts);
    marker.on("mouseover", displayNewspapers);
    marker.newspaper = newspaper;
    marker.newspaper.lccn = lccn;
    marker.addTo(map);
  }

  function displayNewspapers(e) {
    var n = e.target.newspaper;
    var link = '<a target="_new" href="http://chroniclingamerica.loc.gov/lccn/' + n.lccn + '">' + n.title + '</a> ' + n.city + ', ' + n.state;
    e.target.bindPopup(link);
    var latlng = e.target.getLatLng();
  }

  $(document).ready(listen);

})(jQuery);
