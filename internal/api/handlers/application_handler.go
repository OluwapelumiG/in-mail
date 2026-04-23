package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/services"
)

type ApplicationHandler struct {
	appSvc *services.ApplicationService
}

func NewApplicationHandler(appSvc *services.ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{
		appSvc: appSvc,
	}
}

func (h *ApplicationHandler) ListApplications(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	
	apps, err := h.appSvc.ListApplicationsByUserID(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to list applications",
		})
	}

	return c.JSON(apps)
}

func (h *ApplicationHandler) CreateApplication(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	
	var input struct {
		Name string `json:"name"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	if input.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Name is required",
		})
	}

	app, err := h.appSvc.CreateApplication(userID, input.Name)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create application",
		})
	}

	return c.Status(21).JSON(app)
}

func (h *ApplicationHandler) DeleteApplication(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid application ID",
		})
	}

	// Verify ownership
	userID := c.Locals("userId").(uuid.UUID)
	app, err := h.appSvc.GetApplicationByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Application not found",
		})
	}

	if app.UserID != userID {
		return c.Status(403).JSON(fiber.Map{
			"error": "You do not have permission to delete this application",
		})
	}

	if err := h.appSvc.DeleteApplication(id); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete application",
		})
	}

	return c.SendStatus(24)
}
