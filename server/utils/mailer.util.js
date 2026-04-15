import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const generateEmailTemplate = (title, message, code, warningText) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaep; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
    
    <div style="background-color: #4F46E5; padding: 25px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">ConnectApp</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; margin-top: 0; font-size: 22px;">${title}</h2>
      <p style="font-size: 16px; color: #555555; line-height: 1.6;">${message}</p>
      
      <div style="margin: 35px 0; padding: 20px; background-color: #F5F7FF; border: 2px dashed #4F46E5; border-radius: 8px; text-align: center;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #4F46E5;">${code}</span>
      </div>
      
      <p style="font-size: 15px; color: #666666; margin-bottom: 8px;">
        Mã này sẽ hết hạn sau <strong style="color: #E11D48;">10 phút</strong>.
      </p>
      <p style="font-size: 14px; color: #999999; margin-top: 0;">${warningText}</p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="margin: 0; font-size: 13px; color: #a0aec0;">
        © ${new Date().getFullYear()} ConnectApp. All rights reserved.
      </p>
    </div>
    
  </div>
`;

const sendVerificationEmail = async (toEmail, code) => {
  const htmlContent = generateEmailTemplate(
    "Chào mừng bạn đến với ConnectApp! 🎉",
    "Cảm ơn bạn đã tham gia cùng chúng tôi. Để hoàn tất việc đăng ký, vui lòng sử dụng mã xác thực bên dưới:",
    code,
    "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này."
  );

  const mailOptions = {
    from: `"ConnectApp" <${process.env.EMAIL_USERNAME}>`,
    to: toEmail,
    subject: "Xác thực tài khoản ConnectApp ✔",
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
};

const sendForgotPasswordEmail = async (toEmail, code) => {
  const htmlContent = generateEmailTemplate(
    "Yêu cầu đặt lại mật khẩu! 🔒",
    "Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Dưới đây là mã xác thực của bạn:",
    code,
    "Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này để bảo đảm an toàn cho tài khoản."
  );

  const mailOptions = {
    from: `"ConnectApp" <${process.env.EMAIL_USERNAME}>`,
    to: toEmail,
    subject: "Lấy lại mật khẩu ConnectApp",
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
};

export { sendVerificationEmail, sendForgotPasswordEmail };