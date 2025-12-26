package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	APIPort     int
	SMTPPort    int
	Environment string

	// Database
	DatabaseType     string
	DatabaseDSN      string
	PostgresHost     string
	PostgresPort     int
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string
	PostgresSSLMode  string

	// Security
	JWTSecret     string
	JWTExpiration time.Duration
	BcryptCost    int

	// Root Admin
	RootUsername string
	RootPassword string
	RootEmail    string

	// SMTP Settings
	MaxAttachmentSize int64
	SimulationMode    string // "success", "failure", "random"

	// Rate Limiting
	RateLimitEnabled bool
	RateLimitRPS     int
}

var AppConfig *Config

func Load() error {
	// Load .env file if it exists
	_ = godotenv.Load()

	AppConfig = &Config{
		APIPort:     getEnvInt("API_PORT", 8080),
		SMTPPort:    getEnvInt("SMTP_PORT", 1025),
		Environment: getEnv("ENVIRONMENT", "development"),

		DatabaseType:     getEnv("DATABASE_TYPE", "sqlite"),
		DatabaseDSN:      getEnv("DATABASE_DSN", "data/inmail.db"),
		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnvInt("POSTGRES_PORT", 5432),
		PostgresUser:     getEnv("POSTGRES_USER", "postgres"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", "postgres"),
		PostgresDB:       getEnv("POSTGRES_DB", "inmail"),
		PostgresSSLMode:  getEnv("POSTGRES_SSLMODE", "disable"),

		JWTSecret:     getEnv("JWT_SECRET", "change-me-in-production"),
		JWTExpiration: time.Duration(getEnvInt("JWT_EXPIRATION_HOURS", 24)) * time.Hour,
		BcryptCost:    getEnvInt("BCRYPT_COST", 10),

		RootUsername: getEnv("ROOT_USERNAME", "admin"),
		RootPassword: getEnv("ROOT_PASSWORD", "admin123"),
		RootEmail:    getEnv("ROOT_EMAIL", "admin@inmail.local"),

		MaxAttachmentSize: int64(getEnvInt("MAX_ATTACHMENT_SIZE_MB", 10)) * 1024 * 1024,
		SimulationMode:    getEnv("SIMULATION_MODE", "success"),

		RateLimitEnabled: getEnvBool("RATE_LIMIT_ENABLED", true),
		RateLimitRPS:     getEnvInt("RATE_LIMIT_RPS", 100),
	}

	// Validate required fields
	if AppConfig.JWTSecret == "change-me-in-production" && AppConfig.Environment == "production" {
		return fmt.Errorf("JWT_SECRET must be set in production")
	}

	if AppConfig.RootPassword == "" {
		return fmt.Errorf("ROOT_PASSWORD must be set")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

