//*****************************************
//  Requires
//*****************************************
var express       = require('express');
var handlebars    = require('express-handlebars');
var mongoose      = require('mongoose');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var shortid       = require('shortid');
var flash         = require('connect-flash');

var secrets       = require('./secrets.js');

//*****************************************
//  Init
//*****************************************
var app = express();

app.engine('handlebars', handlebars( { defaultLayout: 'main' } ));
app.set('view engine', 'handlebars');

app.use(require('body-parser').urlencoded({extended: true}));
app.use(express.static('public'));
app.use(require('cookie-parser')(secrets.cookieSecret));
app.use(flash());
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: secrets.sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());

//mongoose
mongoose.connect(secrets.mongoConStr);

//*****************************************
//  Schemas
//*****************************************
//Käyttäjät
var Schema = mongoose.Schema;
var UserDetail = new Schema({
  username: String,
  password: String
}, {
  collection: 'userInfo'
});
var UserDetails = mongoose.model('userInfo', UserDetail);

//Listat
var Lista = new Schema({
  lid: String,
  nimi: String,
  items: [String]
}, {
  collection: 'listat'
});
var Listat = mongoose.model('listat', Lista);

//Käyttäjien listat
var UserLista = new Schema({
  user: String,
  listat: [String]
}, {
  collection: 'userListat'
});
var UserListat = mongoose.model('userListat', UserLista);

//PASSPORT
passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(user, done){
  UserDetails.find({'user': user.username}, function(err){
    done(err, user);
  });
});

//Loggin in
passport.use(
  new LocalStrategy(function(user, pass, done) {
    UserDetails.findOne({ username: user }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        console.log('Väärä käyttäjätunnus');
        return done(null, false, {'message': 'Käyttäjätunnusta ei ole olemassa!'});
      }
      if (user.password != pass) {
        console.log('Väärä passu');
        return done(null, false, {'message': 'Väärä salasana!'});
      }
      return done(null, user);
    });
}));

//Jos flash viestejä, välitä ne
app.use(function(req,res,next){
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  next();
});


//*****************************************
//  Routes
//*****************************************
app.get('/', function(req, res) {
  if (req.user) {
    res.render('profile');
  }
  else {
    res.render('login'); //{ message: req.session.flash });
  }
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/', failureFlash: true} ),
    function(req, res) {
      res.redirect('/');
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.post('/register', function(req, res){
    var newUser = UserDetails({ username: req.body.username, password: req.body.password }) ;
    newUser.save(function(err, UserDetails){
      if (err) return console.error(err);
    });
    res.redirect('/');
});

//*****************************************
//  API
//*****************************************
app.post('/add', function(req, res){
  if (req.user) {
    var data = JSON.parse(req.body.data);
    for (var i = 0; i < data.length; i++) {
      console.log(data[i]);
      /*var newLista = Listat({ lid: data[i].lid, nimi: data[i].nimi, items: data[i].items});
      newLista.save(function(err, Listat){
        if (err) return console.error(err);
      });*/
      Listat.findOneAndUpdate(
        { lid: data[i].lid },
        { nimi: data[i].nimi, items: data[i].items },
        {upsert: true },
        function(err){

        }
      );
      UserListat.findOneAndUpdate(
        {user: req.user.username},
        {$push: {listat: data[i].lid}},
        {upsert: true},
        function(err){
        }
      );
    }
    res.send({success: true});
  }
  else {
    res.redirect(303, '/');
  }
});

app.get('/get', function(req, res){
  if (req.user) {
    console.log('pyyntö');
    var lists = [];
    lists = UserListat.find({ user: req.user.username }, function(err, ulistat){
      if (err)  return res.status(500).send('VIrhe: tietokanta virhe');

      lists = ulistat.map(function(l){
        return l.listat;
      });

      lists = lists[0];
      Listat.find({lid: {$in: lists}},function(err, records){
          if (err)  return res.status(500).send('VIrhe: tietokanta virhe');
          console.log(records.length);
          var r = records.map(function(l){
            return {
              lid: l.lid,
              nimi: l.nimi,
              items: l.items
            }
          });

          console.log(r);
          res.json(JSON.stringify(r));
        });
      });
    }
});

app.delete('/:id', function(req, res){
  if (req.user) {
    console.log(req.user.username + ' poisti muistion ' +req.params.id);

    Listat.find({ lid: req.params.id }).remove().exec();

    UserListat.findOneAndUpdate(
      {user: req.user.username},
      {$pull: {listat: req.params.id}},
      {upsert: false},
      function(err){
      }
    );

    res.send({success: true});
  }
});

app.post('/:id', function(req, res){
  if (req.user) {
    console.log(req.user.username + ' lisäsi muistion ' +req.params.id);

    UserListat.findOneAndUpdate(
      {user: req.user.username},
      {$push: {listat: req.params.id}},
      {upsert: false},
      function(err){
      }
    );

    res.send({success: true});
  }
});

app.get('/newid', function(req,res){
  res.send({lid: shortid.generate()});
});

//VIRHESIVUT
//kirjautuminen ei onnistu
app.use(function(req, res) {
	res.type('text/plain');
	res.status('401');
	res.render('login', {loginFailed: true}); //KORJAA
});

app.listen(80, function() {
  console.log("App running in port 80");
});
