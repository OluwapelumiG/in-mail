package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/storage"
)

type ApplicationService struct {
	userSvc *UserService
}

func NewApplicationService(userSvc *UserService) *ApplicationService {
	return &ApplicationService{userSvc: userSvc}
}

func (s *ApplicationService) CreateApplication(userID uuid.UUID, name string) (*models.Application, error) {
	// Generate credentials
	apiKey, err := generateRandomString(16)
	if err != nil {
		return nil, fmt.Errorf("failed to generate API Key: %w", err)
	}

	apiSecret, err := generateRandomString(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate API Secret: %w", err)
	}

	// Create associated user for this inbox
	mailboxName := slugify(name)
	// Add random suffix if mailbox exists or just let it fail?
	// The requirement says "directly creating the user", so let's ensure it's unique.
	// We'll use the API key suffix for uniqueness if needed, or just the slug.
	
	_, err = s.userSvc.CreateUser(
		"app_"+apiKey, // Technical username
		apiSecret,      // API Secret acts as password
		"",             // No email needed
		mailboxName,    // This is the important part for SMTP routing
	)
	if err != nil {
		// If mailbox exists, try with a suffix
		mailboxName = fmt.Sprintf("%s-%s", mailboxName, apiKey[:4])
		_, err = s.userSvc.CreateUser(
			"app_"+apiKey,
			apiSecret,
			"",
			mailboxName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create associated inbox user: %w", err)
		}
	}

	app := &models.Application{
		UserID:    userID,
		Name:      name,
		APIKey:    "in_" + apiKey,
		APISecret: apiSecret,
	}

	if err := storage.DB.Create(app).Error; err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	return app, nil
}

func (s *ApplicationService) GetApplicationByID(id uuid.UUID) (*models.Application, error) {
	var app models.Application
	if err := storage.DB.First(&app, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (s *ApplicationService) GetApplicationByAPIKey(apiKey string) (*models.Application, error) {
	var app models.Application
	if err := storage.DB.Where("api_key = ?", apiKey).First(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (s *ApplicationService) ListApplicationsByUserID(userID uuid.UUID) ([]models.Application, error) {
	var apps []models.Application
	if err := storage.DB.Where("user_id = ?", userID).Find(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (s *ApplicationService) DeleteApplication(id uuid.UUID) error {
	return storage.DB.Delete(&models.Application{}, "id = ?", id).Error
}

func generateRandomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func slugify(s string) string {
	s = strings.ToLower(s)
	s = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}
