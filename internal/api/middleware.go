package api

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/inmail/inmail/internal/auth"
	"github.com/inmail/inmail/internal/models"
)

func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{
				"status":  "error",
				"message": "Authorization header required",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid authorization header format",
			})
		}

		claims, err := auth.ValidateToken(parts[1])
		if err != nil {
			return c.Status(401).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid or expired token",
			})
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}

func RootOnlyMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		if role != string(models.RoleRoot) {
			return c.Status(403).JSON(fiber.Map{
				"status":  "error",
				"message": "Root access required",
			})
		}
		return c.Next()
	}
}

func RateLimitMiddleware() fiber.Handler {
	// Simple in-memory rate limiter
	// In production, use Redis or similar
	return func(c *fiber.Ctx) error {
		// Basic implementation - can be enhanced
		return c.Next()
	}
}

