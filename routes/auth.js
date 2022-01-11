const express=require('express')
const router=express.Router()

const {body,validationResult}=require('express-validator')
const bcrypt=require('bcryptjs')

const jwt=require('jsonwebtoken')
const JWT_SECRET=process.env.SECRET

const fetchuser=require("../middleware/fetchUser")
const fetchemail = require('../middleware/fetchEmail')

const transporter=require("../nodeMailer")

/*
const connection = require('../db')
const util = require('util');
const query = util.promisify(connection.query).bind(connection);

use above to make connection without pool and change all pool.query with pool
*/
const pool = require("../pool")

const sendEmailForVerification=async(email)=>{

    const salt=await bcrypt.genSalt(10);

    let emailHash=await bcrypt.hash(email,salt)

    const emailData={
        email:{
            email:email
        }
    }
    emailHash=jwt.sign(emailData,JWT_SECRET);

    const options={
        from:process.env.EMAILUSERNAME,
        to:email,
        subject:"To verify click on the link below",
        text:`https://type-it-backend.herokuapp.com/api/auth/verifyemail/${emailHash}`
    };

    transporter.sendMail(options,function(err,info){
        if(err){
            // console.log(err);
            return;
        }
        // console.log("Sent : "+info.response);
    })
    return;
}

// Route 1 to create a new user
router.post("/createuser",[
    body('fName','Name should have atleast length 3 and atmost length 20').isLength({min:3,max:20}),
    body('userName','Username should have atleast length 3 and atmost length 15').isLength({min:3,max:15}),

    body('email','Enter a valid email').isEmail(),
    body('password','Password must be atleast 5 character').isLength({min:5,max:20}),//this all are express validators
    ],async (req,res)=>{
        
        let success=false;
        const errors=validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({success,errors})
        }

        try{
            let rows=await pool.query(`Select * from Users where email="${req.body.email}"`);
            if(rows.length && rows[0].status!==0){
                return res.status(400).json({success,error:"Sorry a user with this email already registered with our site"})
            }
            else if(rows.length && rows[0].status===0){
                // here deleting user for fake account
                let row=await pool.query(`DELETE FROM Users where email="${req.body.email}"`)
            }
            
            const salt=await bcrypt.genSalt(10);
            const secPass= await bcrypt.hash(req.body.password,salt)
            // console.log(`Insert into Users(userName,fName,lName,email,password,dateOfAccountCreated) VALUES ("${req.body.userName}","${req.body.fName}","${req.body.lName}","${req.body.email}","${secPass}","${new Date().toISOString().split('T')[0]}")`)
            rows=await pool.query(`Insert into Users(userName,fName,lName,email,password,dateOfAccountCreated)
                VALUES("${req.body.userName}","${req.body.fName}","${req.body.lName}","${req.body.email}","${secPass}","${new Date().toISOString().split('T')[0]}")`)
            
            // changing things to make it work according to email verification

            // const data={
            //     user:{
            //         id:rows.insertId
            //     }
            // }

            // const authtoken=jwt.sign(data,JWT_SECRET);
            
            sendEmailForVerification(req.body.email);
            success=true
            res.json({success})
        }
        catch(error){
            // console.error(error.message);
            res.status(500).send("Some error occured");
        }
})


// Route 2 for login of a user 
router.post("/login",[
    body('email','Enter a valid email').isEmail(),
    body('password','Password cannot be blank').exists()],
    async (req,res)=>{
        let success=false;
        const errors=validationResult(req);
        if(! errors.isEmpty()){
            return res.status(400).json({success,errors:errors.array()})
        }
        const {email,password}=req.body;
        try{
            let rows=await pool.query(`Select * from Users where email="${req.body.email}"`);
            if(!rows.length){
                return res.status(400).json({success,error:"Please try to login with correct credentials"})
            }
            const user=rows[0]
            const passwordCompare=await bcrypt.compare(password,user.password);
            if(!passwordCompare){
                return res.status(400).json({success,error:"Please try to login with correct credentials"})
            }

            if(user.status===0){
                sendEmailForVerification(email);
                return res.status(400).json({success,error:"Please verify your account first and then login, email has been set again, check you spam box also in case you don't find it"})
            }

            const data={
                user:{
                    id:user.id
                }
            }

            const authtoken=jwt.sign(data,JWT_SECRET)
            success=true
            // console.log(user)
            res.json({success,authtoken,user})


        }catch(error){
            // console.error(error.message);
            res.status(500).send("Internal Server error occured");
        }

    }
)

// Route 3 for logged in user details using post req /getuser
router.post('/getuser',fetchuser,async (req,res)=>{
    let success=false
    try{
        let userId=req.user.id;
        let rows=await pool.query(`Select * from Users where id="${userId}"`)

        let user= rows[0]
        success=true
        res.send({success,user})
    }catch(error){
        // console.error(error.message);
        res.status(500).send("Inter Server error occured");
    }

})

// Route 4 for logged in user update using post req /updateuser
router.post('/updateuser',fetchuser,async (req,res)=>{
    let success=false
    try{
        let userId=req.user.id;
        let {numberOfTestsGiven,totalTimeSpend,bestSpeed,averageSpeed,bestAccuracy,averageAccuracy}=req.body
        let row=await pool.query(`Update Users SET numberOfTestsGiven="${numberOfTestsGiven}", totalTimeSpend="${totalTimeSpend}", bestSpeed="${bestSpeed}", bestAccuracy="${bestAccuracy}", averageSpeed="${averageSpeed}", averageAccuracy="${averageAccuracy}" where id="${userId}"`)
        success=true
        res.send({success})
    }catch(error){
        // console.error(error.message);
        res.status(500).send("Inter Server error occured");
    }
    
})

// Route 5 for logged in user update of name username all that 
router.post('/updateusernames',fetchuser,[
    body('fName','Name should have atleast length 3 and atmost length 20').isLength({min:3,max:20}),
    body('userName','Username should have atleast length 3 and atmost length 15').isLength({min:3,max:15}),
    body('password','Password must be atleast 5 character').isLength({min:5,max:20}),//this all are express validators
    ],async (req,res)=>{
        
        let success=false
        const errors=validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({success,errors})
        }
        try{
            let userId=req.user.id;
            let {userName,fName,lName}=req.body
            let row=await pool.query(`Update Users SET userName="${userName}", fName="${fName}", lName="${lName}" where id="${userId}"`)
            success=true
            res.send({success})
        }catch(error){
            // console.error(error.message);
            res.status(500).send("Inter Server error occured");
        }
})

// Route 6 for logged in user update password
router.post('/updatepassword',fetchuser,[
    body('currPassword','Password must be atleast 5 character').isLength({min:5,max:20}),//this all are express validators
    body('updatedPassword','Password must be atleast 5 character').isLength({min:5,max:20}),//this all are express validators

    ],async (req,res)=>{
        let success=false

        const errors=validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({success,errors})
        }

        try{
            let userId=req.user.id;
            let {currPassword,updatedPassword}=req.body
            let rows=await pool.query(`Select * from Users where id="${userId}"`);
            if(!rows.length){
                return res.status(400).json({success,error:"Something went wrong"})
            }
            const user=rows[0]
            const passwordCompare=await bcrypt.compare(currPassword,user.password);
            if(!passwordCompare){
                return res.status(400).json({success,error:"Something went wrong"})
            }
            
            const salt=await bcrypt.genSalt(10);
            const secPass= await bcrypt.hash(updatedPassword,salt)

            let row=await pool.query(`Update Users SET password="${secPass}" where id="${userId}"`)

            success=true
            res.send({success})
        }catch(error){
            // console.error(error.message);
            res.status(500).send("Inter Server error occured");
        }
})

router.get("/verifyemail/:id",fetchemail,async(req,res)=>{
    
    try{
        const {email}=req
        let row=await pool.query(`Update Users SET status=1 where email="${email}"`)
        success=true
        res.redirect("https://type--it.herokuapp.com/login")
    }
    catch(error){
        // console.error(error.message);
        res.send("Some error occured please try after some time");
    }

    // res.send(req.email)
})

router.get("/deleteuser",fetchuser,async(req,res)=>{
    try{
        let userId=req.user.id;
        let success=false;
        let row = await pool.query(
            `DELETE FROM EnglishTable WHERE userId=${userId};
            DELETE FROM CTable WHERE userId=${userId};
            DELETE FROM PythonTable WHERE userId=${userId};
            DELETE FROM JavaTable WHERE userId=${userId};
            DELETE FROM JavascriptTable WHERE userId=${userId};
            DELETE FROM Users WHERE id=${userId}
            `
        )
        success=true;
        res.send({success})
    }
    catch(e){
        res.status(500).send("Internal Server error occured");
    }
})

module.exports=router