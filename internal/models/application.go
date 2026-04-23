package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Application struct {
	ID        uuid.UUID `gorm:"type:text;primary_key" json:"id"`
	UserID    uuid.UUID `gorm:"type:text;index;not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Name      string    `gorm:"not null" json:"name"`
	APIKey    string    `gorm:"uniqueIndex;not null" json:"api_key"`
	APISecret string    `gorm:"not null" json:"api_secret"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (a *Application) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
