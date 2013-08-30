(function($) {

  var newspapers = {}
  var last = null;
  var pause = false;

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
    var update = JSON.parse(msg.data);
    console.log(update);
    if (pause) return;

    var u = null;
    if (update.type == "search") {
      u = addSearch(update)
    } else if (update.type == "view") {
      u = addView(update)
    }

    u.hide();
    $("#updates").prepend(u);
    u.slideDown();
  }

  function addView(view) {
    var s = $('<li class="view"></li>');
    s.append('<span class="newspaper">' + newspapers[view.lccn] + '</span>');
    if (view.date) {
      s.append(' on <span class="date">' + view.date + '</span>');
    } 
    if (view.page) {
      s.append(' on <span class="page">page ' + view.page + '</span>');
    }
    return s;
  }

  function addSearch(search) {
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

    return s;
  }

  main();

})(jQuery);
