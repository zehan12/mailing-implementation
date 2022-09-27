var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var userSchema = new Schema({
    name: {type:String, required: true},
    email: {type:String, required: true, unique: true},
    password: {type:String},
    age: {type:Number},
    phone: {type:Number},
    country: String,
    isVerified:{type: Boolean, default: false}
}, {timestamps: true})

userSchema.pre('save', function(next){
    if(this.password){
        bcrypt.hash(this.password, 10, (error, hashed) => {
            this.password = hashed;
            next();
        })
    }
    else {
        next();
    }
})

userSchema.methods.comparePassword = function(password, cb){
    bcrypt.compare(password, this.password, (error, result) => {
      return cb(error, result);
    });
} 

module.exports = mongoose.model('User', userSchema);
