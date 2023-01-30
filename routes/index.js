var express = require('express');
var router = express.Router();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Todo = require("../models/Todo");
const { validate } = require('../models/User');
const { token } = require('morgan');
const jwt = require("jsonwebtoken");
const validateToken = require('../auth/validateToken.js');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// Register (task 1)
router.post('/api/user/register', // Registration validation (task 4)
  body("email").isEmail(),
  body('password').isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    User.findOne({ email: req.body.email }, (err, user) => {
      if (err) throw err;
      if (user) {
        return res.status(403).json({ email: "Email already in use." });
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) throw err;
            User.create(
              {
                email: req.body.email,
                password: hash
              }, (err, ok) => {
                if (err) throw err;
                return res.sendStatus(200);
              }
            )
          })
        })
      }
    })
  }
)

// Log in (task 2)

router.post("/api/user/login",
  body("email").isLength({ min: 3 }),
  body("password").isLength({ min: 5 }),
  (req, res, next) => {
    User.findOne({ email: req.body.email }, (err, user) => {
      if (err) throw err;
      if (!user) {
        return res.status(403).json({ message: "Login failed :(" });
      } else {
        bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            const jwtPayload = {
              id: user._id,
              email: user.email
            }
            jwt.sign(
              jwtPayload,
              process.env.SECRET,
              {
                expiresIn: 120
              },
              (err, token) => {
                res.json({ success: true, token });
              }
            );
          }
        })
      }
    })
  }
)

// Route that requires authentication (task 3)
router.get("/api/private", validateToken, (req, res, next) => {
  res.json({ email: req.user.email });
})

// Todos (task 5)
router.post('/api/todos', validateToken, (req, res) => {
  Todo.findOne({ user: mongoose.Types.ObjectId(req.user._id) }, (err, todo) => {
    if (err) throw err;
    if (todo) {
      todo.todos.concat(req.body.items);
      todo.save();
    } else {
      Todo.create(
        {
          user: req.user._id,
          items: req.body.items
        }, (err, ok) => {
          if (err) throw err;
        }
      )
    }
    res.sendStatus(200);
  })
})

module.exports = router;
