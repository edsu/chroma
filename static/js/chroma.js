(function($) {

  var socket = new WebSocket('ws://'+ document.location.host + "/stream");

  socket.onerror = function (error) {
    console.log(error);
  }

  socket.onmessage = function (event) {
    $("#updates").append("<li>" + event.data + "</li>");
  }

})(jQuery);
