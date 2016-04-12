//*****************************************
//  Requires
//*****************************************
var express       = require('express');
var handlebars    = require('express-handlebars');
var mongoose      = require('mongoose');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//*****************************************
//  Init
//*****************************************
var app = express();

app.engine('handlebars', handlebars( { defaultLayout: 'main' } ));
app.set('view engine', 'handlebars');

app.use(require('body-parser').urlencoded({extended: true}));
app.use(express.static('public'));
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: 'kakkapissa'
}));
app.use(passport.initialize());
app.use(passport.session());

//mongoose
mongoose.connect('mongodb://muisti:salasana12@ds013310.mlab.com:13310/muisti');

//*****************************************
//  Schemas
//*****************************************
var Schema = mongoose.Schema;
var UserDetail = new Schema({
  username: String,
  password: String
}, {
  collection: 'userInfo'
});
var UserDetails = mongoose.model('userInfo', UserDetail);



//PASSPORT
passport.serializeUser(function(user, done){
    console.log('asd');
  done(null, user);
});

passport.deserializeUser(function(user, done){
  done(null, user);
});

passport.use(new LocalStrategy(function(user, pass, done) {
    console.log('Joku yrittää sisään');
    UserDetails.findOne({ username: user }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false);
      }
      if (user.password != pass) {
        return done(null, false);
      }
      return done(null, user);
    });
}));


//*****************************************
//  Routes
//*****************************************
app.get('/', function(req, res) {
  res.render('login');
});

app.get('/register', function(req, res) {
  res.render('register');
});

//login
app.post('/login',
    passport.authenticate('local'),
    function(req, res) {
      console.log('JOku tuli sisäöäö');
      res.redirect('/' + req.user.username);
});

app.post('/register', function(req, res){
    var newUser = UserDetails({ username: req.body.username, password: req.body.password }) ;
    newUser.save(function(err, UserDetails){
      if (err) return console.error(err);
      console.log(UserDetails);
    });
    res.redirect('/');
});


app.listen(80, function() {
  console.log("App running in port 80");
});
