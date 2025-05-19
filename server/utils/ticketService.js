const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // For development environments
  }
});

// Generate PDF ticket
const generateTicket = async (event, user, ticketId) => {
  return new Promise((resolve, reject) => {
    try {
      // Verify the required data is present
      if (!event || !user) {
        throw new Error("Missing required event or user data");
      }

      // Create a PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      
      // Set up the PDF file path
      const ticketDir = path.join(__dirname, '../tickets');
      if (!fs.existsSync(ticketDir)) {
        fs.mkdirSync(ticketDir, { recursive: true });
      }
      
      const ticketPath = path.join(ticketDir, `${ticketId}.pdf`);
      const writeStream = fs.createWriteStream(ticketPath);
      
      // Pipe the PDF to the file
      doc.pipe(writeStream);
      
      // Set some PDF metadata
      doc.info.Title = `Ticket for ${event.title || 'Event'}`;
      doc.info.Author = 'CEMS - College Event Management System';
      
      // Define colors
      const primaryColor = '#5e72e4';
      const secondaryColor = '#8254e5';
      const darkTextColor = '#2d3748';
      const lightTextColor = '#718096';
      
      // Add content to the PDF - create a stylish header
      doc.rect(0, 0, doc.page.width, 150)
         .fill(primaryColor);
      
      // Add header text
      doc.fontSize(30)
         .fill('#FFFFFF')
         .font('Helvetica-Bold')
         .text('EVENT TICKET', 50, 70, { align: 'center' });
      
      // Add a decorative line
      doc.rect(50, 160, doc.page.width - 100, 2)
         .fill(secondaryColor);
         
      // Event title
      doc.fontSize(24)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text(event.title || 'Event', 50, 180, { align: 'center' });
      
      // Add event details section  
      doc.roundedRect(50, 230, doc.page.width - 100, 180, 10)
         .fill('#f8fafc');
      
      doc.fontSize(18)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('EVENT DETAILS', 70, 250);
         
      // Draw a small accent line
      doc.rect(70, 275, 30, 3)
         .fill(primaryColor);
      
      // Event details
      const detailX = 70;
      let detailY = 290;
      const lineHeight = 25;
      
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Date:', detailX, detailY)
         .font('Helvetica')
         .text(event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}) : 'TBD', detailX + 150, detailY);
      
      detailY += lineHeight;
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Time:', detailX, detailY)
         .font('Helvetica')
         .text(`${event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}) : 'TBD'} - ${event.endDate ? new Date(event.endDate).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}) : 'TBD'}`, detailX + 150, detailY);
      
      detailY += lineHeight;
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Location:', detailX, detailY)
         .font('Helvetica')
         .text(event.location || 'TBD', detailX + 150, detailY);
         
      detailY += lineHeight;
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Category:', detailX, detailY)
         .font('Helvetica')
         .text(event.category || 'General', detailX + 150, detailY);
      
      detailY += lineHeight;
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Ticket Type:', detailX, detailY)
         .font('Helvetica')
         .text(event.isPaid ? 'Paid' : 'Free', detailX + 150, detailY);
      
      // Add attendee section
      doc.roundedRect(50, 430, doc.page.width - 100, 130, 10)
         .fill('#f8fafc');
      
      doc.fontSize(18)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('ATTENDEE INFORMATION', 70, 450);
         
      // Draw a small accent line
      doc.rect(70, 475, 30, 3)
         .fill(primaryColor);
      
      // Attendee details
      let attendeeY = 490;
      
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Name:', detailX, attendeeY)
         .font('Helvetica')
         .text(user.name || 'Attendee', detailX + 150, attendeeY);
      
      attendeeY += lineHeight;
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Email:', detailX, attendeeY)
         .font('Helvetica')
         .text(user.email || 'N/A', detailX + 150, attendeeY);
      
      attendeeY += lineHeight;
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Department:', detailX, attendeeY)
         .font('Helvetica')
         .text(user.department || 'N/A', detailX + 150, attendeeY);
      
      attendeeY += lineHeight;
      doc.fontSize(12)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('Year:', detailX, attendeeY)
         .font('Helvetica')
         .text(user.year || 'N/A', detailX + 150, attendeeY);
      
      // Add ticket ID section with QR code placeholder
      doc.roundedRect(50, 580, doc.page.width - 100, 130, 10)
         .fill('#f8fafc');
         
      // Left side - Ticket ID
      doc.fontSize(18)
         .fill(darkTextColor)
         .font('Helvetica-Bold')
         .text('TICKET ID', 70, 600);
         
      // Draw a small accent line
      doc.rect(70, 625, 30, 3)
         .fill(primaryColor);
      
      doc.fontSize(14)
         .fill(darkTextColor)
         .font('Courier-Bold')
         .text(ticketId, 70, 640);
         
      // Right side - QR Code placeholder (in a real implementation, generate actual QR code)
      doc.roundedRect(doc.page.width - 200, 600, 100, 100, 5)
         .stroke(primaryColor);
      doc.fontSize(10)
         .text('QR Code', doc.page.width - 170, 645, { width: 100, align: 'center' });
      
      // Footer
      doc.fontSize(10)
         .fill(lightTextColor)
         .text('This ticket is valid only for the named attendee and is non-transferable.', 50, 730, { align: 'center' })
         .text('Please present this ticket at the event entrance.', 50, 745, { align: 'center' })
         .text(`Issued on: ${new Date().toLocaleDateString()} • College Event Management System`, 50, 760, { align: 'center' });
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the PDF to be written
      writeStream.on('finish', () => {
        resolve(ticketPath);
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Send ticket via email
const sendEventTicket = async (email, event, user, ticketId) => {
  try {
    // Validate required parameters
    if (!email || !event || !user || !ticketId) {
      throw new Error(`Missing required parameters: ${!email ? 'email' : ''} ${!event ? 'event' : ''} ${!user ? 'user' : ''} ${!ticketId ? 'ticketId' : ''}`);
    }

    console.log(`Generating ticket for user ${user.name || 'User'} for event ${event.title || 'Event'}`);
    
    // Generate ticket PDF
    const ticketPath = await generateTicket(event, user, ticketId);
    
    // Create email
    const mailOptions = {
      from: `"CEMS Events" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Ticket for ${event.title || 'Event'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Event Ticket</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Montserrat', Arial, sans-serif;
              line-height: 1.6;
              color: #4a5568;
              margin: 0;
              padding: 0;
              background-color: #f7fafc;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            
            .email-card {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              overflow: hidden;
            }
            
            .email-header {
              background: linear-gradient(135deg, #5e72e4 0%, #8254e5 100%);
              padding: 30px 20px;
              text-align: center;
            }
            
            .email-header img {
              max-width: 150px;
              margin-bottom: 15px;
            }
            
            .email-header h1 {
              color: #ffffff;
              font-size: 28px;
              margin: 0;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            
            .email-body {
              padding: 30px;
            }
            
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              font-weight: 500;
            }
            
            .message {
              margin-bottom: 25px;
              font-size: 16px;
            }
            
            .details-box {
              background-color: #f8fafc;
              border-left: 4px solid #5e72e4;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
            }
            
            .details-box h2 {
              margin-top: 0;
              margin-bottom: 15px;
              font-size: 18px;
              color: #2d3748;
              font-weight: 600;
            }
            
            .detail-row {
              display: flex;
              margin-bottom: 10px;
            }
            
            .detail-label {
              font-weight: 600;
              min-width: 110px;
              color: #4a5568;
            }
            
            .detail-value {
              color: #2d3748;
            }
            
            .ticket-id {
              font-family: 'Courier New', monospace;
              font-weight: 600;
              letter-spacing: 1px;
              color: #2d3748;
              background-color: #edf2f7;
              padding: 4px 8px;
              border-radius: 4px;
            }
            
            .instructions {
              margin-bottom: 25px;
            }
            
            .email-footer {
              background-color: #f7fafc;
              padding: 20px 30px;
              text-align: center;
              font-size: 13px;
              color: #718096;
            }
            
            .social-icons {
              margin-bottom: 15px;
            }
            
            .social-icon {
              display: inline-block;
              margin: 0 5px;
              width: 32px;
              height: 32px;
              background-color: #5e72e4;
              border-radius: 50%;
              text-align: center;
              line-height: 32px;
            }
            
            .social-icon a {
              color: #ffffff;
              text-decoration: none;
            }

            .blue-button {
              display: inline-block;
              background-color: #5e72e4;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 600;
              margin-bottom: 20px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-card">
              <div class="email-header">
                <h1>YOUR EVENT TICKET</h1>
              </div>
              
              <div class="email-body">
                <p class="greeting">Hello ${user.name || 'Attendee'}!</p>
                
                <p class="message">Thank you for registering for <strong>"${event.title || 'our event'}"</strong>! Your ticket is attached to this email as a PDF.</p>
                
                <div class="details-box">
                  <h2>Event Details</h2>
                  
                  <div class="detail-row">
                    <div class="detail-label">Date:</div>
                    <div class="detail-value">${event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}) : 'TBD'}</div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">Time:</div>
                    <div class="detail-value">${event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}) : 'TBD'} - ${event.endDate ? new Date(event.endDate).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}) : 'TBD'}</div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">Location:</div>
                    <div class="detail-value">${event.location || 'TBD'}</div>
                  </div>
                  
                  <div class="detail-row">
                    <div class="detail-label">Ticket ID:</div>
                    <div class="detail-value"><span class="ticket-id">${ticketId}</span></div>
                  </div>
                </div>
                
                <p class="instructions">Please bring this ticket (printed or digital) to the event. We look forward to seeing you!</p>
                
                <a href="#" class="blue-button">Download Calendar Invite</a>
              </div>
              
              <div class="email-footer">
                <div class="social-icons">
                  <span class="social-icon"><a href="#">f</a></span>
                  <span class="social-icon"><a href="#">t</a></span>
                  <span class="social-icon"><a href="#">in</a></span>
                </div>
                
                <p>If you have any questions, please contact us at support@cems.com</p>
                <p>&copy; ${new Date().getFullYear()} College Event Management System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `${(event.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ticket.pdf`,
          path: ticketPath,
          contentType: 'application/pdf'
        }
      ]
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Delete the temporary file
    fs.unlinkSync(ticketPath);
    
    console.log(`Ticket sent to ${email} for event ${event.title || 'Event'}`);
    return true;
  } catch (err) {
    console.error('Error sending ticket:', err);
    throw err;
  }
};

// Get ticket PDF for download
const getEventTicket = async (event, user, ticketId) => {
  try {
    const ticketPath = await generateTicket(event, user, ticketId);
    return ticketPath;
  } catch (err) {
    console.error('Error generating ticket for download:', err);
    throw err;
  }
};

module.exports = {
  sendEventTicket,
  getEventTicket
}; 