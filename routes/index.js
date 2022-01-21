var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const cmtModel = require('./comment');
const sendMail = require('./nodemailer');
const passport = require('passport')
const multer = require('multer');
const localStrategy = require('passport-local');
const {v4 : uuidv4} = require('uuid');

passport.use(new localStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname);
  }
})

const upload = multer({ storage: storage })

router.get('/',checkLoggedIn ,function(req, res) {
  res.render('index',{pagename:"Home Page",loggedin:false});
});

router.get('/check' ,function(req, res) {
  userModel.find()
  .then(function(data){
    res.send(data);
  })
});

router.get('/userprofile',isLoggedIn ,function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data){
    res.render('userprofile',{data,pagename:"User Page",loggedin:true})
  })
});

router.post('/upload', upload.single('image'),isLoggedIn,function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data){
      data.image.push(`../uploads/${req.file.filename}`)
      data.profilepic = data.image[data.image.length-1]
      data.save()
      .then(function(){
       res.redirect('/userprofile');
    })
  })
});

router.get('/forgot',checkLoggedIn, function(req, res) {
  res.render('forgot',{pagename:"Forgot Page",loggedin:false});
});

router.get('/signup',checkLoggedIn, function(req, res) {
  res.render('signup',{pagename:"Signup Page",loggedin:false});
});

router.get('/users', function(req, res) {
  userModel.find()
  .then(function(data){
    res.send(data);
  })
});

router.post('/createpost', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data){
    postModel.create({
      caption:req.body.caption,
      location:req.body.location,
      imageurl:req.body.imageurl,
      user:req.session.passport.user,
      author:data
    }).then(function(lala){
      data.post.push(lala);
      data.save()
      .then(function(){
        res.redirect('/mypost'); 
      })
    })
  })
}); 
 
router.get('/mypost', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .populate('post')
  .then(function(data){
    res.render('mypost',{data,pagename:"Posts",loggedin:true});
  })
}); 

router.get('/profile', isLoggedIn, function(req, res) {
    postModel.find()
  .populate('author')
  .populate('comment')
  .then(function(data){
    res.render('profile',{data,pagename:"Profile Page",loggedin:true});
  })
});

router.get('/username/:username',isLoggedIn,function(req,res){
  userModel.findOne({username:req.params.username})
  .then(function(founduser){
    if(founduser !== null){
      res.json({ founduser: true});
    }else{
      res.json({ founduser: false});
    }
  })
})

router.get('/cmtlikes/:id', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data2){
    cmtModel.findOne({_id:req.params.id})
    .then(function(cmtdata){
      if(cmtdata.cmtlikes.indexOf(data2._id) === -1){
        cmtdata.cmtlikes.push(data2._id);
      }else{
        var index = cmtdata.cmtlikes.indexOf(data2._id);
        cmtdata.cmtlikes.splice(index, 1);
      }
      cmtdata.save().then(function(){
        res.redirect(req.header('referer'));
      })
    })    
  })
});

router.get('/likes/:id', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data2){
    postModel.findOne({_id:req.params.id})
  .then(function(post){
    if(post.likes.indexOf(data2._id) === -1){
      post.likes.push(data2._id);
    }else{
      var index = post.likes.indexOf(data2._id);
      post.likes.splice(index, 1);
    }
    post.save().then(function(){
      res.redirect(req.header('referer'));
    })
  })
  })
});

router.post('/comment/:id', isLoggedIn, function(req, res) {
    userModel.findOne({username:req.session.passport.user})
    .then(function(userdata){
      postModel.findOne({_id:req.params.id})
    .then(function(postfound){
      cmtModel.create({
        comment: req.body.comment,
        cmtuser: req.session.passport.user
      }).then(function(data){
          postfound.comment.push(data)
          userdata.post.push(postfound)
          postfound.save()
          .then(function(foundcmt){
            res.redirect('/profile');
          })
      })
    })
    })
});

router.get('/showcmt', function(req, res) {
  cmtModel.find()
  .populate('author')
  .then(function(data){
    res.send(data);
  })
});

router.get('/usernotfound', function(req, res) {
  res.render('usernotfound',{pagename:"Not Found",loggedin:false});
});

router.post('/forgot',function(req, res) {
  var sec = uuidv4();
  userModel.findOne({email:req.body.email})
  .then(function(founduser){
    if(founduser !== null){
    founduser.secret = sec;
    founduser.expiry = Date.now()+15*1000;
    founduser.save()
    .then(function(){
      var routeaddress = `http://localhost:3000/forgot/${founduser._id}/${sec}`;
      sendMail(req.body.email,routeaddress)
      .then(function(){
        res.send("Check your email");
      })
    })
  }
  })
});

router.get('/forgot/:id/:secret',function(req,res){
  userModel.findOne({_id:req.params.id})
  .then(function(founduser){
    if(founduser.secret === req.params.secret &&  Date.now() < founduser.expiry ){
      res.render('newpassword',{founduser,pagename:"New Password",loggedin:false});
    }else{
      res.send("link expired");
    }
  })
})

router.post('/newpassword/:email',function(req,res){
  userModel.findOne({email:req.params.email})
  .then(function(founduser){
    founduser.setPassword(req.body.password1,function(){
      founduser.save()
    .then(function(){
      req.logIn(founduser,function(){
        res.redirect('/profile');
      })
    })
    })
  })
})

router.post('/register', function (req, res) {
  var newUser = new userModel({
    name: req.body.fullname,
    username: req.body.username,
    mobilenumber: req.body.number,
    email: req.body.email
  })
  userModel.register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile');
      })
    })
});

router.post('/login', passport.authenticate('local', {
  successRedirect: 'profile',
  failureRedirect: 'usernotfound'
}), function (req, res, next) { });

router.get('/logout', function (req, res, next) {
  req.logOut();
  res.redirect('/');
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/');
  }
}
function checkLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/profile');
  }
  else {
    return next();
  }
}


module.exports = router;
