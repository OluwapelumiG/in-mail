package smtp

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/jhillyerd/enmime"
)

type EmailParser struct{}

func NewEmailParser() *EmailParser {
	return &EmailParser{}
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

func (p *EmailParser) Parse(data []byte, from string, to []string) ParsedEmail {
	parsed := ParsedEmail{
		From: from,
		To:   strings.Join(to, ", "),
	}

	// Use enmime to parse the entire message (automatically handles RFC 2047, multiparts, and encodings)
	envelope, err := enmime.ReadEnvelope(bytes.NewReader(data))
	if err != nil {
		fmt.Printf("[Parser] enmime failed to parse: %v. Falling back to raw.\n", err)
		parsed.TextBody = string(data)
		return parsed
	}

	// Map fields from enmime envelope
	parsed.Subject = envelope.GetHeader("Subject")
	parsed.From = envelope.GetHeader("From")
	parsed.To = envelope.GetHeader("To")
	parsed.TextBody = envelope.Text
	parsed.HTMLBody = envelope.HTML

	// Extract headers from the root part (which contains all headers for the email)
	var headerBuf strings.Builder
	if envelope.Root != nil {
		for name, values := range envelope.Root.Header {
			for _, value := range values {
				headerBuf.WriteString(fmt.Sprintf("%s: %s\r\n", name, value))
			}
		}
	}
	parsed.Headers = headerBuf.String()

	// Extract attachments
	for _, att := range envelope.Attachments {
		parsed.Attachments = append(parsed.Attachments, ParsedAttachment{
			Filename:    att.FileName,
			ContentType: att.ContentType,
			Data:        att.Content,
		})
	}

	// If bodies are still empty, try to find the best available part as a fallback
	if parsed.TextBody == "" && parsed.HTMLBody == "" {
		fmt.Printf("[Parser] enmime found no text or HTML body, using Guaranteed Extractor\n")
		
		// Guaranteed Extractor: If all else fails, look for anything that looks like content in the raw data
		// We skip headers by looking for the first double newline
		rawStr := string(data)
		if parts := strings.SplitN(rawStr, "\r\n\r\n", 2); len(parts) > 1 {
			parsed.TextBody = strings.TrimSpace(parts[1])
		} else if parts := strings.SplitN(rawStr, "\n\n", 2); len(parts) > 1 {
			parsed.TextBody = strings.TrimSpace(parts[1])
		} else {
			// Absolute fallback: just show the raw data
			parsed.TextBody = rawStr
		}
	}

	return parsed
}
