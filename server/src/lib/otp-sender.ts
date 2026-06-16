export async function sendSMSOTP(mobile: string, countryCode: string, otp: string): Promise<void> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;

  if (!twilioSid || !twilioToken || !twilioFrom) {
    // Dev stub: log OTP to console
    console.log(`[OTP SMS] To: ${countryCode}${mobile} | OTP: ${otp}`);
    return;
  }

  // TODO: integrate Twilio
  // const twilio = require('twilio')(twilioSid, twilioToken);
  // await twilio.messages.create({ body: `Your EyeGlaze OTP is: ${otp}`, from: twilioFrom, to: `${countryCode}${mobile}` });
  console.log(`[OTP SMS] To: ${countryCode}${mobile} | OTP: ${otp}`);
}

export async function sendEmailOTP(email: string, otp: string): Promise<void> {
  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (!sendgridKey) {
    // Dev stub: log OTP to console
    console.log(`[OTP EMAIL] To: ${email} | OTP: ${otp}`);
    return;
  }

  // TODO: integrate SendGrid
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(sendgridKey);
  // await sgMail.send({ to: email, from: process.env.SENDGRID_FROM_EMAIL, subject: 'Your EyeGlaze OTP', text: `Your OTP is: ${otp}` });
  console.log(`[OTP EMAIL] To: ${email} | OTP: ${otp}`);
}
