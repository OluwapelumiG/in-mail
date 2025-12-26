package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeliveryStatus string

const (
	StatusSuccess      DeliveryStatus = "success"
	StatusFailed       DeliveryStatus = "failed"
	StatusSimulated    DeliveryStatus = "simulated"
	StatusTemporary    DeliveryStatus = "temporary"
	StatusPermanent    DeliveryStatus = "permanent"
)

type Message struct {
	ID          uuid.UUID     `gorm:"type:text;primary_key" json:"id"`
	UserID      uuid.UUID     `gorm:"type:uuid;index;not null" json:"user_id"`
	User        User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	From        string        `gorm:"not null" json:"from"`
	To          string        `gorm:"not null;index" json:"to"`
	Cc          string        `json:"cc"`
	Bcc         string        `json:"bcc"`
	Subject     string        `gorm:"index" json:"subject"`
	TextBody    string        `gorm:"type:text" json:"text_body"`
	HTMLBody    string        `gorm:"type:text" json:"html_body"`
	RawContent  string        `gorm:"type:text" json:"raw_content"`
	Headers     string        `gorm:"type:text" json:"headers"`
	Status      DeliveryStatus `gorm:"type:varchar(20);default:'success'" json:"status"`
	FailureReason string      `gorm:"type:text" json:"failure_reason,omitempty"`
	ReceivedAt  time.Time     `gorm:"index" json:"received_at"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	Attachments []Attachment `gorm:"foreignKey:MessageID" json:"attachments,omitempty"`
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type Attachment struct {
	ID          uuid.UUID `gorm:"type:text;primary_key" json:"id"`
	MessageID   uuid.UUID `gorm:"type:text;index;not null" json:"message_id"`
	Message     Message   `gorm:"foreignKey:MessageID" json:"-"`
	Filename    string    `gorm:"not null" json:"filename"`
	ContentType string    `gorm:"not null" json:"content_type"`
	Size        int64     `json:"size"`
	Data        []byte    `gorm:"type:blob" json:"-"`
	FilePath    string    `json:"file_path,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

func (a *Attachment) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

