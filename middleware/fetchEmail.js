if(process.env.NODE_ENV!='production'){
    require('dotenv').config();
}
const jwt=require('jsonwebtoken')

const JWT_SECRET=process.env.SECRET;


const fetchemail=async (req,res,next)=>{
    // get the user from the jwt token and add id to req object
    const token=req.params.id
    try{
        const data=jwt.verify(token,JWT_SECRET)
        // console.log(data)
        req.email=data.email.email;
        next()
    }
    catch(error){
        res.status(401).send({error:"Not a valid link"})
    }
}

module.exports=fetchemail