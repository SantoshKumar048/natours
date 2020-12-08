const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Santosh Kumar <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // For Gmail use "less secure app" option
    });
  }

  // Send Actual email
  async send(template, subject) {
    //1) Render HTML Based on a pug template

    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    console.log(html);
    //2) Define email options

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    //3) Create a transport and send email

    await this.newTransport().sendMail(mailOptions);
  }

  // Send Welcome
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

// const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   // 1) Create a transporter

//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     // For Gmail use "less secure app" option
//   });
//   // 2) Define the email option
//   //   console.log(process.env.EMAIL_HOST);
//   //   console.log(process.env.EMAIL_PORT);
//   //   console.log(process.env.EMAIL_USERNAME);
//   //   console.log(process.env.EMAIL_PASSWORD);

//   const mailOptions = {
//     from: 'Santosh Kumar <admin@webservices.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
