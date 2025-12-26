package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/services"
	"github.com/inmail/inmail/internal/storage"
)

type MailboxHandler struct {
	userSvc    *services.UserService
	messageSvc *services.MessageService
}

func NewMailboxHandler(userSvc *services.UserService, messageSvc *services.MessageService) *MailboxHandler {
	return &MailboxHandler{
		userSvc:    userSvc,
		messageSvc: messageSvc,
	}
}

func (h *MailboxHandler) ListMailboxes(c *fiber.Ctx) error {
	role := c.Locals("role").(string)
	userID := c.Locals("user_id").(uuid.UUID)

	var users []models.User
	var err error

	if role == string(models.RoleRoot) {
		// Root can see all mailboxes
		users, err = h.userSvc.ListUsers()
	} else {
		// Regular users see only their mailbox
		user, err := h.userSvc.GetUserByID(userID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"status":  "error",
				"message": "User not found",
			})
		}
		users = []models.User{*user}
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to list mailboxes",
		})
	}

	// Remove sensitive data
	for i := range users {
		users[i].PasswordHash = ""
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   users,
	})
}

func (h *MailboxHandler) GetMailbox(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid mailbox ID",
		})
	}

	role := c.Locals("role").(string)
	userID := c.Locals("user_id").(uuid.UUID)

	// Check permissions
	if role != string(models.RoleRoot) && id != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Access denied",
		})
	}

	user, err := h.userSvc.GetUserByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Mailbox not found",
		})
	}

	user.PasswordHash = ""

	// Get message count
	var count int64
	storage.DB.Model(&models.Message{}).Where("user_id = ?", id).Count(&count)

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"mailbox":      user,
			"message_count": count,
		},
	})
}

