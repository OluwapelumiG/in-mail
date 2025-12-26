package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/inmail/inmail/internal/api"
	"github.com/inmail/inmail/internal/config"
	"github.com/inmail/inmail/internal/services"
	"github.com/inmail/inmail/internal/smtp"
	"github.com/inmail/inmail/internal/storage"
)

func main() {
	// Load configuration
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	if err := storage.Initialize(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer storage.Close()

	// Initialize root user
	userSvc := services.NewUserService()
	if err := userSvc.InitializeRootUser(); err != nil {
		log.Fatalf("Failed to initialize root user: %v", err)
	}

	// Initialize services
	messageSvc := services.NewMessageService()
	configSvc := services.NewConfigService()

	// Start SMTP server
	smtpServer := smtp.NewServer(messageSvc, userSvc)
	go func() {
		if err := smtpServer.Start(); err != nil {
			log.Fatalf("Failed to start SMTP server: %v", err)
		}
	}()

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "In-Mail",
		ReadTimeout:  time.Second * 10,
		WriteTimeout: time.Second * 10,
		IdleTimeout:  time.Second * 120,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	// Setup routes
	api.SetupRoutes(app, userSvc, messageSvc, configSvc)

	// Start API server
	apiAddr := fmt.Sprintf(":%d", config.AppConfig.APIPort)
	go func() {
		log.Printf("API server starting on %s", apiAddr)
		if err := app.Listen(apiAddr); err != nil {
			log.Fatalf("Failed to start API server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

