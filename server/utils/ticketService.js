const { generateTicket } = require('./ticketGenerator');
const { sendEmail } = require('./emailService');
const { registrationConfirmationTemplate, paymentConfirmationTemplate } = require('./emailTemplates');

/**
 * Send event registration confirmation email with attached ticket
 * @param {Object} event - Event details
 * @param {Object} user - User details
 * @param {boolean} isPaid - Whether it's a paid registration
 * @param {Object} paymentDetails - Payment details if paid
 * @returns {Promise<Object>} - Result of sending email
 */
const sendEventTicket = async (event, user, isPaid = false, paymentDetails = null) => {
  try {
    console.log(`Generating ticket for user ${user.name} for event ${event.title}`);
    
    // Generate the ticket as PDF
    const ticketBuffer = await generateTicket(event, user);
    
    // Create email content based on whether it's paid or free
    const emailTemplate = isPaid
      ? paymentConfirmationTemplate({ event, user, payment: paymentDetails })
      : registrationConfirmationTemplate({ event, user });
    
    // Construct filename for the attachment
    const eventSlug = event.title.toLowerCase().replace(/\s+/g, '-');
    const filename = `${eventSlug}-ticket-${Date.now()}.pdf`;
    
    // Send email with ticket attached
    const emailResult = await sendEmail({
      to: user.email,
      subject: isPaid ? 'Payment Confirmation & Ticket - ' + event.title : 'Event Registration Confirmation - ' + event.title,
      html: emailTemplate,
      attachments: [
        {
          filename,
          content: ticketBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    
    if (emailResult.success) {
      console.log(`Ticket email sent successfully to ${user.email}`);
      return { success: true, messageId: emailResult.messageId };
    } else {
      console.error(`Failed to send ticket email to ${user.email}:`, emailResult.error);
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    console.error('Error in sendEventTicket:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEventTicket
}; 