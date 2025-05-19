const QRCode = require('qrcode');
const htmlPdf = require('html-pdf-node');
const path = require('path');
const fs = require('fs');

/**
 * Generate a QR code for a ticket
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 1
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate HTML content for the ticket
 * @param {Object} event - Event details
 * @param {Object} user - User details
 * @param {string} qrCodeData - QR code data URL
 * @param {string} ticketId - Unique ticket ID
 * @returns {string} - HTML content for ticket
 */
const generateTicketHTML = (event, user, qrCodeData, ticketId) => {
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Event Ticket</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .ticket-container {
            width: 800px;
            margin: 20px auto;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(0,0,0,0.15);
          }
          .ticket-header {
            background: #4a90e2;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .ticket-body {
            padding: 20px;
            display: flex;
          }
          .ticket-info {
            flex: 2;
            padding-right: 20px;
          }
          .ticket-qr {
            flex: 1;
            text-align: center;
            border-left: 1px dashed #ccc;
            padding-left: 20px;
          }
          .event-title {
            font-size: 24px;
            margin-bottom: 10px;
          }
          .ticket-detail {
            margin-bottom: 15px;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            color: #333;
          }
          .ticket-footer {
            background: #f9f9f9;
            border-top: 1px solid #eee;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
          .ticket-id {
            font-family: monospace;
            background: #f0f0f0;
            padding: 5px;
            border-radius: 3px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket-header">
            <h1>College Event Management System</h1>
            <p>Official Event Ticket</p>
          </div>
          <div class="ticket-body">
            <div class="ticket-info">
              <h2 class="event-title">${event.title}</h2>
              
              <div class="ticket-detail">
                <span class="label">Attendee:</span>
                <span class="value">${user.name}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Email:</span>
                <span class="value">${user.email}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Date & Time:</span>
                <span class="value">${formatDate(event.startDate)} - ${formatDate(event.endDate)}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Location:</span>
                <span class="value">${event.location}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Category:</span>
                <span class="value">${event.category}</span>
              </div>
              <div class="ticket-detail">
                <span class="label">Ticket Type:</span>
                <span class="value">${event.isPaid ? 'Paid' : 'Free'}</span>
              </div>
              ${event.isPaid ? `
                <div class="ticket-detail">
                  <span class="label">Price:</span>
                  <span class="value">₹${event.price}</span>
                </div>
              ` : ''}
              <div class="ticket-detail">
                <span class="label">Ticket ID:</span>
                <span class="ticket-id">${ticketId}</span>
              </div>
            </div>
            <div class="ticket-qr">
              <img src="${qrCodeData}" alt="QR Code" style="width: 200px; height: 200px;">
              <p>Scan to verify ticket</p>
            </div>
          </div>
          <div class="ticket-footer">
            <p>Present this ticket at the event entrance. This ticket is non-transferable.</p>
            <p>For more information, visit our website or contact the event organizer.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate PDF ticket for an event
 * @param {Object} event - Event details
 * @param {Object} user - User details
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateTicket = async (event, user) => {
  try {
    // Generate a unique ticket ID
    const ticketId = `TCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a verification URL or data for the QR code
    const qrData = JSON.stringify({
      eventId: event._id,
      userId: user._id,
      ticketId: ticketId,
      timestamp: Date.now()
    });
    
    // Generate QR code
    const qrCodeData = await generateQRCode(qrData);
    
    // Generate HTML for the ticket
    const ticketHTML = generateTicketHTML(event, user, qrCodeData, ticketId);
    
    // Convert HTML to PDF
    const pdfBuffer = await htmlPdf.generatePdf(
      { content: ticketHTML }, 
      { 
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
      }
    );
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating ticket:', error);
    throw error;
  }
};

module.exports = {
  generateTicket,
}; 