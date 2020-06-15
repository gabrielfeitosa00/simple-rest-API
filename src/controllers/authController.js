const express = require ('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig= require('../config/auth.json');
const router = express.Router();

// function that generate tokens

function generateToken (params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400
    });
}


// route that is used for creating users

router.post('/register', async (req,res) => {

    const {email}= req.body;

    try {

        if (await User.findOne({email}))
            return res.status(400).send({error: 'This user already exits'});

        const user = await User.create(req.body);

        user.password= undefined;

        return res.send({
            user,
            token: generateToken({id: user.id})
        });

    }

    catch(err){

        return res.status(400).send({error: 'Registradion Failed'});

    }
});

// route that is used for authentication

router.post ('/authenticate', async(req,res) => {

    const {email,password}= req.body;

    const user= await User.findOne({email}).select('+password');

    // user validation

    if (!user)
        return res.status(400).send({error: 'User not found'});


    // password validation

    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({error: 'Invalid Password'});

    user.password=undefined;

    

    res.send({
        user,
        token: generateToken({id: user.id}) });

})


module.exports= app => app.use('/auth',router);