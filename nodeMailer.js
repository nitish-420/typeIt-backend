if(process.env.NODE_ENV!='production'){
    require('dotenv').config();
}
const nodemailer=require('nodemailer')

const transporter=nodemailer.createTransport({
    service:"hotmail",
    auth:{
        user:process.env.EMAILUSERNAME,
        pass:process.env.EMAILPASSWORD
    }
});

// const options={
//     from:process.env.EMAILUSERNAME,
//     to:"teamtypeit@gmail.com",
//     subject:"Sending email with node to test",
//     text:"this is text "
// };

// transporter.sendMail(options,function(err,info){
//     if(err){
//         console.log(err);
//         return;
//     }
//     console.log("Sent : "+info.response);
// })
module.exports=transporter
