package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/inmail/inmail/internal/api/handlers"
	"github.com/inmail/inmail/internal/auth"
	"github.com/inmail/inmail/internal/services"
)

func SetupRoutes(app *fiber.App, userSvc *services.UserService, messageSvc *services.MessageService, configSvc *services.ConfigService, appSvc *services.ApplicationService) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userSvc)
	adminHandler := handlers.NewAdminHandler(userSvc, configSvc)
	applicationHandler := handlers.NewApplicationHandler(appSvc)
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

	// Application routes
	applications := protected.Group("/applications")
	applications.Get("", applicationHandler.ListApplications)
	applications.Post("", applicationHandler.CreateApplication)
	applications.Delete("/:id", applicationHandler.DeleteApplication)

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

	// WebSocket endpoint
	app.Get("/ws/messages", websocket.New(func(c *websocket.Conn) {
		// Get token from query parameter 'token'
		token := c.Query("token")
		if token == "" {
			c.Close()
			return
		}

		claims, err := auth.ValidateToken(token)
		if err != nil {
			c.Close()
			return
		}

		// Register client in Hub
		client := &Client{
			Conn:   c,
			UserID: claims.UserID,
		}
		GlobalHub.register <- client

		// Read loop to keep connection alive and handle closures
		for {
			if _, _, err := c.ReadMessage(); err != nil {
				break
			}
		}
		
		GlobalHub.unregister <- c
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})
}

