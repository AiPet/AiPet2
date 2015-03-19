var express = require('express');
var router = express.Router();
var models = require('../Modules/Models');
var config = require('../Modules/Config').config;

var passport = require('passport');
var passportToken = require('passport-http-bearer').Strategy;
var passportLocal = require('passport-local').Strategy;
var passportFacebook = require('passport-facebook').Strategy;
var passportGoogle = require('passport-google-oauth').OAuth2Strategy;

var bcrypt = require('bcrypt-nodejs');

//configurate passport local strategy
passport.use(new passportLocal(function(username, password, done) {
    models.user.findOne({
        provider: 'local',
        'data.username': username
    }, function(err, user) {
        if (err) return done(err);
        if (!user) {
            return done(null, false, {
                message: 'Incorect username or password'
            });
        }
        if (!bcrypt.compareSync(password, user.data.password)) {
            return done(null, false, {
                message: 'Incorect password.'
            });
        }
        models.user.setToken(user._id, function(token) {
            user.token = token;
            return done(null, user);
        });
    });

}));

//configure passport facebook strategy
passport.use(new passportFacebook({
        clientID: process.env.FACEBOOK_ID || config.facebook.id,
        clientSecret: process.env.FACEBOOK_SECRET || config.facebook.secret,
        callbackURL: process.env.FACEBOOK_CALLBACK || config.facebook.url
    },
    function(accessToken, refreshToken, profile, done) {
        var data = profile._json;

        models.user.findOne({
            provider: 'facebook',
            'data.id': data.id
        }, function(err, user) {
            if (err) return done(err);
            if (user) {
                models.user.setToken(user._id, function(token) {
                    user.token = token;
                    return done(null, user);
                });
            } else {
                var newUser = new models.user({
                    provider: 'facebook',
                    data: data
                });
                newUser.save(function(err, saveduser) {
                    if (err) return done(err);
                    models.user.setToken(user._id, function(token) {
                        user.token = token;
                        return done(null, user);
                    });
                });
            }
        })
    }
));

//configure passport google plus strategy
passport.use(new passportGoogle({
    clientID: process.env.GOOGLE_ID || config.google.id,
    clientSecret: process.env.GOOGLE_SECRET || config.google.secret,
    callbackURL: process.env.GOOGLE_CALLBACK || config.google.url
}, function(accessToken, refreshToken, profile, done) {
    var data = profile._json;

    models.user.findOne({
        provider: 'google',
        'data.id': data.id
    }, function(err, user) {
        if (err) return done(err);
        if (user) {
            models.user.setToken(user._id, function(token) {
                user.token = token;
                return done(null, user);
            });
        } else {
            var newUser = new models.user({
                provider: 'google',
                data: data
            });
            newUser.save(function(err, saveduser) {
                if (err) return done(err);
                models.user.setToken(user._id, function(token) {
                    user.token = token;
                    return done(null, user);
                });
            });
        }
    })
}))

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(_id, done) {
    models.user.findOne({
        '_id': _id
    }, function(err, user) {
        if (err || !user) return done(err);
        done(null, user);
    })
})
// User registration route
router.post('/register', function(req, res, next) {
    // Define variables from the request
    var username = req.body.username;
    var pass = req.body.password;
    var hash = bcrypt.hashSync(pass);
    var email = req.body.email;
    var token = '';

    //Create the new user
    var newUser = new models.user({
        provider: 'local',
        data: {
            username: username,
            password: hash,
            email: email
        }
    });
    // Save the new user
    newUser.save(function(err) {
        if (err) {
            return res.json(err);
        };
        res.send(newUser);
    });
});

//use local strategy to log in and retrive the user data
router.post('/auth/local', function(req, res, next) {
    passport.authenticate('local', function(err, user) {
        if (!user) res.sendStatus(401);
        if (user) {
            models.pet.find({
                userId: user._id
            }, function(err, pets) {
                if (err) return res.json(err);
                res.json({
                    'token': user.token,
                    'pets': pets
                });
            });
        }
    })(req, res, next);
});

//use facebook strategy to log in or registere
router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback', passport.authenticate('facebook'), function(req, res, next) {
    models.pet.find({
        userId: req.user._id
    }, function(err, pets) {
        if (err) return res.json(err);
        res.json({
            'token': req.user.token,
            'pets': pets
        });
    });
});

router.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/plus.login']
}));

router.get('/auth/google/callback', passport.authenticate('google'), function(req, res, next) {
    models.pet.find({
        userId: req.user._id
    }, function(err, pets) {
        if (err) return res.json(err);
        res.json({
            'token': req.user.token,
            'pet': pets
        });
    });
});

router.get('/assa', function(req, res, next){
    res.json(config.facebook.id);
});

module.exports = router;