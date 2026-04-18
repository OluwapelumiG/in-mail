import smtplib
from email.message import EmailMessage

def send_qp_email(port=1025):
    msg = EmailMessage()
    msg['Subject'] = "Quoted-Printable Test"
    msg['From'] = "sender@test.com"
    msg['To'] = "receiver@test.com"
    
    # EmailMessage with set_content usually uses quoted-printable for utf-8
    content = "This is a test message with quoted-printable encoding = which might break things if not handled correctly. Special chars: € £."
    msg.set_content(content)
    
    try:
        with smtplib.SMTP('localhost', port) as server:
            server.send_message(msg)
        print("QP Email sent")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_qp_email()
