package api

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/models"
)

type Hub struct {
	clients    map[*websocket.Conn]uuid.UUID // Connection to UserID
	broadcast  chan BroadcastMessage
	register   chan *Client
	unregister chan *websocket.Conn
	mu         sync.RWMutex
}

type Client struct {
	Conn   *websocket.Conn
	UserID uuid.UUID
}

type BroadcastMessage struct {
	UserID  uuid.UUID
	Type    string
	Payload interface{}
}

var GlobalHub *Hub

func InitHub() {
	GlobalHub = &Hub{
		clients:    make(map[*websocket.Conn]uuid.UUID),
		broadcast:  make(chan BroadcastMessage),
		register:   make(chan *Client),
		unregister: make(chan *websocket.Conn),
	}
	go GlobalHub.Run()
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.Conn] = client.UserID
			h.mu.Unlock()
		case conn := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[conn]; ok {
				delete(h.clients, conn)
				conn.Close()
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			for conn, userID := range h.clients {
				if userID == message.UserID {
					msgBytes, err := json.Marshal(message)
					if err != nil {
						fmt.Printf("Error marshaling broadcast message: %v\n", err)
						continue
					}
					if err := conn.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
						fmt.Printf("Error sending websocket message: %v\n", err)
						conn.Close()
						h.mu.RUnlock()
						h.unregister <- conn
						h.mu.RLock()
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastToUser(userID uuid.UUID, msgType string, payload interface{}) {
	h.broadcast <- BroadcastMessage{
		UserID:  userID,
		Type:    msgType,
		Payload: payload,
	}
}

func (h *Hub) BroadcastNewMessage(message *models.Message) {
	h.BroadcastToUser(message.UserID, "new-message", message)
}
