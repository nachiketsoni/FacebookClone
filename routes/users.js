const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/facebook3');

const faceSchema = mongoose.Schema({
  name: String,
  username: String,
  mobilenumber: Number,
  password: String,
  email: String,
  secret: String,
  expiry:{
    type:String
  },
  image:[{
    type:String,
    default:"./uploads/profile.png" 
  }],
  profilepic:{
    type:String,
    default:"./uploads/profile.png" 
  },
  post: [{
    type: mongoose.Schema.Types.ObjectId,
    default: [],
    ref: "post"
  }]
})

faceSchema.plugin(plm);

module.exports = mongoose.model('user', faceSchema);