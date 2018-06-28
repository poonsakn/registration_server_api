let nodemailer = require('nodemailer');
const uuid = require('uuid/v4');

console.log(uuid().length)
// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'psk.reg.api@gmail.com',
//         pass: 'n7l0cxlqhb5q34qptlge7oiwqyv59n3jt5ka'
//     }
// });
//
// let mailOptions = {
//     from: 'psk.reg.api@gmail.com',
//     to: 'psk.reg.api@gmail.com',
//     subject: 'Sending Email using Node.js',
//     text: 'That was easy!'
// };
//
// transporter.sendMail(mailOptions, function(error, info){
//     if (error) {
//         console.log(error);
//     } else {
//         console.log('Email sent: ' + info.response);
//     }
// });
