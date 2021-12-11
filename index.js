if(process.env.NODE_ENV!=='production'){
    require('dotenv').config();
}

var express = require('express');
var connection = require('./db');

var app=express();
var cors = require('cors')
const port=process.env.PORT || 5000;
app.use(cors())
app.use(express.json())

app.use('/api/auth',require("./routes/auth"))

app.get("/",(req,res)=>{
    res.send("Working correctly")
})

app.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})
