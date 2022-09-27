var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
var User = require('../models/User');
var Token = require('../models/Token');
//GET new regitration form
router.get('/new', (req, res, next) => {
  const error = req.flash('error');
  res.render('register', { error });
});

//  registration
router.post('/', (req, res, next) => {
  var { email, password } = req.body;
  User.create(req.body, (error, user) => {
    if (error) {
      if (error.name === 'MongoError') {
        req.flash('error', 'Admin already exsits!');
        return res.redirect('/users/new');
      }
      if (error.name === 'ValidationError') {
        req.flash('error', error.message);
        return res.redirect('/users/new');
      }
    }
    // generate token and save
    var token = {
      _userId: user.id,
      token: crypto.randomBytes(16).toString('hex'),
    };
    Token.create(token, (error, singleToken) => {
      if (error) return next(error);
      // Send email (use verified sender's email address & generated API_KEY on SendGrid)
      const transporter = nodemailer.createTransport(
        sendgridTransport({
          auth: {
            api_key: process.env.SENDGRID_APIKEY,
          },
        })
      );
      var mailOptions = {
        from: 'destinedeepaksingh4@gmail.com',
        to: user.email,
        subject: 'Account Verification Link',
        text:
          'Hello ' +
          req.body.name +
          ',\n\n' +
          'Please verify your account by clicking the link: \nhttp://' +
          req.headers.host +
          '/confirmation/' +
          user.email +
          '/' +
          singleToken.token +
          '\n\nThank You!\n',
      };
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          req.flash(
            'error',
            'Technical Issue!, Please click on resend for verify your Email.'
          );
          return res.redirect('/users/new');
        }
      });
      req.flash(
        'error',
        'Please verify your email address by clicking on the link sent to your email.'
      );
      res.redirect('/users/login');
    });
  });
});

//GET new login form
router.get('/login', (req, res, next) => {
  const error = req.flash('error');
  res.render('login', { error });
});

// login
router.post('/login', (req, res, next) => {
  var { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Enter required fields!');
    return res.redirect('/users/login');
  }
  User.findOne({ email }, (error, user) => {
    if (error) return next(error);
    if (!user) {
      req.flash('error', 'User does not exists!');
      return res.redirect('/users/login');
    }
    user.comparePassword(password, (error, result) => {
      if (error) return next(error);
      if (!result) {
        req.flash('error', 'Password is wrong!');
        return res.redirect('/users/login');
      }
      else {
        req.session.userId = user.id;
        console.log(req.session, "sessionnh kh kh ");
        res.redirect('/dashboard');
      }
    });
  });
});

router.get('/resend', (req, res, next) => {
  
  if (req.user) {
    User.findOne({_id:req.user.id}, (error, user) => {
      if (!user) {
        return next(error);
        // user has been already verified
      } else if (user.isVerified) {
        req.flash(
          'error',
          'This account has been already verified. Please log in.'
        );
        res.redirect('/users/login');
      } else {
        // generate token and save
        var token = {
          _userId: user.id,
          token: crypto.randomBytes(16).toString('hex'),
        };
        Token.create(token, (error, singleToken) => {
          if (error) return next(error);
          const transporter = nodemailer.createTransport(
            sendgridTransport({
              auth: {
                api_key: process.env.SENDGRID_APIKEY,
              },
            })
          );
          var mailOptions = {
            from: 'destinedeepaksingh4@gmail.com',
            to: user.email,
            subject: 'Account Verification Link',
            text:
              'Hello ' +
              req.body.name +
              ',\n\n' +
              'Please verify your account by clicking the link: \nhttp://' +
              req.headers.host +
              '/confirmation/' +
              user.email +
              '/' +
              singleToken.token +
              '\n\nThank You!\n',
          };
          transporter.sendMail(mailOptions, (error) => {
            if (error) {
              req.flash(
                'error',
                'Technical Issue!, Please click on resend for verify your Email.'
              );
              return res.redirect('/users/new');
            }
          });
          req.flash(
            'error',
            'Please verify your email address by clicking on the link sent to your email.'
          );
          res.redirect('/');
        });
      }
    });
  }else{
    req.redirect('/');
  }
});

module.exports = router;
