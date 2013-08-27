package main

import (
	//"encoding/json"
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
	broadcast   chan Search
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
	broadcast:   make(chan Search),
	register:    make(chan *connection),
	unregister:  make(chan *connection),
	connections: make(map[*connection]bool),
}

type connection struct {
	ws   *websocket.Conn
	send chan Search
}

func (c *connection) writer() {
	for search := range c.send {
		err := websocket.JSON.Send(c.ws, search)
		if err != nil {
			break
		}
	}
	c.ws.Close()
}

func wsHandler(ws *websocket.Conn) {
	c := &connection{send: make(chan Search, 256), ws: ws}
	h.register <- c
	defer func() { h.unregister <- c }()
	c.writer()
	//c.reader()
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
		search := NewSearch(string(body))
		h.broadcast <- search
	}
}

type Search struct {
	Url    string   `json:"url"`
	Type   string   `json:"type"`
	Any    string   `json:"any"`
	All    string   `json:"all"`
	Phrase string   `json:"phrase"`
	Text   string   `json:"text"`
	State  []string `json:"state"`
}

func NewSearch(urlString string) Search {
	//"http://chroniclingamerica.loc.gov/search/pages/results/?date1=1836&date2=1922&searchType=advanced&language=&lccn=sn89067273&proxdistance=5&state=Missouri&rows=20&ortext=&proxtext=&phrasetext=humphreys&andtext=&dateFilterType=yearRange&page=8&sort=relevance"
	u, _ := url.Parse(urlString)
	v := u.Query()
	return Search{
		Url:    urlString,
		Type:   v.Get("searchType"),
		Any:    v.Get("ortext"),
		All:    v.Get("andtext"),
		Phrase: v.Get("phrasetext"),
		Text:   v.Get("proxtext"),
		State:  v["state"],
	}
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
