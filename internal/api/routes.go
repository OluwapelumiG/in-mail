package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/inmail/inmail/internal/api/handlers"
	"github.com/inmail/inmail/internal/services"
)

func SetupRoutes(app *fiber.App, userSvc *services.UserService, messageSvc *services.MessageService, configSvc *services.ConfigService) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userSvc)
	adminHandler := handlers.NewAdminHandler(userSvc, configSvc)
	mailboxHandler := handlers.NewMailboxHandler(userSvc, messageSvc)
	messageHandler := handlers.NewMessageHandler(messageSvc, userSvc)
	testHandler := handlers.NewTestHandler(messageSvc, configSvc)

	// Public routes
	api := app.Group("/api")
	api.Post("/auth/login", authHandler.Login)

	// Protected routes
	protected := api.Group("", AuthMiddleware())
	protected.Post("/auth/refresh", authHandler.Refresh)

	// Admin routes (root only)
	admin := protected.Group("/admin", RootOnlyMiddleware())
	admin.Get("/config", adminHandler.GetConfig)
	admin.Patch("/config", adminHandler.UpdateConfig)
	admin.Get("/users", adminHandler.ListUsers)
	admin.Post("/users", adminHandler.CreateUser)
	admin.Patch("/users/:id", adminHandler.UpdateUser)
	admin.Delete("/users/:id", adminHandler.DeleteUser)

	// Mailbox routes
	mailboxes := protected.Group("/mailboxes")
	mailboxes.Get("", mailboxHandler.ListMailboxes)
	mailboxes.Get("/:id", mailboxHandler.GetMailbox)

	// Message routes
	messages := protected.Group("/messages")
	messages.Get("", messageHandler.ListMessages)
	messages.Get("/:id", messageHandler.GetMessage)
	messages.Delete("/:id", messageHandler.DeleteMessage)
	messages.Delete("", messageHandler.BulkDeleteMessages)
	
	// Attachment routes
	attachments := protected.Group("/attachments")
	attachments.Get("/:id", messageHandler.GetAttachment)

	// Test routes
	tests := protected.Group("/test")
	tests.Post("/success", testHandler.TestSuccess)
	tests.Post("/failure", testHandler.TestFailure)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})
}

