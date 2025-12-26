package services

import (
	"fmt"

	"github.com/inmail/inmail/internal/config"
)

type ConfigService struct{}

func NewConfigService() *ConfigService {
	return &ConfigService{}
}

type AppConfigResponse struct {
	SMTPPort         int    `json:"smtp_port"`
	APIPort          int    `json:"api_port"`
	Version          string `json:"version"`
	MaxAttachmentSize int64 `json:"max_attachment_size"`
	SimulationMode   string `json:"simulation_mode"`
	DatabaseType     string `json:"database_type"`
	Environment      string `json:"environment"`
	RootUsername     string `json:"root_username,omitempty"`
	RootPassword     string `json:"root_password,omitempty"`
}

func (s *ConfigService) GetConfig() *AppConfigResponse {
	cfg := config.AppConfig
	response := &AppConfigResponse{
		SMTPPort:         cfg.SMTPPort,
		APIPort:          cfg.APIPort,
		Version:          "1.0.0",
		MaxAttachmentSize: cfg.MaxAttachmentSize,
		SimulationMode:   cfg.SimulationMode,
		DatabaseType:     cfg.DatabaseType,
		Environment:      cfg.Environment,
		RootUsername:     cfg.RootUsername,
		RootPassword:     cfg.RootPassword,
	}
	return response
}

func (s *ConfigService) UpdateSimulationMode(mode string) error {
	validModes := map[string]bool{
		"success": true,
		"failure": true,
		"random":  true,
	}
	if !validModes[mode] {
		return fmt.Errorf("invalid simulation mode: %s", mode)
	}
	config.AppConfig.SimulationMode = mode
	return nil
}

