package main

import (
	"encoding/json"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"runtime"

	"code.google.com/p/go.net/websocket"
)

var Root = ""
var viewPattern = regexp.MustCompile(`http://chroniclingamerica.loc.gov/lccn/(\w+)/(?:(\d+-\d+-\d+)/)?(?:ed-(\d+)/)?(?:seq-(\d+)/)?$`)

// hub and connection are abstractions for keeping track of open websocket
// connections & sending broadcast events to them
// http://gary.beagledreams.com/page/go-websocket-chat.html

type hub struct {
	connections map[*connection]bool
	broadcast   chan interface{}
	register    chan *connection
	unregister  chan *connection
}

func (h *hub) run() {
	for {
		select {
		case c := <-h.register:
			log.Println("new connection", c.ws.Request().RemoteAddr)
			h.connections[c] = true
		case c := <-h.unregister:
			log.Println("closing connection", c.ws.Request().RemoteAddr)
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
	broadcast:   make(chan interface{}),
	register:    make(chan *connection),
	unregister:  make(chan *connection),
	connections: make(map[*connection]bool),
}

type connection struct {
	ws   *websocket.Conn
	send chan interface{}
}

func (c *connection) writer() {
	for search := range c.send {
		err := websocket.JSON.Send(c.ws, search)
		if err != nil {
			log.Println("uhoh: ", err)
			break
		}
	}
	c.ws.Close()
}

func wsHandler(ws *websocket.Conn) {
	c := &connection{send: make(chan interface{}, 256), ws: ws}
	h.register <- c
	defer func() { h.unregister <- c }()
	c.writer()
}

func Init() {
	_, filename, _, _ := runtime.Caller(0)
	Root = path.Dir(filename)
}

func home(w http.ResponseWriter, r *http.Request) {
	s := path.Join(Root, "templates/site.html")
	f := path.Join(Root, "templates/home.html")
	homeTemplate := template.Must(template.ParseFiles(s, f))
	homeTemplate.Execute(w, nil)
}

func mapView(w http.ResponseWriter, r *http.Request) {
	s := path.Join(Root, "templates/site.html")
	f := path.Join(Root, "templates/map.html")
	mapTemplate := template.Must(template.ParseFiles(s, f))
	mapTemplate.Execute(w, nil)
}

type Hit struct {
	Url       string `json:"url"`
	UserAgent string `json:"userAgent"`
}

func update(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			log.Println("unable to read post body", err)
			return
		}
		var hit Hit
		if err := json.Unmarshal(body, &hit); err == nil {
			update := NewUpdate(hit.Url, hit.UserAgent)
			h.broadcast <- update
		} else {
			log.Println("unable to unmarshall json", body)
		}
	}
}

type Search struct {
	Url       string   `json:"url"`
	Type      string   `json:"type"`
	Any       string   `json:"any"`
	All       string   `json:"all"`
	Phrase    string   `json:"phrase"`
	Text      string   `json:"text"`
	Page      string   `json:"page"`
	Date1     string   `json:"date1"`
	Date2     string   `json:"date2"`
	UserAgent string   `json:"userAgent"`
	Lccn      []string `json:"lccn"`
	State     []string `json:"state"`
}

type View struct {
	Type      string `json:"type"`
	Url       string `json:"url"`
	Lccn      string `json:"lccn"`
	Date      string `json:"date"`
	Edition   string `json:"edition"`
	Page      string `json:"page"`
	UserAgent string `json:"userAgent"`
}

func NewUpdate(urlString string, userAgent string) interface{} {
	parsedUrl, _ := url.Parse(urlString)
	q := parsedUrl.Query()

	if len(q) > 0 {
		return Search{
			Type:      "search",
			Url:       urlString,
			Any:       q.Get("ortext"),
			All:       q.Get("andtext"),
			Phrase:    q.Get("phrasetext"),
			Text:      q.Get("proxtext"),
			Page:      q.Get("page"),
			Date1:     q.Get("date1"),
			Date2:     q.Get("date2"),
			State:     q["state"],
			Lccn:      q["lccn"],
			UserAgent: userAgent,
		}
	}

	m := viewPattern.FindStringSubmatch(urlString)
	v := View{
		Type:      "view",
		Url:       urlString,
		UserAgent: userAgent,
	}
	if len(m) >= 2 {
		v.Lccn = m[1]
	}
	if len(m) >= 3 {
		v.Date = m[2]
	}
	if len(m) >= 4 {
		v.Page = m[3]
	}
	return v
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
	http.HandleFunc("/map/", mapView)
	http.HandleFunc("/", home)
	http.ListenAndServe(":8080", nil)
}
