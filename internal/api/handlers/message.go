package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/services"
	"github.com/inmail/inmail/internal/storage"
)

type MessageHandler struct {
	messageSvc *services.MessageService
	userSvc    *services.UserService
}

func NewMessageHandler(messageSvc *services.MessageService, userSvc *services.UserService) *MessageHandler {
	return &MessageHandler{
		messageSvc: messageSvc,
		userSvc:    userSvc,
	}
}

func (h *MessageHandler) ListMessages(c *fiber.Ctx) error {
	role := c.Locals("role").(string)
	userID := c.Locals("user_id").(uuid.UUID)

	filter := services.MessageFilter{
		Limit:  50,
		Offset: 0,
	}

	// Set user filter if not root
	if role != string(models.RoleRoot) {
		filter.UserID = &userID
	}

	// Parse query parameters
	if to := c.Query("to"); to != "" {
		filter.To = to
	}
	if from := c.Query("from"); from != "" {
		filter.From = from
	}
	if subject := c.Query("subject"); subject != "" {
		filter.Subject = subject
	}
	if status := c.Query("status"); status != "" {
		filter.Status = models.DeliveryStatus(status)
	}
	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil {
			filter.Limit = l
		}
	}
	if offset := c.Query("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil {
			filter.Offset = o
		}
	}
	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			filter.StartDate = &t
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			filter.EndDate = &t
		}
	}

	messages, total, err := h.messageSvc.ListMessages(filter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to list messages",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"messages": messages,
			"total":    total,
			"limit":    filter.Limit,
			"offset":   filter.Offset,
		},
	})
}

func (h *MessageHandler) GetMessage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid message ID",
		})
	}

	message, err := h.messageSvc.GetMessageByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Message not found",
		})
	}

	role := c.Locals("role").(string)
	userID := c.Locals("user_id").(uuid.UUID)

	// Check permissions
	if role != string(models.RoleRoot) && message.UserID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Access denied",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   message,
	})
}

func (h *MessageHandler) DeleteMessage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid message ID",
		})
	}

	// Check permissions
	message, err := h.messageSvc.GetMessageByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Message not found",
		})
	}

	role := c.Locals("role").(string)
	userID := c.Locals("user_id").(uuid.UUID)

	if role != string(models.RoleRoot) && message.UserID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Access denied",
		})
	}

	if err := h.messageSvc.DeleteMessage(id); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to delete message",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Message deleted",
	})
}

func (h *MessageHandler) BulkDeleteMessages(c *fiber.Ctx) error {
	var req struct {
		IDs []string `json:"ids" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
		})
	}

	ids := make([]uuid.UUID, 0, len(req.IDs))
	for _, idStr := range req.IDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		ids = append(ids, id)
	}

	if err := h.messageSvc.BulkDeleteMessages(ids); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to delete messages",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Messages deleted",
	})
}

func (h *MessageHandler) GetAttachment(c *fiber.Ctx) error {
	attachmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid attachment ID",
		})
	}

	// Get attachment
	var attachment models.Attachment
	if err := storage.DB.First(&attachment, "id = ?", attachmentID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Attachment not found",
		})
	}

	// Get message to check permissions
	message, err := h.messageSvc.GetMessageByID(attachment.MessageID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Message not found",
		})
	}

	role := c.Locals("role").(string)
	userID := c.Locals("user_id").(uuid.UUID)

	// Check permissions
	if role != string(models.RoleRoot) && message.UserID != userID {
		return c.Status(403).JSON(fiber.Map{
			"status":  "error",
			"message": "Access denied",
		})
	}

	// Set headers for file download
	c.Set("Content-Type", attachment.ContentType)
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", attachment.Filename))
	c.Set("Content-Length", strconv.FormatInt(attachment.Size, 10))

	return c.Send(attachment.Data)
}

