const express= require('express');
const morgan= require('morgan');
const dotenv= require('dotenv');
const sequelize=require('./database/connection');
const { Router } = require('express');

//FIRING THE SERVER
const app = express();

//SORT OUT DATA ENCODING IN THE REQUEST 
app.use(morgan('tiny'));//logger for requests
app.use(express.urlencoded({extended:true}));
app.use(express.json({limit:'3mb'}));

//SETTING UP ALL ENVIRONMENTAL VARIABLES
dotenv.config();
port=process.env.PORT

//SETTING UP THE DTATABASE CONNECTION
sequelize.sync().then(()=>console.log('Db synced successfully')).catch((err)=>console.log(err));

//HANDLING REQUESTS
app.use(Router)

//SERVER SETUP
app.listen(port,()=>{
    console.log(`Server listening from ${port}`);
})

