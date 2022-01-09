const express=require('express')
const router=express.Router()

const {body,validationResult}=require('express-validator')
const bcrypt=require('bcryptjs')

const jwt=require('jsonwebtoken')
const JWT_SECRET=process.env.SECRET

const fetchuser=require("../middleware/fetchUser")
/*
const connection = require('../db')
const util = require('util');
const query = util.promisify(connection.query).bind(connection);

use above to make connection without pool and change all pool.query with pool
*/
const pool = require("../pool")


// Route 1 to create a new user
router.post("/createuser",[
    body('fName','Enter a valid first name').isLength({min:3}),
    body('userName','Enter a valid username').isLength({min:3}),
    body('lName','Enter a valid last name').isLength({min:3}),
    body('email','Enter a valid email').isEmail(),
    body('password','Password must be atleast 5 character').isLength({min:5}),//this all are express validators
    ],async (req,res)=>{
        
        let success=false;
        const errors=validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({success,errors})
        }

        try{
            let rows=await pool.query(`Select * from Users where email="${req.body.email}"`);
            if(rows.length){
                return res.status(400).json({success,error:"Sorry a user with this email already registered with our site"})
            }
            
            
            const salt=await bcrypt.genSalt(10);
            const secPass= await bcrypt.hash(req.body.password,salt)
            // console.log(`Insert into Users(userName,fName,lName,email,password,dateOfAccountCreated) VALUES ("${req.body.userName}","${req.body.fName}","${req.body.lName}","${req.body.email}","${secPass}","${new Date().toISOString().split('T')[0]}")`)
            rows=await pool.query(`Insert into Users(userName,fName,lName,email,password,dateOfAccountCreated)
                VALUES("${req.body.userName}","${req.body.fName}","${req.body.lName}","${req.body.email}","${secPass}","${new Date().toISOString().split('T')[0]}")`)
            
            const data={
                user:{
                    id:rows.insertId
                }
            }

            const authtoken=jwt.sign(data,JWT_SECRET);
            success=true
            res.json({success,authtoken})

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
            const data={
                user:{
                    id:user.id
                }
            }

            const authtoken=jwt.sign(data,JWT_SECRET)
            success=true
            res.json({success,authtoken})


        }catch(error){
            // console.error(error.message);
            res.status(500).send("Inter Server error occured");
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
        throw res.status(500).send("Inter Server error occured");
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
        throw res.status(500).send("Inter Server error occured");
    }

})

module.exports=router