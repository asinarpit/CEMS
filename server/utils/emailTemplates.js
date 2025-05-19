/**
 * Email template for event registration confirmation
 * @param {Object} data - Data for email template
 * @returns {string} - HTML email template
 */
const registrationConfirmationTemplate = (data) => {
  const { event, user } = data;
  
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
        <title>Event Registration Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4a90e2;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            background-color: #4a90e2;
            color: #ffffff !important;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .details {
            background-color: #ffffff;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .details-item {
            margin-bottom: 10px;
          }
          .details-label {
            font-weight: bold;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Registration Confirmation</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>Thank you for registering for ${event.title}. Your registration has been confirmed!</p>
            <p>We're excited to have you join us. Please find your ticket attached to this email, which you should present at the event entrance.</p>
            
            <div class="details">
              <h3>Event Details:</h3>
              <div class="details-item">
                <span class="details-label">Event:</span> ${event.title}
              </div>
              <div class="details-item">
                <span class="details-label">Date & Time:</span> ${formatDate(event.startDate)} - ${formatDate(event.endDate)}
              </div>
              <div class="details-item">
                <span class="details-label">Location:</span> ${event.location}
              </div>
              <div class="details-item">
                <span class="details-label">Category:</span> ${event.category}
              </div>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>College Event Management System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} College Event Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Email template for payment confirmation
 * @param {Object} data - Data for email template
 * @returns {string} - HTML email template
 */
const paymentConfirmationTemplate = (data) => {
  const { event, user, payment } = data;
  
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
        <title>Payment Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2ecc71;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
          .details {
            background-color: #ffffff;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .details-item {
            margin-bottom: 10px;
          }
          .details-label {
            font-weight: bold;
            color: #555;
          }
          .payment-details {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmation</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>We're pleased to confirm that your payment for ${event.title} has been successfully processed.</p>
            <p>Your registration is now confirmed. Please find your ticket attached to this email, which you should present at the event entrance.</p>
            
            <div class="details">
              <h3>Event Details:</h3>
              <div class="details-item">
                <span class="details-label">Event:</span> ${event.title}
              </div>
              <div class="details-item">
                <span class="details-label">Date & Time:</span> ${formatDate(event.startDate)} - ${formatDate(event.endDate)}
              </div>
              <div class="details-item">
                <span class="details-label">Location:</span> ${event.location}
              </div>
              
              <div class="payment-details">
                <h3>Payment Information:</h3>
                <div class="details-item">
                  <span class="details-label">Transaction ID:</span> ${payment.transactionId || 'N/A'}
                </div>
                <div class="details-item">
                  <span class="details-label">Amount Paid:</span> ₹${event.price}
                </div>
                <div class="details-item">
                  <span class="details-label">Payment Date:</span> ${formatDate(payment.date || new Date())}
                </div>
              </div>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>College Event Management System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} College Event Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = {
  registrationConfirmationTemplate,
  paymentConfirmationTemplate
}; 