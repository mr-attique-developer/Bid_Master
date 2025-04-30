import nodemailer from "nodemailer"




const sendEmail = async(email, subject, text) => {
    const trnasport = nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
    const mailOptions = {
        from: "Bid Master <no-reply@bidmaster.com>",
        to: email,
        subject: subject,
        text: text,
    }

    try {
        await trnasport.sendMail(mailOptions)
        console.log("Email sent successfully")
    } catch (error) {
        console.log("Error sending email", error)
    }
}



export default sendEmail


