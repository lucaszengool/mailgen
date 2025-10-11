/**
 * SMTP Email Verifier using luzgool001@gmail.com
 * Verifies email addresses by attempting actual SMTP connections
 */

const nodemailer = require('nodemailer');
const net = require('net');
const dns = require('dns').promises;

class SMTPEmailVerifier {
  constructor() {
    // Gmail SMTP configuration for luzgool001@gmail.com
    this.gmailUser = 'luzgool001@gmail.com';
    this.gmailPassword = process.env.GMAIL_VERIFICATION_PASSWORD; // App-specific password
    
    // Create reusable transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.gmailUser,
        pass: this.gmailPassword
      },
      pool: true, // Enable connection pooling
      maxConnections: 5,
      maxMessages: 10,
      rateLimit: 10 // Max 10 emails per second
    });
    
    console.log('📧 SMTP Email Verifier initialized');
    console.log(`   📮 Verification sender: ${this.gmailUser}`);
    console.log(`   🔐 Authentication: ${this.gmailPassword ? 'Configured' : 'Missing GMAIL_APP_PASSWORD'}`);
  }

  /**
   * Pre-filter obviously invalid email addresses
   */
  preFilterInvalidEmails(emailList) {
    const invalidPatterns = [
      /^(support|noreply|donotreply|no-reply|info|contact|sales|hello|admin)\./i, // support.something@
      /^(support|noreply|donotreply|no-reply|info|contact|sales|hello|admin)[a-z0-9]*@/i, // supportsomething@
      /\.(support|noreply|donotreply|no-reply|info|contact|sales|hello|admin)@/i, // something.support@
      /@(noreply|donotreply|no-reply)\./i, // @noreply.
      /@example\.(com|org|net)/i, // test domains
      /@test\.(com|org|net)/i,
      /@localhost/i,
      /@127\.0\.0\.1/i
    ];

    const validEmails = [];
    const filteredOut = [];

    for (const email of emailList) {
      let isInvalid = false;
      
      for (const pattern of invalidPatterns) {
        if (pattern.test(email)) {
          filteredOut.push({
            email,
            reason: `Matches invalid pattern: ${pattern.source}`
          });
          isInvalid = true;
          break;
        }
      }
      
      if (!isInvalid) {
        validEmails.push(email);
      }
    }

    if (filteredOut.length > 0) {
      console.log(`🚫 Pre-filtered ${filteredOut.length} obviously invalid emails:`);
      filteredOut.forEach(item => console.log(`   ❌ ${item.email} - ${item.reason}`));
    }

    return validEmails;
  }

  /**
   * Verify multiple email addresses
   */
  async verifyEmails(emailList) {
    console.log(`🔍 Starting SMTP verification for ${emailList.length} emails...`);
    
    // Pre-filter obviously invalid emails
    const filteredEmails = this.preFilterInvalidEmails(emailList);
    console.log(`📧 After pre-filtering: ${filteredEmails.length}/${emailList.length} emails to verify`);
    
    const results = {
      valid: [],
      invalid: [],
      uncertain: [],
      total: emailList.length,
      verified_count: 0,
      invalid_count: 0,
      uncertain_count: 0
    };
    
    for (const email of filteredEmails) {
      try {
        const verificationResult = await this.verifyEmailAddress(email);
        
        if (verificationResult.status === 'valid') {
          results.valid.push({
            email: email,
            status: 'valid',
            method: verificationResult.method,
            response: verificationResult.response
          });
          results.verified_count++;
        } else if (verificationResult.status === 'invalid') {
          results.invalid.push({
            email: email,
            status: 'invalid',
            reason: verificationResult.reason,
            method: verificationResult.method
          });
          results.invalid_count++;
        } else {
          results.uncertain.push({
            email: email,
            status: 'uncertain',
            reason: verificationResult.reason,
            method: verificationResult.method
          });
          results.uncertain_count++;
        }
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️ Verification failed for ${email}: ${error.message}`);
        results.uncertain.push({
          email: email,
          status: 'uncertain',
          reason: error.message,
          method: 'smtp_error'
        });
        results.uncertain_count++;
      }
    }
    
    console.log(`✅ SMTP verification completed:`);
    console.log(`   ✅ Valid: ${results.verified_count}`);
    console.log(`   ❌ Invalid: ${results.invalid_count}`);
    console.log(`   ❓ Uncertain: ${results.uncertain_count}`);
    
    return results;
  }

  /**
   * Verify a single email address
   */
  async verifyEmailAddress(email) {
    // Step 1: Basic format validation
    if (!this.isValidEmailFormat(email)) {
      return {
        status: 'invalid',
        reason: 'Invalid email format',
        method: 'format_validation'
      };
    }
    
    const domain = email.split('@')[1];
    
    // Step 2: Domain existence check
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return {
          status: 'invalid',
          reason: 'No MX records found',
          method: 'dns_check'
        };
      }
    } catch (dnsError) {
      return {
        status: 'invalid',
        reason: 'Domain does not exist',
        method: 'dns_check'
      };
    }
    
    // Step 3: SMTP verification attempt
    try {
      const smtpResult = await this.performSMTPCheck(email);
      return smtpResult;
    } catch (smtpError) {
      // Step 4: Fallback - Send actual test email (careful with rate limits)
      try {
        const testResult = await this.sendTestEmail(email);
        return testResult;
      } catch (testError) {
        return {
          status: 'uncertain',
          reason: `SMTP check failed: ${smtpError.message}, Test email failed: ${testError.message}`,
          method: 'smtp_and_test_failed'
        };
      }
    }
  }

  /**
   * Basic email format validation
   */
  isValidEmailFormat(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Perform SMTP connection test
   */
  async performSMTPCheck(email) {
    return new Promise((resolve, reject) => {
      const domain = email.split('@')[1];
      
      // Get MX record
      dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses.length) {
          resolve({
            status: 'invalid',
            reason: 'No MX records',
            method: 'smtp_mx_check'
          });
          return;
        }
        
        const mxHost = addresses[0].exchange;
        const socket = net.createConnection(25, mxHost);
        let response = '';
        
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve({
            status: 'uncertain',
            reason: 'SMTP connection timeout',
            method: 'smtp_timeout'
          });
        }, 10000);
        
        socket.on('data', (data) => {
          response += data.toString();
          
          if (response.includes('220')) {
            // Server ready
            socket.write(`HELO ${this.gmailUser.split('@')[1]}\r\n`);
          } else if (response.includes('250') && response.includes('HELO')) {
            // HELO accepted, try MAIL FROM
            socket.write(`MAIL FROM:<${this.gmailUser}>\r\n`);
          } else if (response.includes('250') && response.includes('OK')) {
            // MAIL FROM accepted, try RCPT TO
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else if (response.includes('250') && response.includes('RCPT')) {
            // Email exists!
            clearTimeout(timeout);
            socket.write('QUIT\r\n');
            socket.destroy();
            resolve({
              status: 'valid',
              reason: 'SMTP server accepted recipient',
              method: 'smtp_rcpt_check',
              response: response.trim()
            });
          } else if (response.includes('550') || response.includes('551') || response.includes('553')) {
            // Email does not exist
            clearTimeout(timeout);
            socket.write('QUIT\r\n');
            socket.destroy();
            resolve({
              status: 'invalid',
              reason: 'SMTP server rejected recipient',
              method: 'smtp_rcpt_check'
            });
          }
        });
        
        socket.on('error', (error) => {
          clearTimeout(timeout);
          resolve({
            status: 'uncertain',
            reason: `SMTP connection error: ${error.message}`,
            method: 'smtp_connection_error'
          });
        });
        
        socket.on('close', () => {
          clearTimeout(timeout);
        });
      });
    });
  }

  /**
   * Send a test email (last resort verification)
   * WARNING: Use sparingly to avoid being marked as spam
   */
  async sendTestEmail(email) {
    if (!this.gmailPassword) {
      throw new Error('Gmail app password not configured');
    }
    
    try {
      const testMailOptions = {
        from: this.gmailUser,
        to: email,
        subject: 'Email Verification Test - Please Ignore',
        text: 'This is an automated email verification test. Please ignore this message. If you received this by mistake, we apologize for the inconvenience.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h3>Email Verification Test</h3>
            <p>This is an automated email verification test.</p>
            <p><strong>Please ignore this message.</strong></p>
            <p>If you received this by mistake, we apologize for the inconvenience.</p>
            <hr>
            <small>This email was sent as part of an automated system to verify email addresses.</small>
          </div>
        `
      };
      
      const info = await this.transporter.sendMail(testMailOptions);
      
      return {
        status: 'valid',
        reason: 'Test email sent successfully',
        method: 'test_email_sent',
        messageId: info.messageId
      };
      
    } catch (sendError) {
      if (sendError.code === 'EENVELOPE' || sendError.responseCode === 550) {
        return {
          status: 'invalid',
          reason: 'Email address rejected by server',
          method: 'test_email_rejected'
        };
      }
      
      throw sendError;
    }
  }

  /**
   * Quick validation for a list of emails (format + domain only)
   */
  async quickValidate(emailList) {
    console.log(`⚡ Quick validation for ${emailList.length} emails...`);
    
    const results = {
      valid: [],
      invalid: [],
      total: emailList.length
    };
    
    for (const email of emailList) {
      if (this.isValidEmailFormat(email)) {
        const domain = email.split('@')[1];
        try {
          const mxRecords = await dns.resolveMx(domain);
          if (mxRecords && mxRecords.length > 0) {
            results.valid.push(email);
          } else {
            results.invalid.push(email);
          }
        } catch (error) {
          results.invalid.push(email);
        }
      } else {
        results.invalid.push(email);
      }
    }
    
    console.log(`✅ Quick validation: ${results.valid.length}/${results.total} passed basic checks`);
    return results;
  }

  /**
   * Close the transporter connection
   */
  async close() {
    if (this.transporter) {
      this.transporter.close();
      console.log('📧 SMTP Email Verifier closed');
    }
  }
}

module.exports = SMTPEmailVerifier;