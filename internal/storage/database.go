package storage

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/inmail/inmail/internal/config"
	"github.com/inmail/inmail/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Initialize() error {
	var dialector gorm.Dialector
	var err error

	cfg := config.AppConfig

	switch cfg.DatabaseType {
	case "postgres":
		dsn := fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%d sslmode=%s",
			cfg.PostgresHost,
			cfg.PostgresUser,
			cfg.PostgresPassword,
			cfg.PostgresDB,
			cfg.PostgresPort,
			cfg.PostgresSSLMode,
		)
		dialector = postgres.Open(dsn)
	case "sqlite":
		// Ensure directory exists
		dir := filepath.Dir(cfg.DatabaseDSN)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create database directory: %w", err)
		}
		dialector = sqlite.Open(cfg.DatabaseDSN)
	default:
		return fmt.Errorf("unsupported database type: %s", cfg.DatabaseType)
	}

	logLevel := logger.Silent
	if cfg.Environment == "development" {
		logLevel = logger.Info
	}

	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		// Disable foreign key constraints for SQLite compatibility
		DisableForeignKeyConstraintWhenMigrating: cfg.DatabaseType == "sqlite",
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Run migrations
	if err := Migrate(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

func Migrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.Message{},
		&models.Attachment{},
	)
}

func Close() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

