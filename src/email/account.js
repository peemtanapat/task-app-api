const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'pm.tanapat@gmail.com',
    subject: 'Thank you for joining by me',
    text: `Hi ${name}.\nWelcome to the TASK APP.\nYou did it very well\n\nThank You,\nTASK APP`,
  })
}

const sendCancelSurveyEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'pm.tanapat@gmail.com',
    subject: 'TASK APP Cancelation Survey.',
    text: `Hi ${name}.\nYou've just deleted your account, Please tell us why.\nClick link below\n\nThank You,\nTASK APP`,
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelSurveyEmail,
}
