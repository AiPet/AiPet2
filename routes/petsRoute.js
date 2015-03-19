var express = require('express');
var router = express.Router();
var models = require('../Modules/Models');

var passport = require('passport');
var passportToken = require('passport-http-bearer').Strategy;

//Configurate passport bearer strategy

passport.use(new passportToken(
    function(token, done) {
        models.user.findOne({
            token: token
        }, function(err, user) {
            console.log(err, user, token);
            if (err) return done(err);
            if (!user) return done(null, false);
            return done(null, user);
        });
    }));

//Add location route
router.post('/addlocation', function(req, res, next) {
    res.end();
    var code = req.body.code;
    //Arduino code - xh207afjkp
    var x = req.body.x;
    var y = req.body.y;
    var date = new Date().toISOString();

    //Find the pet in db
    models.pet.findOne({
        'code': code
    }, function(err, pets) {
        if (err) return res.json(err);
        if (!pets) return console.error("Wrong code / Pets not found");
        pets.location.push({
            x: x,
            y: y,
            date: date
        });
        pets.save(function(err, data) {
            if (err || !data) return res.json(err);
        });
    });


});
//Get the pet info from the db
router.post('/get', passport.authenticate('bearer', {
    session: false
}), function(req, res, next) {
    models.pet.findOne({
        userId: req.user._id
    }, function(err, db) {
        if (err || !db) return res.json(err);
        res.status(200).json(db);
    });
});

//Add new pet
router.post('/add', passport.authenticate('bearer', {
    session: false
}), function(req, res, next) {
    var name = req.body.name;
    var type = req.body.type;
    var userId = req.user._id;
    var code = req.body.code
    var x = req.body.x;
    var y = req.body.y;
    var date = new Date();

    var newPet = new models.pet({
        name: name,
        userId: userId,
        type: type,
        code: code,
        location: [{
            x: x,
            y: y,
            date: date
        }]
    });

    newPet.save(function(err) {
        if (err) {
            return res.json(err);
        };
        models.user.update({
            arduino: newPet.code
        }, {
            $set: {
                havePet: true
            }
        }, function(err) {
            if (err) console.log(err);
        });
        res.json(newPet);
    });
});

//Get pet location for specific range of time
router.post('/trace', passport.authenticate('bearer', {
    session: false
}), function(req, res, next) {

    var start_date = new Date(req.body.start_date.replace('T', ' ').replace('-', '/'));
    var end_date = new Date(req.body.end_date.replace('T', ' ').replace('-', '/'));

    var userId = req.user._id;
    var entries = [];
    models.pet.findOne({
        userId: userId
    }, function(err, data) {
        if (err || !data) return res.json(err);
        data.location.forEach(function(loc) {
            if (loc.date >= start_date & loc.date <= end_date) {
                entries.push({
                    "Lat: ": loc.x,
                    "Lon: ": loc.y,
                    "Date: ": loc.date
                });
            }
        });
        return res.json(entries);
    });

});


module.exports = router;