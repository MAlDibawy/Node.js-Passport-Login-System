const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const initializePassport = require('./passport-config');

initializePassport(passport,
    email => users.find(user => user.email == email),
    id => users.find(user => user.id == id)
);

const app = express();

// storing users in memory cuz this is just for learning
const users = [];

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use('/public', express.static('public'));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name });
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPass = await bcrypt.hash(req.body.password, 10);
        let user = {
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPass
        };
        users.push(user);
        res.redirect('/login');
    } catch (error) {
        res.redirect('/register');
    }
})

app.delete('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    } else {
        next();
    }
}


app.listen(3000);