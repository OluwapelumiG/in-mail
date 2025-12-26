package smtp

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net"
	"net/mail"
	"net/textproto"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/inmail/inmail/internal/config"
	"github.com/inmail/inmail/internal/models"
	"github.com/inmail/inmail/internal/services"
)

type Server struct {
	address      string
	messageSvc   *services.MessageService
	userSvc      *services.UserService
	attachments  map[string][]byte
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
	data         []byte
}

func NewServer(messageSvc *services.MessageService, userSvc *services.UserService) *Server {
	return &Server{
		address:     fmt.Sprintf(":%d", config.AppConfig.SMTPPort),
		messageSvc:  messageSvc,
		userSvc:     userSvc,
		attachments: make(map[string][]byte),
	}
}

func (s *Server) Start() error {
	listener, err := net.Listen("tcp", s.address)
	if err != nil {
		return fmt.Errorf("failed to start SMTP server: %w", err)
	}

	fmt.Printf("SMTP server listening on %s\n", s.address)

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Printf("Error accepting connection: %v\n", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

func (s *Server) handleConnection(conn net.Conn) {
	defer conn.Close()

	session := &Session{
		conn:   conn,
		reader: textproto.NewReader(bufio.NewReader(conn)),
		writer: textproto.NewWriter(bufio.NewWriter(conn)),
		server: s,
		to:     make([]string, 0),
	}

	session.writer.PrintfLine("220 %s ESMTP In-Mail", config.AppConfig.SMTPPort)

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

	var data bytes.Buffer
	for {
		line, err := s.reader.ReadLine()
		if err != nil {
			return false
		}

		if line == "." {
			break
		}

		// Remove leading dot if present (SMTP data transparency)
		if strings.HasPrefix(line, ".") {
			line = line[1:]
		}

		data.WriteString(line)
		data.WriteString("\r\n")
	}

	s.data = data.Bytes()
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
	parsed := s.parseEmail(s.data)

	// Validate email format - require at least text_body OR html_body
	parsed.TextBody = strings.TrimSpace(parsed.TextBody)
	parsed.HTMLBody = strings.TrimSpace(parsed.HTMLBody)
	
	if parsed.TextBody == "" && parsed.HTMLBody == "" {
		s.writer.PrintfLine("550 Message rejected: Email must contain either text/plain or text/html content")
		return true
	}

	// Validate attachments - attachments are optional, but if present must have filename and data
	for _, att := range parsed.Attachments {
		if att.Filename == "" {
			s.writer.PrintfLine("550 Message rejected: Attachments must have a filename")
			return true
		}
		if len(att.Data) == 0 {
			s.writer.PrintfLine("550 Message rejected: Attachments must have content")
			return true
		}
	}

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

type ParsedEmail struct {
	From       string
	To         string
	Subject    string
	TextBody   string
	HTMLBody   string
	Headers    string
	Attachments []ParsedAttachment
}

type ParsedAttachment struct {
	Filename    string
	ContentType string
	Data        []byte
}

func (s *Session) parseEmail(data []byte) ParsedEmail {
	parsed := ParsedEmail{
		From: s.from,
		To:   strings.Join(s.to, ", "),
	}

	// Parse the email using Go's mail package
	msg, err := mail.ReadMessage(bytes.NewReader(data))
	if err != nil {
		// Fallback: treat as plain text
		parsed.TextBody = string(data)
		return parsed
	}

	// Extract headers
	var headerBuf bytes.Buffer
	for key, values := range msg.Header {
		for _, value := range values {
			headerBuf.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
		}
	}
	parsed.Headers = headerBuf.String()

	// Extract subject
	if subject := msg.Header.Get("Subject"); subject != "" {
		parsed.Subject = subject
	}

	// Get Content-Type
	contentType := msg.Header.Get("Content-Type")
	if contentType == "" {
		// No Content-Type, read body as text
		body, _ := io.ReadAll(msg.Body)
		parsed.TextBody = string(body)
		return parsed
	}

	// Parse Content-Type to get media type and params
	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil {
		// Invalid Content-Type, read body as text
		body, _ := io.ReadAll(msg.Body)
		parsed.TextBody = string(body)
		return parsed
	}

	// Handle multipart messages
	if strings.HasPrefix(mediaType, "multipart/") {
		boundary := params["boundary"]
		if boundary == "" {
			// No boundary, fallback
			body, _ := io.ReadAll(msg.Body)
			parsed.TextBody = string(body)
			return parsed
		}

		// Use multipart reader
		mr := multipart.NewReader(msg.Body, boundary)
		s.parseMultipartWithReader(mr, &parsed)
	} else {
		// Simple message - read body
		body, _ := io.ReadAll(msg.Body)
		if strings.Contains(mediaType, "text/html") {
			parsed.HTMLBody = string(body)
		} else {
			parsed.TextBody = string(body)
		}
	}

	return parsed
}

// fallbackExtractContent tries to extract text/plain and text/html even if boundary parsing fails
func (s *Session) fallbackExtractContent(body []byte, parsed *ParsedEmail) {
	bodyStr := string(body)
	
	// Try to find text/plain sections
	textPlainPatterns := []string{
		"Content-Type: text/plain",
		"Content-Type:text/plain",
		"content-type: text/plain",
		"content-type:text/plain",
	}
	
	for _, pattern := range textPlainPatterns {
		idx := strings.Index(strings.ToLower(bodyStr), strings.ToLower(pattern))
		if idx != -1 {
			// Find the body after headers (look for double newline)
			section := bodyStr[idx:]
			parts := strings.SplitN(section, "\r\n\r\n", 2)
			if len(parts) < 2 {
				parts = strings.SplitN(section, "\n\n", 2)
			}
			if len(parts) >= 2 {
				textBody := strings.TrimSpace(parts[1])
				// Remove any trailing boundary markers
				textBody = strings.Split(textBody, "\r\n----")[0]
				textBody = strings.Split(textBody, "\n----")[0]
				textBody = strings.TrimSpace(textBody)
				if textBody != "" && parsed.TextBody == "" {
					parsed.TextBody = textBody
					break
				}
			}
		}
	}
	
	// Try to find text/html sections
	textHTMLPatterns := []string{
		"Content-Type: text/html",
		"Content-Type:text/html",
		"content-type: text/html",
		"content-type:text/html",
	}
	
	for _, pattern := range textHTMLPatterns {
		idx := strings.Index(strings.ToLower(bodyStr), strings.ToLower(pattern))
		if idx != -1 {
			// Find the body after headers (look for double newline)
			section := bodyStr[idx:]
			parts := strings.SplitN(section, "\r\n\r\n", 2)
			if len(parts) < 2 {
				parts = strings.SplitN(section, "\n\n", 2)
			}
			if len(parts) >= 2 {
				htmlBody := strings.TrimSpace(parts[1])
				// Remove any trailing boundary markers
				htmlBody = strings.Split(htmlBody, "\r\n----")[0]
				htmlBody = strings.Split(htmlBody, "\n----")[0]
				htmlBody = strings.TrimSpace(htmlBody)
				if htmlBody != "" && parsed.HTMLBody == "" {
					parsed.HTMLBody = htmlBody
					break
				}
			}
		}
	}
}

func (s *Session) extractBoundary(headers string) string {
	lines := strings.Split(headers, "\r\n")
	for _, line := range lines {
		lineLower := strings.ToLower(line)
		if strings.Contains(lineLower, "boundary=") {
			// Handle boundary="value" or boundary=value
			parts := strings.SplitN(line, "boundary=", 2)
			if len(parts) == 2 {
				boundary := strings.TrimSpace(parts[1])
				// Remove quotes
				boundary = strings.Trim(boundary, "\"")
				boundary = strings.Trim(boundary, "'")
				// Remove semicolon if present
				boundary = strings.TrimSuffix(boundary, ";")
				boundary = strings.TrimSpace(boundary)
				return boundary
			}
		}
	}
	return ""
}

func (s *Session) extractFilename(headers string) string {
	lines := strings.Split(headers, "\r\n")
	
	// First, try to find RFC 2231 encoded filename (filename*0*=...; filename*1*=...)
	filenameParts := make(map[int]string)
	hasRFC2231 := false
	for _, line := range lines {
		lineLower := strings.ToLower(line)
		if strings.Contains(lineLower, "filename*") {
			hasRFC2231 = true
			// Extract filename*0*=, filename*1*=, etc.
			if idx := strings.Index(lineLower, "filename*"); idx != -1 {
				rest := line[idx+9:] // Skip "filename*"
				// Find the part number (0, 1, 2, etc.)
				if partEnd := strings.Index(rest, "*="); partEnd != -1 {
					partNumStr := rest[:partEnd]
					// Extract the value after *=
					valueStart := idx + 9 + partEnd + 2
					if valueStart < len(line) {
						value := strings.TrimSpace(line[valueStart:])
						// Remove quotes and semicolon
						value = strings.Trim(value, "\"")
						value = strings.Trim(value, "'")
						value = strings.TrimSuffix(value, ";")
						value = strings.TrimSpace(value)
						
						// Parse part number
						if partNum, err := strconv.Atoi(partNumStr); err == nil {
							// Handle utf-8'' prefix in filename*0*
							if partNum == 0 && strings.HasPrefix(value, "utf-8''") {
								value = value[7:] // Remove "utf-8''"
							}
							// URL decode the value
							if decoded, err := url.QueryUnescape(value); err == nil {
								filenameParts[partNum] = decoded
							} else {
								filenameParts[partNum] = value
							}
						}
					}
				}
			}
		}
	}
	
	// If we found RFC 2231 encoded filename parts, combine them
	if hasRFC2231 && len(filenameParts) > 0 {
		var combined strings.Builder
		for i := 0; i < 100; i++ { // Max 100 parts
			if part, ok := filenameParts[i]; ok {
				combined.WriteString(part)
			} else {
				break
			}
		}
		if combined.Len() > 0 {
			return combined.String()
		}
	}
	
	// Fallback to regular filename= extraction
	for _, line := range lines {
		lineLower := strings.ToLower(line)
		if strings.Contains(lineLower, "filename=") && !strings.Contains(lineLower, "filename*") {
			// Handle filename="value" or filename=value
			parts := strings.SplitN(line, "filename=", 2)
			if len(parts) == 2 {
				filename := strings.TrimSpace(parts[1])
				// Remove quotes
				filename = strings.Trim(filename, "\"")
				filename = strings.Trim(filename, "'")
				// Remove semicolon
				filename = strings.TrimSuffix(filename, ";")
				filename = strings.TrimSpace(filename)
				return filename
			}
		}
	}
	
	// Last resort: try to extract from Content-Type name parameter
	for _, line := range lines {
		lineLower := strings.ToLower(line)
		if strings.Contains(lineLower, "content-type:") && strings.Contains(lineLower, "name=") {
			// Extract name="value" from Content-Type
			if nameIdx := strings.Index(lineLower, "name="); nameIdx != -1 {
				rest := line[nameIdx+5:]
				// Remove quotes
				rest = strings.Trim(rest, "\"")
				rest = strings.Trim(rest, "'")
				// Remove semicolon and other parameters
				if semicolonIdx := strings.Index(rest, ";"); semicolonIdx != -1 {
					rest = rest[:semicolonIdx]
				}
				filename := strings.TrimSpace(rest)
				if filename != "" {
					return filename
				}
			}
		}
	}
	
	return ""
}

func (s *Session) extractFilenameFromContentType(headers string) string {
	lines := strings.Split(headers, "\r\n")
	for _, line := range lines {
		lineLower := strings.ToLower(line)
		if strings.Contains(lineLower, "content-type:") && strings.Contains(lineLower, "name=") {
			// Extract name="value" from Content-Type: image/png; name="value"
			if nameIdx := strings.Index(lineLower, "name="); nameIdx != -1 {
				rest := line[nameIdx+5:]
				// Remove quotes
				rest = strings.Trim(rest, "\"")
				rest = strings.Trim(rest, "'")
				// Remove semicolon and other parameters
				if semicolonIdx := strings.Index(rest, ";"); semicolonIdx != -1 {
					rest = rest[:semicolonIdx]
				}
				filename := strings.TrimSpace(rest)
				if filename != "" {
					return filename
				}
			}
		}
	}
	return ""
}

func (s *Session) extractContentType(headers string) string {
	lines := strings.Split(headers, "\r\n")
	for _, line := range lines {
		lineLower := strings.ToLower(line)
		if strings.HasPrefix(lineLower, "content-type:") {
			// Extract content type (e.g., "application/pdf" from "Content-Type: application/pdf")
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				contentType := strings.TrimSpace(parts[1])
				// Remove parameters (e.g., "application/pdf; charset=utf-8" -> "application/pdf")
				if idx := strings.Index(contentType, ";"); idx != -1 {
					contentType = strings.TrimSpace(contentType[:idx])
				}
				return contentType
			}
		}
	}
	return "application/octet-stream"
}

func (s *Session) inferContentType(filename string) string {
	filename = strings.ToLower(filename)
	if strings.HasSuffix(filename, ".png") {
		return "image/png"
	} else if strings.HasSuffix(filename, ".jpg") || strings.HasSuffix(filename, ".jpeg") {
		return "image/jpeg"
	} else if strings.HasSuffix(filename, ".gif") {
		return "image/gif"
	} else if strings.HasSuffix(filename, ".pdf") {
		return "application/pdf"
	} else if strings.HasSuffix(filename, ".zip") {
		return "application/zip"
	} else if strings.HasSuffix(filename, ".txt") {
		return "text/plain"
	} else if strings.HasSuffix(filename, ".html") || strings.HasSuffix(filename, ".htm") {
		return "text/html"
	} else if strings.HasSuffix(filename, ".json") {
		return "application/json"
	} else if strings.HasSuffix(filename, ".xml") {
		return "application/xml"
	} else if strings.HasSuffix(filename, ".csv") {
		return "text/csv"
	}
	return "application/octet-stream"
}

func (s *Session) parseMultipartWithReader(mr *multipart.Reader, parsed *ParsedEmail) {
	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		// Get Content-Type
		contentType := part.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "text/plain"
		}
		mediaType, _, _ := mime.ParseMediaType(contentType)

		// Get Content-Disposition
		disposition := part.Header.Get("Content-Disposition")
		isAttachment := strings.HasPrefix(disposition, "attachment") || strings.Contains(disposition, "attachment")

		// Read part body
		partBody, err := io.ReadAll(part)
		if err != nil {
			continue
		}

		// Check if base64 encoded
		encoding := part.Header.Get("Content-Transfer-Encoding")
		isBase64 := strings.ToLower(encoding) == "base64"

		// Decode if needed
		if isBase64 {
			decoded, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(string(partBody), "\r\n", ""))
			if err == nil {
				partBody = decoded
			}
		}

		// Handle attachments
		if isAttachment {
			filename := part.FileName()
			if filename == "" {
				// Try to get from Content-Disposition header
				if _, params, err := mime.ParseMediaType(disposition); err == nil {
					filename = params["filename"]
				}
			}
			if filename == "" {
				// Skip attachments without filename
				continue
			}
			parsed.Attachments = append(parsed.Attachments, ParsedAttachment{
				Filename:    filename,
				ContentType: mediaType,
				Data:        partBody,
			})
			continue
		}

		// Handle nested multipart
		if strings.HasPrefix(mediaType, "multipart/") {
			// Extract boundary from Content-Type
			_, params, err := mime.ParseMediaType(contentType)
			if err == nil {
				if boundary := params["boundary"]; boundary != "" {
					nestedMr := multipart.NewReader(bytes.NewReader(partBody), boundary)
					s.parseMultipartWithReader(nestedMr, parsed)
					continue
				}
			}
		}

		// Handle text/plain
		if mediaType == "text/plain" {
			textBody := strings.TrimSpace(string(partBody))
			if textBody != "" && textBody != `"` {
				if parsed.TextBody == "" || len(textBody) > len(parsed.TextBody) {
					parsed.TextBody = textBody
				}
			}
		}

		// Handle text/html
		if mediaType == "text/html" {
			htmlBody := strings.TrimSpace(string(partBody))
			if htmlBody != "" && htmlBody != `"` {
				if parsed.HTMLBody == "" || len(htmlBody) > len(parsed.HTMLBody) {
					parsed.HTMLBody = htmlBody
				}
			}
		}
	}
}

// Legacy parseMultipart - kept for backward compatibility but should use parseMultipartWithReader
func (s *Session) parseMultipart(body []byte, boundary string, parsed *ParsedEmail) {
	// The boundary value from header might already include -- prefix
	// In the body, boundaries appear as: ----boundary (4 dashes) or --boundary (2 dashes)
	// Normalize: remove -- prefix from boundary value if present
	boundaryValue := boundary
	boundaryWithoutPrefix := boundary
	if strings.HasPrefix(boundaryWithoutPrefix, "--") {
		boundaryWithoutPrefix = boundaryWithoutPrefix[2:]
	}
	
	// Try different boundary marker formats that appear in email bodies
	// Most common: ----boundary (4 dashes) where boundary value is --boundary
	// So we need: ---- + (boundary without --) = ----boundary
	boundaryMarkers := [][]byte{
		[]byte("\r\n----" + boundaryWithoutPrefix), // Most common: 4 dashes + boundary without -- prefix
		[]byte("\n----" + boundaryWithoutPrefix),
		[]byte("----" + boundaryWithoutPrefix),     // At start of line or without newline
		[]byte("\r\n----" + boundaryValue),         // 4 dashes + boundary with -- prefix (less common)
		[]byte("\n----" + boundaryValue),
		[]byte("----" + boundaryValue),
		[]byte("\r\n--" + boundaryWithoutPrefix),   // 2 dashes + boundary without -- prefix
		[]byte("\n--" + boundaryWithoutPrefix),
		[]byte("--" + boundaryWithoutPrefix),
		[]byte("\r\n--" + boundaryValue),           // 2 dashes + boundary with -- prefix
		[]byte("\n--" + boundaryValue),
		[]byte("--" + boundaryValue),
		[]byte(boundaryValue),
		[]byte(boundaryWithoutPrefix),
	}

	var parts [][]byte
	for _, marker := range boundaryMarkers {
		if bytes.Contains(body, marker) {
			parts = bytes.Split(body, marker)
			break
		}
	}

	if len(parts) == 0 {
		// Fallback: try to extract text/plain and text/html using regex-like search
		s.fallbackExtractContent(body, parsed)
		return
	}
	
	// If we found parts but they're all empty, try fallback
	if len(parts) > 0 {
		hasContent := false
		for _, part := range parts {
			if len(bytes.TrimSpace(part)) > 0 {
				hasContent = true
				break
			}
		}
		if !hasContent {
			s.fallbackExtractContent(body, parsed)
			return
		}
	}

	// Process each part
	for i, part := range parts {
		partStr := string(part)
		
		// Skip empty parts and the first part (preamble before first boundary)
		partStr = strings.TrimSpace(partStr)
		if partStr == "" || (i == 0 && len(parts) > 1) {
			continue
		}
		
		// Remove leading/trailing dashes and newlines that might be part of boundary markers
		partStr = strings.TrimPrefix(partStr, "--")
		partStr = strings.TrimSuffix(partStr, "--")
		partStr = strings.TrimSpace(partStr)
		
		if partStr == "" {
			continue
		}

		
		// Split part into headers and body
		partParts := strings.SplitN(partStr, "\r\n\r\n", 2)
		if len(partParts) < 2 {
			// Try single newline
			partParts = strings.SplitN(partStr, "\n\n", 2)
		}
		
		var partHeaders string
		var partBody string
		if len(partParts) >= 2 {
			partHeaders = partParts[0]
			partBody = partParts[1]
		} else if len(partParts) == 1 {
			// No headers, just body
			partBody = partParts[0]
		}

		// Clean up partBody - remove trailing boundary markers
		// Only remove boundaries that appear at the end, don't be too aggressive
		partBody = strings.TrimSpace(partBody)
		
		// Remove trailing boundary markers (they appear at the end of content)
		// Check for boundary patterns at the end of the string
		boundaryPatterns := []string{
			"\r\n----" + boundaryWithoutPrefix,
			"\n----" + boundaryWithoutPrefix,
			"----" + boundaryWithoutPrefix,
			"\r\n----" + boundaryValue,
			"\n----" + boundaryValue,
			"----" + boundaryValue,
			"\r\n--" + boundaryWithoutPrefix,
			"\n--" + boundaryWithoutPrefix,
			"--" + boundaryWithoutPrefix,
		}
		
		for _, pattern := range boundaryPatterns {
			if strings.HasSuffix(partBody, pattern) {
				partBody = strings.TrimSuffix(partBody, pattern)
			}
			if strings.HasSuffix(partBody, pattern+"--") {
				partBody = strings.TrimSuffix(partBody, pattern+"--")
			}
		}
		
		// Remove trailing dashes and whitespace
		partBody = strings.TrimSuffix(partBody, "--")
		partBody = strings.TrimSpace(partBody)
		
		// Use partHeaders for content-type checks if we have headers, otherwise use partStr
		partLower := strings.ToLower(partHeaders)
		if partLower == "" {
			partLower = strings.ToLower(partStr)
		}

		// Helper function to decode base64 if needed
		decodeBody := func(body string, isBase64 bool) string {
			if isBase64 {
				decoded, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(body, "\r\n", ""))
				if err == nil {
					return string(decoded)
				}
			}
			return body
		}

		// Check if base64 encoded
		isBase64 := strings.Contains(partLower, "content-transfer-encoding: base64") ||
		            strings.Contains(partLower, "content-transfer-encoding:base64")

		// Check for attachment (ONLY if Content-Disposition is "attachment", not "inline")
		// Reject inline attachments - they must be explicitly marked as attachments
		hasContentDisposition := strings.Contains(partLower, "content-disposition:")
		isAttachment := (strings.Contains(partLower, "content-disposition: attachment") || 
		                strings.Contains(partLower, "content-disposition:attachment")) &&
		               !strings.Contains(partLower, "content-disposition: inline") &&
		               !strings.Contains(partLower, "content-disposition:inline")
		
		// If Content-Disposition exists but is not "attachment", reject it
		if hasContentDisposition && !isAttachment {
			// This is an inline attachment or other disposition - skip it
			continue
		}
		
		if isAttachment {
			// Extract attachment info
			filename := s.extractFilename(partStr)
			if filename == "" {
				// Try Content-Type name parameter as fallback
				filename = s.extractFilenameFromContentType(partStr)
			}
			
			contentType := s.extractContentType(partStr)
			
			if filename == "" {
				// Reject attachments without filename
				continue
			}
			
			if partBody != "" {
				// Decode base64 if needed
				attachmentData := []byte(partBody)
				if isBase64 {
					base64Data := strings.ReplaceAll(partBody, "\r\n", "")
					base64Data = strings.ReplaceAll(base64Data, "\n", "")
					base64Data = strings.ReplaceAll(base64Data, " ", "")
					decoded, err := base64.StdEncoding.DecodeString(base64Data)
					if err == nil {
						attachmentData = decoded
					} else {
						// Skip invalid base64 attachments
						continue
					}
				}
				parsed.Attachments = append(parsed.Attachments, ParsedAttachment{
					Filename:    filename,
					ContentType: contentType,
					Data:        attachmentData,
				})
				continue
			}
		}

		// Check for nested multipart first (before processing content)
		if strings.Contains(partLower, "multipart/") {
			nestedBoundary := s.extractBoundary(partStr)
			if nestedBoundary != "" {
				// Use the original partBody before cleanup for nested parsing
				originalPartBody := partBody
				if len(partParts) >= 2 {
					originalPartBody = partParts[1]
				}
				// Parse nested multipart using standard library
				nestedMr := multipart.NewReader(bytes.NewReader([]byte(originalPartBody)), nestedBoundary)
				s.parseMultipartWithReader(nestedMr, parsed)
			} else {
				// If we can't find boundary, try fallback extraction
				s.fallbackExtractContent([]byte(partBody), parsed)
			}
			continue // Skip further processing of this part, nested parser handles it
		}

		// Check Content-Type for text/plain or text/html
		// We check both independently to ensure we extract both when available
		hasTextPlain := strings.Contains(partLower, "content-type: text/plain") || 
		                strings.Contains(partLower, "content-type:text/plain")
		hasTextHTML := strings.Contains(partLower, "content-type: text/html") || 
		               strings.Contains(partLower, "content-type:text/html")

		// Extract text/plain if found
		if hasTextPlain && partBody != "" {
			decodedText := decodeBody(partBody, isBase64)
			decodedText = strings.TrimSpace(decodedText)
			// Set if we got meaningful content
			if decodedText != "" && decodedText != `"` {
				// Always use the longer/more complete version
				if parsed.TextBody == "" || len(decodedText) > len(parsed.TextBody) {
					parsed.TextBody = decodedText
				}
			}
		}

		// Extract text/html if found - prioritize HTML over text
		if hasTextHTML && partBody != "" {
			decodedHTML := decodeBody(partBody, isBase64)
			decodedHTML = strings.TrimSpace(decodedHTML)
			// Set if we got meaningful content
			if decodedHTML != "" && decodedHTML != `"` {
				// Always use the longer/more complete version
				if parsed.HTMLBody == "" || len(decodedHTML) > len(parsed.HTMLBody) {
					parsed.HTMLBody = decodedHTML
				}
			}
		}

		// If no Content-Type header and not multipart/attachment, assume text/plain
		if !hasTextPlain && !hasTextHTML && 
		   !strings.Contains(partLower, "content-type:") && 
		   !isAttachment &&
		   partBody != "" {
			decodedText := decodeBody(partBody, isBase64)
			decodedText = strings.TrimSpace(decodedText)
			if decodedText != "" && len(decodedText) > 1 && decodedText != `"` && parsed.TextBody == "" {
				parsed.TextBody = decodedText
			}
		}
	}
}

// TLS support (optional)
func (s *Server) enableTLS(certFile, keyFile string) error {
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return err
	}

	config := &tls.Config{
		Certificates: []tls.Certificate{cert},
	}

	// This would be used if we upgrade the connection
	_ = config
	return nil
}

