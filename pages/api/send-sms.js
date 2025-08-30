// pages/api/send-sms.js
const twilio = require('twilio');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  try {
    console.log('📱 SMS API called with request body:', req.body);
    
    const { to, message } = req.body;

    // Validate input
    if (!to || !message) {
      console.error('❌ Missing required fields:', { to: !!to, message: !!message });
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Phone number and message are required' 
      });
    }

    // Check Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log('🔧 Twilio config check:', {
      accountSid: accountSid ? `***${accountSid.slice(-4)}` : 'MISSING',
      authToken: authToken ? '***PRESENT' : 'MISSING',
      fromNumber: fromNumber || 'MISSING'
    });

    if (!accountSid || !authToken || !fromNumber) {
      console.error('❌ Missing Twilio environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'SMS service is not properly configured. Please check environment variables.' 
      });
    }

    // Improved phone number formatting for Indian numbers
    const formatPhoneNumber = (phoneNumber) => {
      console.log('📞 Formatting phone number:', phoneNumber);
      
      // Convert to string and remove all non-digit characters
      let cleanNumber = phoneNumber.toString().replace(/\D/g, '');
      console.log('🧹 Clean number:', cleanNumber);
      
      // Handle different Indian number formats
      if (cleanNumber.length === 10) {
        // 10-digit number, add +91
        cleanNumber = '+91' + cleanNumber;
      } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
        // 12-digit with country code, add +
        cleanNumber = '+' + cleanNumber;
      } else if (cleanNumber.length === 13 && cleanNumber.startsWith('91')) {
        // 13-digit with country code but no +
        cleanNumber = '+' + cleanNumber;
      } else if (cleanNumber.startsWith('91') && cleanNumber.length > 10) {
        // Has 91 prefix
        cleanNumber = '+' + cleanNumber;
      } else if (!cleanNumber.startsWith('+')) {
        // No country code detected, assume Indian number
        if (cleanNumber.length === 10) {
          cleanNumber = '+91' + cleanNumber;
        } else {
          cleanNumber = '+' + cleanNumber;
        }
      }
      
      console.log('✅ Formatted number:', cleanNumber);
      return cleanNumber;
    };

    const formattedNumber = formatPhoneNumber(to);

    // Validate Indian mobile number format
    const indianMobileRegex = /^\+91[6-9]\d{9}$/;
    if (!indianMobileRegex.test(formattedNumber)) {
      console.error('❌ Invalid Indian mobile number format:', formattedNumber);
      return res.status(400).json({ 
        error: 'Invalid phone number',
        message: `Invalid Indian mobile number format. Expected format: +91XXXXXXXXXX (got: ${formattedNumber})` 
      });
    }

    // Initialize Twilio client with error handling
    console.log('🔧 Initializing Twilio client...');
    let client;
    try {
      client = twilio(accountSid, authToken);
    } catch (initError) {
      console.error('❌ Failed to initialize Twilio client:', initError);
      return res.status(500).json({
        error: 'SMS service initialization failed',
        message: 'Unable to connect to SMS service'
      });
    }

    // Send SMS with timeout
    console.log(`📤 Sending SMS from ${fromNumber} to ${formattedNumber}`);
    
    const messagePromise = client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedNumber,
      // Optional: Add delivery tracking
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || undefined,
    });

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SMS request timeout')), 30000);
    });

    const messageResult = await Promise.race([messagePromise, timeoutPromise]);

    console.log(`✅ SMS sent successfully:`, {
      sid: messageResult.sid,
      status: messageResult.status,
      to: messageResult.to,
      from: messageResult.from
    });

    return res.status(200).json({ 
      success: true, 
      messageSid: messageResult.sid,
      to: formattedNumber,
      status: messageResult.status,
      message: 'SMS sent successfully'
    });

  } catch (error) {
    console.error('❌ Twilio SMS Error Details:', {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo,
      stack: error.stack
    });
    
    // Enhanced error handling with specific Twilio error codes
    let errorResponse = {
      error: 'SMS sending failed',
      message: 'Failed to send SMS. Please try again.',
      code: error.code || 'UNKNOWN_ERROR',
      details: error.message
    };

    // Handle specific Twilio error codes
    switch (error.code) {
      case 21614:
        errorResponse = {
          error: 'Invalid phone number',
          message: 'The phone number format is invalid or not reachable.',
          code: error.code
        };
        break;
      case 21408:
        errorResponse = {
          error: 'Unverified number',
          message: 'This number is not verified in Twilio trial account. Please verify it first.',
          code: error.code
        };
        break;
      case 20003:
        errorResponse = {
          error: 'Authentication failed',
          message: 'Twilio credentials are invalid. Check Account SID and Auth Token.',
          code: error.code
        };
        break;
      case 21610:
        errorResponse = {
          error: 'Unsubscribed number',
          message: 'This number has opted out of receiving SMS messages.',
          code: error.code
        };
        break;
      case 30006:
        errorResponse = {
          error: 'Landline number',
          message: 'Cannot send SMS to landline numbers. Use a mobile number.',
          code: error.code
        };
        break;
      case 21211:
        errorResponse = {
          error: 'Invalid mobile number',
          message: 'The number is not a valid mobile number.',
          code: error.code
        };
        break;
      case 21612:
        errorResponse = {
          error: 'Number not SMS capable',
          message: 'This number cannot receive SMS messages.',
          code: error.code
        };
        break;
      case 30007:
        errorResponse = {
          error: 'Message filtered',
          message: 'Message was filtered by carrier or recipient.',
          code: error.code
        };
        break;
      default:
        if (error.message && error.message.includes('timeout')) {
          errorResponse = {
            error: 'Request timeout',
            message: 'SMS request timed out. Please try again.',
            code: 'TIMEOUT'
          };
        } else if (error.status >= 500) {
          errorResponse = {
            error: 'Service unavailable',
            message: 'Twilio service is temporarily unavailable.',
            code: error.code
          };
        } else if (error.status === 429) {
          errorResponse = {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please wait before trying again.',
            code: error.code
          };
        }
        break;
    }

    return res.status(error.status || 500).json(errorResponse);
  }
}

// Configuration for request handling
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
}