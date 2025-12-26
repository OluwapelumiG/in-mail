package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/storage"
	"gorm.io/gorm"
)

type MessageService struct{}

func NewMessageService() *MessageService {
	return &MessageService{}
}

type MessageFilter struct {
	UserID  *uuid.UUID
	To      string
	Subject string
	From    string
	Status  models.DeliveryStatus
	StartDate *time.Time
	EndDate   *time.Time
	Limit   int
	Offset  int
}

func (s *MessageService) CreateMessage(userID uuid.UUID, from, to, subject, textBody, htmlBody, rawContent, headers string) (*models.Message, error) {
	message := &models.Message{
		UserID:     userID,
		From:       from,
		To:         to,
		Subject:    subject,
		TextBody:   textBody,
		HTMLBody:   htmlBody,
		RawContent: rawContent,
		Headers:    headers,
		Status:     models.StatusSuccess,
		ReceivedAt: time.Now(),
	}

	if err := storage.DB.Create(message).Error; err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	return message, nil
}

func (s *MessageService) GetMessageByID(id uuid.UUID) (*models.Message, error) {
	var message models.Message
	if err := storage.DB.Preload("User").Preload("Attachments").First(&message, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("message not found")
		}
		return nil, err
	}
	return &message, nil
}

func (s *MessageService) ListMessages(filter MessageFilter) ([]models.Message, int64, error) {
	var messages []models.Message
	var total int64

	query := storage.DB.Model(&models.Message{})

	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}
	if filter.To != "" {
		query = query.Where("to LIKE ?", "%"+filter.To+"%")
	}
	if filter.From != "" {
		query = query.Where("from LIKE ?", "%"+filter.From+"%")
	}
	if filter.Subject != "" {
		query = query.Where("subject LIKE ?", "%"+filter.Subject+"%")
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.StartDate != nil {
		query = query.Where("received_at >= ?", *filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("received_at <= ?", *filter.EndDate)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	if filter.Limit > 0 {
		query = query.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	// Select only needed fields for list view (exclude large content fields)
	// Load attachments count but not the data
	query = query.Select("id", "user_id", "from", "to", "cc", "bcc", "subject", "status", "failure_reason", "received_at", "created_at", "updated_at")
	
	// Execute query
	if err := query.Preload("User").Order("received_at DESC").Find(&messages).Error; err != nil {
		return nil, 0, err
	}

	// Load attachment counts for each message (without data)
	for i := range messages {
		var attachmentCount int64
		storage.DB.Model(&models.Attachment{}).Where("message_id = ?", messages[i].ID).Count(&attachmentCount)
		// Create minimal attachment info for indicator
		if attachmentCount > 0 {
			var attachments []models.Attachment
			// Only select metadata, not the data
			storage.DB.Select("id", "message_id", "filename", "content_type", "size", "created_at").
				Where("message_id = ?", messages[i].ID).
				Find(&attachments)
			messages[i].Attachments = attachments
		}
	}

	return messages, total, nil
}

func (s *MessageService) DeleteMessage(id uuid.UUID) error {
	return storage.DB.Delete(&models.Message{}, "id = ?", id).Error
}

func (s *MessageService) BulkDeleteMessages(ids []uuid.UUID) error {
	return storage.DB.Where("id IN ?", ids).Delete(&models.Message{}).Error
}

func (s *MessageService) UpdateMessageStatus(id uuid.UUID, status models.DeliveryStatus, failureReason string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if failureReason != "" {
		updates["failure_reason"] = failureReason
	}
	return storage.DB.Model(&models.Message{}).Where("id = ?", id).Updates(updates).Error
}

func (s *MessageService) AddAttachment(messageID uuid.UUID, filename, contentType string, data []byte) (*models.Attachment, error) {
	attachment := &models.Attachment{
		MessageID:   messageID,
		Filename:    filename,
		ContentType: contentType,
		Size:        int64(len(data)),
		Data:        data,
	}

	if err := storage.DB.Create(attachment).Error; err != nil {
		return nil, fmt.Errorf("failed to create attachment: %w", err)
	}

	return attachment, nil
}

