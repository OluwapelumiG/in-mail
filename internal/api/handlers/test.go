package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/services"
)

type TestHandler struct {
	messageSvc *services.MessageService
	configSvc  *services.ConfigService
}

func NewTestHandler(messageSvc *services.MessageService, configSvc *services.ConfigService) *TestHandler {
	return &TestHandler{
		messageSvc: messageSvc,
		configSvc:  configSvc,
	}
}

func (h *TestHandler) TestSuccess(c *fiber.Ctx) error {
	// Temporarily set simulation mode to success
	originalMode := h.configSvc.GetConfig().SimulationMode
	h.configSvc.UpdateSimulationMode("success")

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Simulation mode set to success. Next email will be accepted.",
		"data": fiber.Map{
			"simulation_mode": "success",
			"original_mode":   originalMode,
		},
	})
}

func (h *TestHandler) TestFailure(c *fiber.Ctx) error {
	var req struct {
		Type string `json:"type"` // "temporary" or "permanent"
	}

	if err := c.BodyParser(&req); err != nil {
		req.Type = "permanent"
	}

	mode := "failure"
	if req.Type == "temporary" {
		mode = "random" // Use random for temporary failures
	}

	originalMode := h.configSvc.GetConfig().SimulationMode
	h.configSvc.UpdateSimulationMode(mode)

	status := models.StatusPermanent
	if req.Type == "temporary" {
		status = models.StatusTemporary
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Simulation mode set to failure. Next email will be rejected.",
		"data": fiber.Map{
			"simulation_mode": mode,
			"failure_type":    status,
			"original_mode":   originalMode,
		},
	})
}

