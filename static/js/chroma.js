(function($) {

  function main() {
    var socket = new WebSocket('ws://'+ document.location.host + "/stream");
    socket.onerror = function (error) {
      console.log(error);
    }
    socket.onmessage = function (search) {
      add(search);
    }
  }

  function add(msg) {
    var search = JSON.parse(msg.data);
    var s = $('<li class="search"></li>');
    console.log(search);
    if (search.any) {
      s.append('<span class="any">' + search.any + '</span>');
    }
    if (search.all) {
      s.append('<span class="all">' + search.all + '</span>');
    }
    if (search.phrase) {
      s.append('<span class="phrase">' + search.phrase + '</span>');
    }
    if (search.text) {
      s.append('<span class="text">' + search.text + '</span>');
    }
    if (search.state) {
      for (var i=0; i<search.state.length; i++) {
        var state = search.state[i];
        if (state) {
          s.append('<span class="state">' + state + '</span>');
        }
      }
    }
    
    s.hide();
    $("#updates").prepend(s);
    s.slideDown();
  }

  main();

})(jQuery);
