package main

import (
	"fmt"
	"log"
	"github.com/inmail/inmail/internal/config"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/storage"
)

func main() {
	config.Load()
	if err := storage.Initialize(); err != nil {
		log.Fatal(err)
	}

	var msg models.Message
	if err := storage.DB.Order("received_at DESC").First(&msg).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Printf("ID: %s\n", msg.ID)
	fmt.Printf("Subject: %q\n", msg.Subject)
	fmt.Printf("Text Length: %d\n", len(msg.TextBody))
	fmt.Printf("HTML Length: %d\n", len(msg.HTMLBody))
	fmt.Printf("Raw Length: %d\n", len(msg.RawContent))
	fmt.Printf("Headers Length: %d\n", len(msg.Headers))
	
	if len(msg.RawContent) > 0 {
		fmt.Printf("Raw Start: %q\n", msg.RawContent[:50])
	}
}
