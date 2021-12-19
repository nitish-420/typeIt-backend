const express=require('express')
const router=express.Router()

const {body,validationResult}=require('express-validator')

const fetchuser=require("../middleware/fetchUser")
const connection = require('../db')
const util = require('util');
const query = util.promisify(connection.query).bind(connection);


router.post("/createtest",fetchuser,[
    body('time','Not a valid time option').isLength({max:3}),
    ],async (req,res)=>{
        let success=false;
        const errors=validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({success,errors})
        }
        const language=req.body.language;
        try{
            let result=await query(`INSERT INTO ${language}Table(userId,testTime,speed,accuracy) VALUES(${req.user.id},${req.body.testTime},${req.body.speed},${req.body.accuracy})`)
            // console.log(result);
            success=true;
            res.json({success})

        }
        catch(error){
            // console.error(error.message);
            res.status(500).send("Some error occured");
        }
    }

)

module.exports=router