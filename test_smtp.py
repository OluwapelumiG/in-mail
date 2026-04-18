import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header

def send_test_email(port=1025, encoding='quoted-printable'):
    sender = "test@sender.local"
    receiver = "target@mailbox.local"
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"Test Email ({encoding}) on Port {port}"
    msg['From'] = sender
    msg['To'] = receiver

    text = "Hello, this is a plain text body with some special characters like € and £."
    html = f"<html><body><h1>Hello!</h1><p>This is an <b>HTML</b> body with special characters: € and £.</p></body></html>"

    part1 = MIMEText(text, 'plain', 'utf-8')
    part2 = MIMEText(html, 'html', 'utf-8')

    # smtplib doesn't easily let us force quoted-printable for MIMEText, 
    # but we can manually set the payload and headers if needed for advanced testing.
    
    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP('localhost', port) as server:
            # server.set_debuglevel(1)
            server.sendmail(sender, receiver, msg.as_string())
        print(f"Email sent successfully to port {port}")
    except Exception as e:
        print(f"Failed to send email to port {port}: {e}")

if __name__ == "__main__":
    send_test_email()
