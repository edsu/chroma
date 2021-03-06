(function($) {

  var last = null;

  function main() {
    var wsproto = document.location.protocol == "https:" ? "wss:" : "ws:";
    var socket = new WebSocket(wsproto + '//'+ document.location.host + "/stream");
    socket.onerror = function (error) {
      console.log(error);
    }
    socket.onmessage = function (msg) {
      add(msg);
    }
  }

  function add(msg) {
    var update = JSON.parse(msg.data);

    if (last && update.url == last.url) return;
    last = update;

    if (isBot(update)) return;

    if (update.page != 1 || update.type != "view") return;
    var i = new Image();
    i.src = update.url + "medium.jpg"
    i.addEventListener("load", function() {
      var li = $('<li><a target="_new" href="' + update.url + '"><img src="' + i.src + '"></a></li>');
      li.hide();
      $("#frontpages").prepend(li);
      if ($.browser.mobile) {
        li.slideDown(500);
      } else {
        li.fadeIn(1500);
      }
    }, false);
  }

  $(main);

})(jQuery);
