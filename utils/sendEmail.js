const nodeMailer = require("nodemailer");

const sendEmail = async (subject, message, send_to, sent_from, reply_to)=> {

    // Create Email Transporter
    const transporter = nodeMailer.createTransport(
        {
            host: process.env.EMAIL_HOST,
            port: 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls:{ // to mitigate any issues add tls
                rejectUnauthorized: false
            } 
        }
    ); // Transporter carries email from one point to another

    // Options for sending email
    const options = {
        from: sent_from, // Where are you sending the email from
        to: send_to, // Who are you sending the email to
        reply: reply_to,
        subject: subject,
        html: message
    }

    // Send Email
    transporter.sendMail(options, function (err, info){
        if(err){
            console.log(err);
        }
        else{
            console.log(info);
        }
    });
}

module.exports = sendEmail;