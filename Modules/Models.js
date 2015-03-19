//Require mongoose
var mongoose = require('mongoose');
var shortid = require('mongoose-minid');

var crypto = require('crypto');
var jwt = require('jwt-simple');
var secret = "AiPettrackingdevice";

//generate random value
function randomValueHex(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters
}

function generateToken() {
    var random = randomValueHex(15);
    //define data for the token
    var Tokendata = {
        company: 'AiPet Corporation',
        createdOn: new Date(),
        rand: random
    };
    var token = jwt.encode(Tokendata, secret);

    return token;
};

//Connect to mongodb
mongoose.connect('mongodb://localhost/AiPet2');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {

    //Configurate regex
    var reg_numbers = /^[0-9]*\.?[0-9]+$/;
    var reg_password = /^(?=.*\d)(?=.*[a-z])\w{6,}$/;
    var reg_username = /^(?=.*[a-z])\w{3,}$/;
    var reg_email = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

    //Create the user schema
    var userSchema = mongoose.Schema({
        _id: {
            type: shortid,
            len: 5
        },
        provider: String,
        data: Object,
        createdAt: {
            type: Date,
            default: Date.now
        },
        token: {
            type: String,
            require: [true, 'invalid Token']
        }
    });

    userSchema.statics.setToken = function(id, cb) {
        var token = generateToken();
        this.update({
            '_id': id
        }, {
            $set: {
                token: token
            }
        }, function(err) {
            if (err) console.log(err);
            cb(token);
        });
    };

    //location schema
    var locationSchema = mongoose.Schema({
        _id: {
            type: shortid,
            len: 5
        },
        x: {
            type: String,
            required: [true, 'invalid X'],
            match: [reg_numbers, 'invalid X']
        },
        y: {
            type: String,
            required: [true, 'invalid Y'],
            match: [reg_numbers, 'invalid Y']
        },
        date: Date
    });

    //crete pet schema
    var petSchema = mongoose.Schema({
        _id: {
            type: shortid,
            len: 5
        },
        userId: {
            type: String,
            required: [true, 'invalid UserId']
        },
        name: {
            type: String,
            required: [true, 'invalid Name']
        },
        type: {
            type: String,
            required: [true, 'invalid Type']
        },
        location: [locationSchema],
        code: {
            type: String,
            unique: [true, 'invalid Code'],
            required: [true, 'invalid Code']
        }
    });

    //create mongoose models
    var user = mongoose.model('users', userSchema);
    var pet = mongoose.model('pets', petSchema);

    exports.pet = pet;
    exports.user = user;
});