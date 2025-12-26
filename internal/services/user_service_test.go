package services

import (
	"testing"

	"github.com/inmail/inmail/internal/config"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/storage"
)

func setupTestDB(t *testing.T) {
	// Use in-memory SQLite for testing
	config.AppConfig = &config.Config{
		DatabaseType: "sqlite",
		DatabaseDSN:  ":memory:",
		BcryptCost:   4, // Lower cost for faster tests
	}

	if err := storage.Initialize(); err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}
}

func teardownTestDB(t *testing.T) {
	if err := storage.Close(); err != nil {
		t.Errorf("Failed to close test database: %v", err)
	}
}

func TestUserService_CreateUser(t *testing.T) {
	setupTestDB(t)
	defer teardownTestDB(t)

	svc := NewUserService()

	user, err := svc.CreateUser("testuser", "password123", "test@example.com", "testmailbox")
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	if user.Username != "testuser" {
		t.Errorf("Username mismatch: expected testuser, got %s", user.Username)
	}

	if user.MailboxName != "testmailbox" {
		t.Errorf("MailboxName mismatch: expected testmailbox, got %s", user.MailboxName)
	}

	if user.Role != models.RoleUser {
		t.Errorf("Role mismatch: expected %s, got %s", models.RoleUser, user.Role)
	}

	// Verify password is hashed
	if user.PasswordHash == "password123" {
		t.Error("Password should be hashed")
	}
}

func TestUserService_Authenticate(t *testing.T) {
	setupTestDB(t)
	defer teardownTestDB(t)

	svc := NewUserService()

	// Create user
	_, err := svc.CreateUser("testuser", "password123", "test@example.com", "testmailbox")
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	// Test correct credentials
	user, err := svc.Authenticate("testuser", "password123")
	if err != nil {
		t.Fatalf("Authenticate failed with correct credentials: %v", err)
	}

	if user.Username != "testuser" {
		t.Errorf("Username mismatch: expected testuser, got %s", user.Username)
	}

	// Test incorrect password
	_, err = svc.Authenticate("testuser", "wrongpassword")
	if err == nil {
		t.Error("Authenticate should fail with incorrect password")
	}

	// Test non-existent user
	_, err = svc.Authenticate("nonexistent", "password123")
	if err == nil {
		t.Error("Authenticate should fail for non-existent user")
	}
}

func TestUserService_GetUserByUsername(t *testing.T) {
	setupTestDB(t)
	defer teardownTestDB(t)

	svc := NewUserService()

	// Create user
	createdUser, err := svc.CreateUser("testuser", "password123", "test@example.com", "testmailbox")
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	// Get user
	user, err := svc.GetUserByUsername("testuser")
	if err != nil {
		t.Fatalf("GetUserByUsername failed: %v", err)
	}

	if user.ID != createdUser.ID {
		t.Errorf("ID mismatch: expected %v, got %v", createdUser.ID, user.ID)
	}
}

