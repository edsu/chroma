package main

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"net/url"
	"path"
	"runtime"

	"code.google.com/p/go.net/websocket"
)

var Root = ""

// hub and connection are abstractions for keeping track of open websocket
// connections & sending broadcast events to them
// http://gary.beagledreams.com/page/go-websocket-chat.html

type hub struct {
	connections map[*connection]bool
	broadcast   chan string
	register    chan *connection
	unregister  chan *connection
}

func (h *hub) run() {
	for {
		select {
		case c := <-h.register:
			h.connections[c] = true
		case c := <-h.unregister:
			delete(h.connections, c)
			close(c.send)
		case m := <-h.broadcast:
			for c := range h.connections {
				select {
				case c.send <- m:
				default:
					delete(h.connections, c)
					close(c.send)
					go c.ws.Close()
				}
			}
		}
	}
}

var h = hub{
	broadcast:   make(chan string),
	register:    make(chan *connection),
	unregister:  make(chan *connection),
	connections: make(map[*connection]bool),
}

type connection struct {
	ws   *websocket.Conn
	send chan string
}

func (c *connection) reader() {
	for {
		var message [20]byte
		n, err := c.ws.Read(message[:])
		if err != nil {
			break
		}
		h.broadcast <- string(message[:n])
	}
	c.ws.Close()
}

func (c *connection) writer() {
	for message := range c.send {
		err := websocket.Message.Send(c.ws, message)
		if err != nil {
			break
		}
	}
	c.ws.Close()
}

func wsHandler(ws *websocket.Conn) {
	c := &connection{send: make(chan string, 256), ws: ws}
	h.register <- c
	defer func() { h.unregister <- c }()
	go c.writer()
	c.reader()
}

func Init() {
	_, filename, _, _ := runtime.Caller(0)
	Root = path.Dir(filename)
}

func home(w http.ResponseWriter, r *http.Request) {
	f := path.Join(Root, "templates/home.html")
	homeTemplate := template.Must(template.ParseFiles(f))
	homeTemplate.Execute(w, nil)
}

func update(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		body, _ := ioutil.ReadAll(r.Body)
		search := parseSearch(string(body))
		h.broadcast <- fmt.Sprintf("%#v", search)
	}
}

type search struct {
	url    string
	stype  string
	any    string
	all    string
	phrase string
	text   string
	state  string
}

func parseSearch(urlString string) search {
	//"http://chroniclingamerica.loc.gov/search/pages/results/?date1=1836&date2=1922&searchType=advanced&language=&lccn=sn89067273&proxdistance=5&state=Missouri&rows=20&ortext=&proxtext=&phrasetext=humphreys&andtext=&dateFilterType=yearRange&page=8&sort=relevance"
	/*
			any words : ortext
			all words : andtext
			phrase : phrasetext
			text : proxtext
		  search type : searchType
			date range : date1-date2
	*/
	u, _ := url.Parse(urlString)
	v := u.Query()
	s := search{}
	s.url = urlString
	s.stype = v.Get("searchType")
	s.any = v.Get("ortext")
	s.all = v.Get("andtext")
	s.phrase = v.Get("phrasetext")
	s.text = v.Get("proxtext")
	fmt.Printf("%#v\n", v["state"])
	return s
}

func main() {
	Init()
	go h.run()
	static := http.FileServer(http.Dir(path.Join(Root, "static/")))
	http.Handle("/js/", static)
	http.Handle("/css/", static)
	http.Handle("/images/", static)
	http.Handle("/stream", websocket.Handler(wsHandler))
	http.HandleFunc("/update", update)
	http.HandleFunc("/", home)
	http.ListenAndServe(":8080", nil)
}
