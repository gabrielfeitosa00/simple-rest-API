const express= require('express');

const bodyParser = require ('body-parser');

// creating the aplication core 

const app=express();



// allow the aplication to use json requisitions
app.use(bodyParser.json());

// allow the aplication to recive url params

app.use(bodyParser.urlencoded({extended:false}));

require('./app/controllers/index')(app);

app.listen(3000);


