# In-Mail - SMTP Trap Server

A self-hosted SMTP trap server similar to Mailtrap, built with Golang. In-Mail captures emails instead of sending them, making it perfect for development and testing environments.

## What It Does

In-Mail is an SMTP trap server that intercepts and stores emails for development and testing purposes. Instead of sending emails to real recipients, it captures them so you can:

- Test email functionality without sending real emails
- View captured emails through a web dashboard
- Inspect email headers, content, and attachments
- Simulate different delivery outcomes (success, failure, random)
- Use multiple mailboxes with separate credentials

## Features

- **SMTP Server**: Full SMTP server on port 1025 with AUTH support
- **Multi-User Support**: Multiple mailboxes with separate credentials
- **Authentication**: JWT-based API authentication with role-based access
- **Root Admin**: Super admin user with full system access
- **Email Storage**: Store emails with full headers, text, HTML, and attachments
- **Testing Modes**: Simulate success, failure, or random delivery outcomes
- **Database**: SQLite (default) or PostgreSQL support
- **Docker Ready**: Complete Docker and docker-compose setup
- **REST API**: Full REST API for email retrieval and management
- **Web Dashboard**: Modern Next.js web interface for managing emails and viewing credentials

## Setup Instructions

### Prerequisites

- Docker and Docker Compose (for containerized setup)
- OR Go 1.22+ (for local development)

### Quick Start with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd InMail
   ```

2. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your settings if needed
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the services:**
   - **Web Dashboard**: http://localhost:3000
   - **API**: http://localhost:8080
   - **SMTP**: localhost:1025

5. **Default login:**
   - Username: `admin`
   - Password: `admin123`

### Local Development Setup

1. **Install dependencies:**
   ```bash
   go mod download
   ```

2. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   ```

3. **Run the application:**
   ```bash
   go run cmd/server/main.go
   ```
   
   Or use the Makefile:
   ```bash
   make run
   ```

4. **Build binary:**
   ```bash
   make build
   ```
   The binary will be in `bin/inmail`.

### Configuration

Key environment variables (see `.env.example` for all options):

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 8080 | API server port |
| `SMTP_PORT` | 1025 | SMTP server port |
| `WEB_PORT` | 3000 | Web dashboard port |
| `DATABASE_TYPE` | sqlite | Database type (sqlite/postgres) |
| `JWT_SECRET` | change-me-in-production | JWT signing secret |
| `ROOT_USERNAME` | admin | Root admin username |
| `ROOT_PASSWORD` | admin123 | Root admin password |
| `NEXT_PUBLIC_API_URL` | http://localhost:8080 | API URL for web frontend |

### Using PostgreSQL

1. Uncomment the PostgreSQL service in `docker-compose.yml`
2. Set in `.env`:
   ```bash
   DATABASE_TYPE=postgres
   POSTGRES_HOST=postgres
   POSTGRES_USER=inmail
   POSTGRES_PASSWORD=yourpassword
   POSTGRES_DB=inmail
   ```
3. Restart services: `docker-compose down && docker-compose up -d`

### Docker Network Access

In-Mail creates a custom Docker network (`inmail-network`) with service hostnames:

- **From other Docker containers**: Use `api.inmail.local:8080` (API) or `api.inmail.local:1025` (SMTP)
- **From host machine**: Use `localhost:8080` (API) or `localhost:1025` (SMTP)

To connect your application container to the network:
```bash
docker network connect inmail-network <your-container-name>
```

Or add to your `docker-compose.yml`:
```yaml
networks:
  inmail-network:
    external: true
    name: inmail-network
```

### Testing

Run the test suite:
```bash
go test ./...
```

Or with Makefile:
```bash
make test
```

### Troubleshooting

- **Port already in use**: Change ports in `.env` or `docker-compose.yml`
- **Database errors**: 
  - SQLite: Ensure the `data/` directory is writable
  - PostgreSQL: Check connection settings in `.env`
- **SMTP not accepting connections**: Check firewall settings and verify `SMTP_PORT` is correct

## Project Structure

```
InMail/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── api/                 # REST API handlers
│   ├── auth/                # Authentication & JWT
│   ├── config/              # Configuration management
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   ├── smtp/                # SMTP server
│   └── storage/             # Database layer
├── web/                     # Next.js frontend
├── nginx/                   # Reverse proxy configuration
├── data/                    # SQLite database (created at runtime)
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
