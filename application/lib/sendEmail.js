async (options) => {
  const nodemailer = await npm['nodemailer'];

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.email.app_user,
      pass: config.email.app_pass,
    },
  });

  const mailOptions = {
    from: 'GATE PASS <zziyadkhanov@gmail.com>',
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};
