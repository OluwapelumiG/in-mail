package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/config"
)

func init() {
	// Initialize config for tests
	config.AppConfig = &config.Config{
		JWTSecret:     "test-secret-key",
		JWTExpiration: 24 * time.Hour,
	}
}

func TestGenerateToken(t *testing.T) {
	userID := uuid.New()
	username := "testuser"
	role := "user"

	token, err := GenerateToken(userID, username, role)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	if token == "" {
		t.Error("GenerateToken returned empty token")
	}
}

func TestValidateToken(t *testing.T) {
	userID := uuid.New()
	username := "testuser"
	role := "user"

	token, err := GenerateToken(userID, username, role)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("UserID mismatch: expected %v, got %v", userID, claims.UserID)
	}

	if claims.Username != username {
		t.Errorf("Username mismatch: expected %s, got %s", username, claims.Username)
	}

	if claims.Role != role {
		t.Errorf("Role mismatch: expected %s, got %s", role, claims.Role)
	}
}

func TestValidateToken_Invalid(t *testing.T) {
	invalidToken := "invalid.token.here"
	_, err := ValidateToken(invalidToken)
	if err == nil {
		t.Error("ValidateToken should fail for invalid token")
	}
}

func TestTokenExpiration(t *testing.T) {
	// This test would require mocking time, which is more complex
	// For now, we just verify the token structure
	userID := uuid.New()
	username := "testuser"
	role := "user"

	token, err := GenerateToken(userID, username, role)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.ExpiresAt == nil {
		t.Error("Token should have expiration time")
	}

	if time.Until(claims.ExpiresAt.Time) <= 0 {
		t.Error("Token should not be expired immediately")
	}
}

