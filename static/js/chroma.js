(function($) {

  var newspapers = {}
  var last = null;

  $.getJSON("/js/newspapers.json", function(data) {
    newspapers = data;
  });

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
    console.log(search);

    var s = $('<li class="search"></li>');

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

    if (search.date1 && search.date2 && search.date1 != "1836" && search.date2 != "1922") {
      s.append(' during <span class="date">' + search.date1 + ' - ' + search.date2 + '</span>');
    }

    if (search.state && search.state[0] != "") {
      var parts = [];
      for (var i=0; i<search.state.length; i++) {
        var state = search.state[i];
        parts.push('<span class="state">' + state + '</span>');
      }
      s.append(' in ' + parts.join(" and "));
    }

    if (search.lccn && newspapers && search.lccn[0] != "") {
      var parts = [];
      for (var i=0; i<search.lccn.length; i++) {
        var lccn = search.lccn[i];
        parts.push('<span class="newspaper">' + newspapers[lccn] + '</span>');
      }
      s.append( " in " + parts.join(" and "));
    }

    if (search.page && search.page != "1") {
        s.append('<span class="page">page ' + search.page + '</span>');
    }

    if (last == s.html()) return;
    last = s.html();

    s.hide();
    $("#updates").prepend(s);
    s.slideDown();
  }

  main();

})(jQuery);
