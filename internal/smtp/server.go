package smtp

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"net"
	"net/textproto"
	"strings"
	"time"

	"github.com/inmail/inmail/internal/config"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/services"
)

type Server struct {
	ports        []int
	messageSvc   *services.MessageService
	userSvc      *services.UserService
	attachments  map[string][]byte
	tlsConfig    *tls.Config
}

type Session struct {
	conn         net.Conn
	reader       *textproto.Reader
	writer       *textproto.Writer
	server       *Server
	authenticated bool
	user         *models.User
	from         string
	to           []string
	data          []byte
	port          int
}

func NewServer(messageSvc *services.MessageService, userSvc *services.UserService) *Server {
	s := &Server{
		ports:       config.AppConfig.SMTPPorts,
		messageSvc:  messageSvc,
		userSvc:     userSvc,
		attachments: make(map[string][]byte),
	}

	// Setup TLS if configured or AutoTLS is enabled
	if config.AppConfig.AutoTLS {
		err := EnsureCertificates(config.AppConfig.TLSCertPath, config.AppConfig.TLSKeyPath)
		if err != nil {
			fmt.Printf("Warning: Failed to ensure TLS certificates: %v. TLS will be disabled.\n", err)
		} else {
			cert, err := tls.LoadX509KeyPair(config.AppConfig.TLSCertPath, config.AppConfig.TLSKeyPath)
			if err != nil {
				fmt.Printf("Warning: Failed to load TLS certificates: %v. TLS will be disabled.\n", err)
			} else {
				s.tlsConfig = &tls.Config{
					Certificates: []tls.Certificate{cert},
				}
			}
		}
	} else if config.AppConfig.TLSCertPath != "" && config.AppConfig.TLSKeyPath != "" {
		cert, err := tls.LoadX509KeyPair(config.AppConfig.TLSCertPath, config.AppConfig.TLSKeyPath)
		if err == nil {
			s.tlsConfig = &tls.Config{
				Certificates: []tls.Certificate{cert},
			}
		}
	}

	return s
}

func (s *Server) Start() error {
	for _, port := range s.ports {
		go s.listenOnPort(port)
	}
	
	// Keep main goroutine alive
	select {}
}

func (s *Server) listenOnPort(port int) {
	address := fmt.Sprintf(":%d", port)
	var listener net.Listener
	var err error

	// Port 465 is traditionally implicit TLS (SMTPS)
	if port == 465 && s.tlsConfig != nil {
		listener, err = tls.Listen("tcp", address, s.tlsConfig)
		fmt.Printf("SMTP (SMTPS) server listening on %s (implicit TLS)\n", address)
	} else {
		listener, err = net.Listen("tcp", address)
		fmt.Printf("SMTP server listening on %s\n", address)
	}

	if err != nil {
		fmt.Printf("Failed to start SMTP listener on port %d: %v\n", port, err)
		return
	}

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Printf("Error accepting connection on port %d: %v\n", port, err)
			continue
		}

		go s.handleConnection(conn, port)
	}
}

func (s *Server) handleConnection(conn net.Conn, port int) {
	defer conn.Close()

	session := &Session{
		conn:   conn,
		reader: textproto.NewReader(bufio.NewReader(conn)),
		writer: textproto.NewWriter(bufio.NewWriter(conn)),
		server: s,
		to:     make([]string, 0),
		port:   port,
	}

	session.writer.PrintfLine("220 %d ESMTP In-Mail", port)

	for {
		line, err := session.reader.ReadLine()
		if err != nil {
			if err != io.EOF {
				fmt.Printf("Error reading line: %v\n", err)
			}
			break
		}

		if !session.handleCommand(line) {
			break
		}
	}
}

func (s *Session) handleCommand(line string) bool {
	parts := strings.Fields(line)
	if len(parts) == 0 {
		s.writer.PrintfLine("500 Syntax error, command unrecognized")
		return true
	}

	command := strings.ToUpper(parts[0])
	args := strings.Join(parts[1:], " ")

	switch command {
	case "HELO", "EHLO":
		s.writer.PrintfLine("250 Hello, pleased to meet you")
		return true
	case "STARTTLS":
		return s.handleStartTLS()
	case "AUTH":
		return s.handleAuth(args)
	case "MAIL":
		return s.handleMailFrom(args)
	case "RCPT":
		return s.handleRcptTo(args)
	case "DATA":
		return s.handleData()
	case "QUIT":
		s.writer.PrintfLine("221 Bye")
		return false
	case "RSET":
		s.from = ""
		s.to = make([]string, 0)
		s.data = nil
		s.writer.PrintfLine("250 OK")
		return true
	case "NOOP":
		s.writer.PrintfLine("250 OK")
		return true
	default:
		s.writer.PrintfLine("500 Command not recognized")
		return true
	}
}

func (s *Session) handleStartTLS() bool {
	if s.server.tlsConfig == nil {
		s.writer.PrintfLine("454 TLS not available")
		return true
	}

	s.writer.PrintfLine("220 Ready to start TLS")
	
	// Create TLS connection
	tlsConn := tls.Server(s.conn, s.server.tlsConfig)
	if err := tlsConn.Handshake(); err != nil {
		fmt.Printf("TLS handshake failed: %v\n", err)
		return false
	}

	// Update session with new connection and buffered reader/writer
	s.conn = tlsConn
	s.reader = textproto.NewReader(bufio.NewReader(tlsConn))
	s.writer = textproto.NewWriter(bufio.NewWriter(tlsConn))
	
	// Reset state after TLS upgrade as per RFC
	s.authenticated = false
	s.user = nil
	s.from = ""
	s.to = make([]string, 0)
	s.data = nil

	return true
}

func (s *Session) handleAuth(args string) bool {
	parts := strings.Fields(args)
	if len(parts) < 1 {
		s.writer.PrintfLine("501 Syntax error in parameters")
		return true
	}

	authType := strings.ToUpper(parts[0])
	if authType != "PLAIN" && authType != "LOGIN" {
		s.writer.PrintfLine("504 Unsupported authentication type")
		return true
	}

	if authType == "PLAIN" {
		if len(parts) < 2 {
			s.writer.PrintfLine("334")
			line, err := s.reader.ReadLine()
			if err != nil {
				return false
			}
			decoded, err := base64.StdEncoding.DecodeString(line)
			if err != nil {
				s.writer.PrintfLine("535 Authentication failed")
				return true
			}
			parts = strings.Split(string(decoded), "\x00")
		} else {
			decoded, err := base64.StdEncoding.DecodeString(parts[1])
			if err != nil {
				s.writer.PrintfLine("535 Authentication failed")
				return true
			}
			parts = strings.Split(string(decoded), "\x00")
		}

		if len(parts) < 3 {
			s.writer.PrintfLine("535 Authentication failed")
			return true
		}

		username := parts[1]
		password := parts[2]

		user, err := s.server.userSvc.Authenticate(username, password)
		if err != nil {
			s.writer.PrintfLine("535 Authentication failed")
			return true
		}

		s.authenticated = true
		s.user = user
		s.writer.PrintfLine("235 Authentication successful")
		return true
	}

	// LOGIN method
	if authType == "LOGIN" {
		s.writer.PrintfLine("334 VXNlcm5hbWU6") // "Username:" in base64
		line, err := s.reader.ReadLine()
		if err != nil {
			return false
		}
		username, err := base64.StdEncoding.DecodeString(line)
		if err != nil {
			s.writer.PrintfLine("535 Authentication failed")
			return true
		}

		s.writer.PrintfLine("334 UGFzc3dvcmQ6") // "Password:" in base64
		line, err = s.reader.ReadLine()
		if err != nil {
			return false
		}
		password, err := base64.StdEncoding.DecodeString(line)
		if err != nil {
			s.writer.PrintfLine("535 Authentication failed")
			return true
		}

		user, err := s.server.userSvc.Authenticate(string(username), string(password))
		if err != nil {
			s.writer.PrintfLine("535 Authentication failed")
			return true
		}

		s.authenticated = true
		s.user = user
		s.writer.PrintfLine("235 Authentication successful")
		return true
	}

	return true
}

func (s *Session) handleMailFrom(args string) bool {
	if !strings.HasPrefix(strings.ToUpper(args), "FROM:") {
		s.writer.PrintfLine("501 Syntax error in parameters")
		return true
	}

	email := strings.Trim(strings.TrimPrefix(strings.ToUpper(args), "FROM:"), "<>")
	s.from = email
	s.writer.PrintfLine("250 OK")
	return true
}

func (s *Session) handleRcptTo(args string) bool {
	if !strings.HasPrefix(strings.ToUpper(args), "TO:") {
		s.writer.PrintfLine("501 Syntax error in parameters")
		return true
	}

	email := strings.Trim(strings.TrimPrefix(strings.ToUpper(args), "TO:"), "<>")
	s.to = append(s.to, email)
	s.writer.PrintfLine("250 OK")
	return true
}

func (s *Session) handleData() bool {
	s.writer.PrintfLine("354 End data with <CR><LF>.<CR><LF>")

	// DotReader returns a reader that handles transparency (dot-stuffing)
	// and automatically stops at the . termination sequence.
	dr := s.reader.DotReader()
	
	var data bytes.Buffer
	n, err := io.Copy(&data, dr)
	if err != nil {
		fmt.Printf("[SMTP] Error reading DATA on port %d: %v\n", s.port, err)
		return false
	}

	s.data = data.Bytes()
	fmt.Printf("[SMTP] Captured raw email on port %d: %d bytes\n", s.port, n)
	
	return s.processMessage()
}

func (s *Session) processMessage() bool {
	if s.from == "" || len(s.to) == 0 {
		s.writer.PrintfLine("550 No valid sender or recipient")
		return true
	}

	// Determine user from authenticated session or from recipient email
	if s.user == nil {
		// Try to find user by mailbox name from recipient email
		// Extract mailbox from email (e.g., test@mailbox.local -> mailbox)
		for _, to := range s.to {
			parts := strings.Split(to, "@")
			if len(parts) > 0 {
				mailbox := parts[0]
				user, err := s.server.userSvc.GetUserByMailbox(mailbox)
				if err == nil {
					s.user = user
					break
				}
			}
		}

		// If still no user, use root or create a default
		if s.user == nil {
			rootUser, err := s.server.userSvc.GetUserByUsername(config.AppConfig.RootUsername)
			if err == nil {
				s.user = rootUser
			} else {
				s.writer.PrintfLine("550 No valid mailbox found")
				return true
			}
		}
	}

	// Parse email
	parser := NewEmailParser()
	parsed := parser.Parse(s.data, s.from, s.to)

	// Determine status based on simulation mode
	status := models.StatusSuccess
	failureReason := ""

	switch config.AppConfig.SimulationMode {
	case "failure":
		status = models.StatusPermanent
		failureReason = "Simulated failure"
	case "random":
		// Randomly fail 30% of the time
		if time.Now().Unix()%10 < 3 {
			status = models.StatusTemporary
			failureReason = "Simulated temporary failure"
		}
	}

	// Create message
	message, err := s.server.messageSvc.CreateMessage(
		s.user.ID,
		parsed.From,
		strings.Join(s.to, ", "),
		parsed.Subject,
		parsed.TextBody,
		parsed.HTMLBody,
		string(s.data),
		parsed.Headers,
	)

	if err != nil {
		s.writer.PrintfLine("550 Failed to store message")
		return true
	}

	// Save attachments
	for _, att := range parsed.Attachments {
		_, err := s.server.messageSvc.AddAttachment(message.ID, att.Filename, att.ContentType, att.Data)
		if err != nil {
			fmt.Printf("Warning: Failed to save attachment %s: %v\n", att.Filename, err)
		}
	}

	// Update status if simulated failure
	if status != models.StatusSuccess {
		s.server.messageSvc.UpdateMessageStatus(message.ID, status, failureReason)
		s.writer.PrintfLine(fmt.Sprintf("550 %s", failureReason))
		return true
	}

	s.writer.PrintfLine("250 OK: Message queued")
	return true
}







