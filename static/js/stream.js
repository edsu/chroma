(function($) {

  var last = null;
  var pause = false;
  var filter = 'all';
  var bots = false;

  function main() {
    var wsproto = document.location.protocol == "https:" ? "wss:" : "ws:";
    var socket = new WebSocket(wsproto + '//'+ document.location.host + "/stream");
    socket.onerror = function (error) {
      console.log(error);
    }
    socket.onmessage = function (search) {
      add(search);
    }
    $('select#filter').change(function() {
      filter = $('select#filter').val();
    });

    $('input[type="checkbox"]').change(function() {
      bots = $('input[type="checkbox"]').is(':checked');
    });
  }

  function add(msg) {
    var update = JSON.parse(msg.data);

    if (last && update.lccn == last.lccn && update.date == last.date && update.page == last.page) return;
    last = update;

    if (pause) return;

    var u = null;
    if (update.type == "search" && filter != "view") {
      u = addSearch(update)
    } else if (update.type == "view" && filter != "search") {
      u = addView(update)
    }

    if (u) {
      u.hide();
      $("#updates").prepend(u);
      u.slideDown();
    }
  }

  function addView(view) {
    var bot = isBot(view.userAgent);
    if (! bots && bot) return; 

    var s = $('<li class="update"></li>');
    var newspaper = newspapers[view.lccn];
    if (! newspaper) return null;
    if (view.page) {
      s.append(' <span class="page">page ' + view.page + '</span> of ');
    }
    var title = newspaper['title'].replace(/\.$/, '');
    s.append(' <span class="newspaper">' + title + '</span>');
    s.append(' from <span class="place">' + newspaper['city'] + ', ' + newspaper['state'] + '</span>');
    if (view.date) {
      s.append(' on <span class="date">' + view.date + '</span>');
    }
    if (bot) {
      s.append(' <span class="bot">' + bot + '</span>');
    }
    return s;
  }

  function addSearch(search) {
    var s = $('<li class="update">Search: </li>');

    if (search.any) {
      s.append(' <span class="any">' + search.any + '</span>');
    }

    if (search.all) {
      s.append(' <span class="all">' + search.all + '</span>');
    }

    if (search.phrase) {
      s.append(' <span class="phrase">' + search.phrase + '</span>');
    }

    if (search.text) {
      s.append(' <span class="text">' + search.text + '</span>');
    }

    if (search.lccn && newspapers && search.lccn[0] != "") {
      var newspaper = newspapers[search.lccn];
      var title = newspaper.title.replace(/\.$/, '');
      var parts = [];
      for (var i=0; i<search.lccn.length; i++) {
        var lccn = search.lccn[i];
        parts.push(' <span class="newspaper">' + title + '</span>');
      }
      s.append( " in " + parts.join(" and "));
    }

    if (search.date1 && search.date2 && search.date1 != "1836" && search.date2 != "1922") {
      s.append(' during <span class="date">' + search.date1 + ' - ' + search.date2 + '</span>');
    }

    if (search.state && search.state[0] != "") {
      var parts = [];
      for (var i=0; i<search.state.length; i++) {
        var state = search.state[i];
        parts.push(' <span class="place">' + state + '</span>');
      }
      s.append(' in ' + parts.join(" and "));
    }
    if (search.page && search.page != "1") {
        s.append(' <span class="page">page ' + search.page + '</span>');
    }

    return s;
  }

  $(main);

})(jQuery);
