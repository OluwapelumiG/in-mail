package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/auth"
	"github.com/inmail/inmail/internal/services"
)

type AuthHandler struct {
	userSvc *services.UserService
}

func NewAuthHandler(userSvc *services.UserService) *AuthHandler {
	return &AuthHandler{userSvc: userSvc}
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	user, err := h.userSvc.Authenticate(req.Username, req.Password)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid credentials",
		})
	}

	token, err := auth.GenerateToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to generate token",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": LoginResponse{
			Token:    token,
			UserID:   user.ID.String(),
			Username: user.Username,
			Role:     string(user.Role),
		},
	})
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	username := c.Locals("username").(string)
	role := c.Locals("role").(string)

	token, err := auth.GenerateToken(userID, username, role)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to generate token",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"token": token,
		},
	})
}

