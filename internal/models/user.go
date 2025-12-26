package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleRoot UserRole = "root"
	RoleUser UserRole = "user"
)

type User struct {
	ID           uuid.UUID `gorm:"type:text;primary_key" json:"id"`
	Username     string    `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Email        string    `gorm:"index" json:"email"`
	Role         UserRole  `gorm:"type:varchar(20);not null;default:'user'" json:"role"`
	MailboxName  string    `gorm:"uniqueIndex;not null" json:"mailbox_name"`
	Active       bool      `gorm:"default:true" json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (u *User) IsRoot() bool {
	return u.Role == RoleRoot
}

