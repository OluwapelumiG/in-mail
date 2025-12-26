package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/services"
)

type AdminHandler struct {
	userSvc   *services.UserService
	configSvc *services.ConfigService
}

func NewAdminHandler(userSvc *services.UserService, configSvc *services.ConfigService) *AdminHandler {
	return &AdminHandler{
		userSvc:   userSvc,
		configSvc: configSvc,
	}
}

func (h *AdminHandler) GetConfig(c *fiber.Ctx) error {
	config := h.configSvc.GetConfig()
	return c.JSON(fiber.Map{
		"status": "success",
		"data":   config,
	})
}

func (h *AdminHandler) UpdateConfig(c *fiber.Ctx) error {
	var req struct {
		SimulationMode string `json:"simulation_mode"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	if req.SimulationMode != "" {
		if err := h.configSvc.UpdateSimulationMode(req.SimulationMode); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": err.Error(),
			})
		}
	}

	config := h.configSvc.GetConfig()
	return c.JSON(fiber.Map{
		"status": "success",
		"data":   config,
	})
}

func (h *AdminHandler) ListUsers(c *fiber.Ctx) error {
	users, err := h.userSvc.ListUsers()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to list users",
		})
	}

	// Remove password hashes from response
	for i := range users {
		users[i].PasswordHash = ""
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   users,
	})
}

func (h *AdminHandler) CreateUser(c *fiber.Ctx) error {
	var req struct {
		Username    string `json:"username" validate:"required"`
		Password    string `json:"password" validate:"required"`
		Email       string `json:"email"`
		MailboxName string `json:"mailbox_name" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	user, err := h.userSvc.CreateUser(req.Username, req.Password, req.Email, req.MailboxName)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": err.Error(),
		})
	}

	user.PasswordHash = ""
	return c.Status(201).JSON(fiber.Map{
		"status": "success",
		"data":   user,
	})
}

func (h *AdminHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid user ID",
		})
	}

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	user, err := h.userSvc.UpdateUser(id, req)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": err.Error(),
		})
	}

	user.PasswordHash = ""
	return c.JSON(fiber.Map{
		"status": "success",
		"data":   user,
	})
}

func (h *AdminHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid user ID",
		})
	}

	if err := h.userSvc.DeleteUser(id); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "User deleted",
	})
}

