const express = require ('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mailer = require('../../modules/mailer')
const jwt = require('jsonwebtoken');
const authConfig= require('../../config/auth.json');
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

        return res.status(400).send({error: 'Registration Failed'});

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

});

// route for password recovery

router.post('/forgot_password', async(req,res) => {

    const {email}=req.body;

    try{

        const user = await User.findOne({email});

        if (!user)
            return res.status(400).send({error: 'User not found'});

        const token = crypto.randomBytes(20).toString('hex'); // generating an access token

        const now = new Date();

        now.setHours(now.getHours()+1); // generating the time to use the access token

        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        });

        mailer.sendMail({
            to: email,
            from: 'gabrielfeitosa@alunos.utfpr.edu.br',
            template:'auth/forgot_password',
            context: {token},
        }, (err) => {
            if(err)
                return res.status(400).send({error: 'Cannot send forgot password email' });

            return res.send();
        })
    }

    catch(err) {
        
        res.status(400).send({error: 'Error on forgot password,try again'});
    }

});

// route for reseting  the password

router.post('/reset_password', async(req,res)=> {

    const {email,token,password}=req.body;

    try {

        const user = await User.findOne({email})
        .select('+passwordResetToken passwordResetExpires');

        if (!user)
            return res.status(400).send({error: 'User not found'});

        if(token!== user.passwordResetToken)
            return res.status(400).send({error:'Token Invalid'});

        const now = new Date();

        if (now>user.passwordResetExpires)
            return res.status(400).send({error:'Token expired, generate a new one'});

        user.password=password;

        await user.save();

        res.send();
        
    } 
    
    catch (err) {
        
        res.status(400).send({error: 'Cannot reset password, try again'});
    }

});

module.exports= app => app.use('/auth',router);