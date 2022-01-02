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

router.post("/getbest",fetchuser,[
    body('time','Not a valid time option').isLength({max:3}),
    ],async (req,res)=>{
        let success=false;
        const errors=validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({success,errors})
        }
        const language=req.body.language;
        try{
            let result=await query(`
            (SELECT a.testTime,a.timeOfTest,a.speed,a.accuracy from ${language}Table a WHERE a.testTime=15 and a.userId=${req.user.id} ORDER BY a.speed DESC LIMIT 1)
            UNION
            (SELECT a.testTime,a.timeOfTest,a.speed,a.accuracy from ${language}Table a WHERE a.testTime=30 and a.userId=${req.user.id} ORDER BY a.speed DESC LIMIT 1)
            UNION
            (SELECT a.testTime,a.timeOfTest,a.speed,a.accuracy from ${language}Table a WHERE a.testTime=60 and a.userId=${req.user.id} ORDER BY a.speed DESC LIMIT 1)
            UNION
            (SELECT a.testTime,a.timeOfTest,a.speed,a.accuracy from ${language}Table a WHERE a.testTime=120 and a.userId=${req.user.id} ORDER BY a.speed DESC LIMIT 1)
            `)
            // console.log(result);
            let final={
                time15:null,
                time30:null,
                time60:null,
                time120:null
            }

            result.map((item,idx)=>{
                if(item.testTime===15){
                    final.time15=item
                }
                else if(item.testTime===30){
                    final.time30=item
                }
                else if(item.testTime===60){
                    final.time60=item
                }
                else if(item.testTime===120){
                    final.time120=item
                }
            })
            success=true;
            // setTimeout(()=>{
            //     res.json({success,final})
            // },5000)
            res.json({success,final})

        }
        catch(error){
            // console.error(error.message);
            res.status(500).send("Some error occured");
        }
    }

)

router.post("/getuserall",fetchuser,async (req,res)=>{
        let success=false;
        try{
            let result=await query(`
            SELECT testTime,timeOfTest,speed,accuracy,language FROM (
            (SELECT * from EnglishTable a WHERE a.userId=${req.user.id} )
            UNION
            (SELECT * from PythonTable a WHERE a.userId=${req.user.id} )
            UNION
            (SELECT * from CTable a WHERE a.userId=${req.user.id} )
            UNION
            (SELECT * from JavaTable a WHERE a.userId=${req.user.id} )
            UNION
            (SELECT * from JavascriptTable a WHERE a.userId=${req.user.id} )
            ) as b ORDER BY b.timeOfTest DESC
            `)

            success=true;

            //below comented part is just to see how loaders are working when this happens
            // setTimeout(()=>{
            //     res.json({success,result})

            // },5000)
            res.json({success,result})

        }
        catch(error){
            // console.error(error.message);
            res.status(500).send("Some error occured");
        }
    }

)


router.post("/getall",async (req,res)=>{
        let success=false;
        try{
            const language=req.body.language;

            var final={
                time15:null,
                time30:null,
                time60:null,
                time120:null
            }

            final.time15=await query(`
            (SELECT id,userName,speed,accuracy,timeOfTest FROM ( SELECT b.id, b.userName, a.speed, a.accuracy,a.timeOfTest, ROW_NUMBER() OVER(PARTITION BY a.userId ORDER BY a.speed desc,a.accuracy desc)row_num FROM ${language}Table a INNER JOIN Users b on a.userId=b.id and a.testTime=15 ) sub WHERE row_num = 1 ORDER BY speed DESC )
            `)
            final.time30=await query(`
            (SELECT id,userName,speed,accuracy,timeOfTest FROM ( SELECT b.id, b.userName, a.speed, a.accuracy,a.timeOfTest, ROW_NUMBER() OVER(PARTITION BY a.userId ORDER BY a.speed desc,a.accuracy desc)row_num FROM ${language}Table a INNER JOIN Users b on a.userId=b.id and a.testTime=30 ) sub WHERE row_num = 1 ORDER BY speed DESC )
            `)
            final.time60=await query(`
            (SELECT id,userName,speed,accuracy,timeOfTest FROM ( SELECT b.id, b.userName, a.speed, a.accuracy,a.timeOfTest, ROW_NUMBER() OVER(PARTITION BY a.userId ORDER BY a.speed desc,a.accuracy desc)row_num FROM ${language}Table a INNER JOIN Users b on a.userId=b.id and a.testTime=60 ) sub WHERE row_num = 1 ORDER BY speed DESC )
            `)
            final.time120=await query(`
            (SELECT id,userName,speed,accuracy,timeOfTest FROM ( SELECT b.id, b.userName, a.speed, a.accuracy,a.timeOfTest, ROW_NUMBER() OVER(PARTITION BY a.userId ORDER BY a.speed desc,a.accuracy desc)row_num FROM ${language}Table a INNER JOIN Users b on a.userId=b.id and a.testTime=120 ) sub WHERE row_num = 1 ORDER BY speed DESC )
            `)

            success=true;

            //below comented part is just to see how loaders are working when this happens
            // setTimeout(()=>{
            //     res.json({success,final})

            // },5000)
            res.json({success,final})

        }
        catch(error){
            // console.error(error.message);
            res.status(500).send("Some error occured");
        }
    }

)


/*

(SELECT * from EnglishTable a WHERE a.testTime=15 and a.userId=7 ORDER BY a.speed DESC LIMIT 1)
UNION
(SELECT * from EnglishTable a WHERE a.testTime=30 and a.userId=7 ORDER BY a.speed DESC LIMIT 1)
UNION
(SELECT * from EnglishTable a WHERE a.testTime=60 and a.userId=7 ORDER BY a.speed DESC LIMIT 1)
UNION
(SELECT * from EnglishTable a WHERE a.testTime=120 and a.userId=7 ORDER BY a.speed DESC LIMIT 1)

SELECT userName,speed,accuracy,timeOfTest FROM ( SELECT b.userName, a.speed, a.accuracy,a.timeOfTest, ROW_NUMBER() OVER(PARTITION BY a.userId ORDER BY a.speed desc,a.accuracy desc)row_num FROM EnglishTable a INNER JOIN Users b on a.userId=b.id and a.testTime=15 ) sub WHERE row_num = 1 ORDER BY speed DESC LIMIT 50

*/

module.exports=router

