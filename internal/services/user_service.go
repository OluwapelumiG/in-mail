package services

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/auth"
	"github.com/inmail/inmail/internal/config"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/storage"
	"gorm.io/gorm"
)

type UserService struct{}

func NewUserService() *UserService {
	return &UserService{}
}

func (s *UserService) CreateUser(username, password, email, mailboxName string) (*models.User, error) {
	// Check if username exists
	var existingUser models.User
	if err := storage.DB.Where("username = ?", username).First(&existingUser).Error; err == nil {
		return nil, errors.New("username already exists")
	}

	// Check if mailbox name exists
	if err := storage.DB.Where("mailbox_name = ?", mailboxName).First(&existingUser).Error; err == nil {
		return nil, errors.New("mailbox name already exists")
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Username:     username,
		PasswordHash: hashedPassword,
		Email:        email,
		MailboxName:  mailboxName,
		Role:         models.RoleUser,
		Active:       true,
	}

	if err := storage.DB.Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUserByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := storage.DB.First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	if err := storage.DB.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) GetUserByMailbox(mailboxName string) (*models.User, error) {
	var user models.User
	if err := storage.DB.Where("mailbox_name = ?", mailboxName).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mailbox not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) Authenticate(username, password string) (*models.User, error) {
	user, err := s.GetUserByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.Active {
		return nil, errors.New("user account is disabled")
	}

	if !auth.CheckPasswordHash(password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

func (s *UserService) ListUsers() ([]models.User, error) {
	var users []models.User
	if err := storage.DB.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (s *UserService) UpdateUser(id uuid.UUID, updates map[string]interface{}) (*models.User, error) {
	user, err := s.GetUserByID(id)
	if err != nil {
		return nil, err
	}

	// Don't allow changing root user role
	if user.Role == models.RoleRoot {
		delete(updates, "role")
	}

	// Hash password if updating
	if password, ok := updates["password"].(string); ok && password != "" {
		hashedPassword, err := auth.HashPassword(password)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}
		updates["password_hash"] = hashedPassword
		delete(updates, "password")
	}

	if err := storage.DB.Model(user).Updates(updates).Error; err != nil {
		return nil, err
	}

	return s.GetUserByID(id)
}

func (s *UserService) DeleteUser(id uuid.UUID) error {
	user, err := s.GetUserByID(id)
	if err != nil {
		return err
	}

	if user.Role == models.RoleRoot {
		return errors.New("cannot delete root user")
	}

	return storage.DB.Delete(user).Error
}

func (s *UserService) InitializeRootUser() error {
	var count int64
	storage.DB.Model(&models.User{}).Where("role = ?", models.RoleRoot).Count(&count)
	
	if count > 0 {
		return nil // Root user already exists
	}

	hashedPassword, err := auth.HashPassword(config.AppConfig.RootPassword)
	if err != nil {
		return fmt.Errorf("failed to hash root password: %w", err)
	}

	rootUser := &models.User{
		Username:     config.AppConfig.RootUsername,
		PasswordHash: hashedPassword,
		Email:        config.AppConfig.RootEmail,
		MailboxName:  "root",
		Role:         models.RoleRoot,
		Active:       true,
	}

	return storage.DB.Create(rootUser).Error
}

