//requiring all used modules, initializing express
const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const bcrypt = require('bcrypt');
// const nodemailer = require('nodemailer');

//configuring and initializing modules
const app = express();
//SETTING UP PUG
app.set('view engine', 'pug');
//CSS STATIC PAGE
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
const sequelize = new Sequelize('reservation', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres',
    storage: "./session.postgres"
});
//SESSIONS
app.use(session({
    store:new SequelizeStore({
    db:sequelize,
    checkExpirationInterval:30 * 60 * 1000,//interval at which to cleanup expired sessions in milliseconds
    expiration:24 * 60 * 60 * 1000,//maximum age (in milliseconds) of a valid session.
    )},
    secret: "whatever secret for user",
    saveUninitialized: true,
    resave: false,
    // proxy: true,
    })
}));

//MODEL CONFIGURATION
const User = sequelize.define('users', {
    firstname: { type: Sequelize.STRING, notNull: false },
    lastname: { type: Sequelize.STRING, notNull: false },
    email: { type: Sequelize.STRING, unique: false },
    phone: { type: Sequelize.STRING, notNull: false },
    address: { type: Sequelize.STRING, notNull: false },
    passport: { type: Sequelize.STRING, notNull: false },
    creditcard: { type: Sequelize.STRING, notNull: false },
    password: { type: Sequelize.STRING },
}, {
    timestamps: false
});

// ROOM MODEL DEFINITION
const Rooms = sequelize.define('rooms', {
    roomNumber: { type: Sequelize.STRING, unique: false },
    roomType: { type: Sequelize.STRING, notNull: false },
    roomPreference: { type: Sequelize.STRING, notNull: false },
    bedPreference: { type: Sequelize.STRING, notNull: false },
    roomRate: { type: Sequelize.STRING, notNull: false },
    roomAvailability:{ type: Sequelize.BOOLEAN, default:true},
}, {
    timestamps: false
});


//RESERVATION BOOKING MODEL DEFINITION (JOINT TABLE)
const Bookings = sequelize.define('bookings', {
    confirmationNumber: { type: Sequelize.INTEGER,
    primaryKey: false,
    autoIncrement: false },
    userId: { type: Sequelize.STRING, unique: false },
    dateBooked: { type: Sequelize.DATE, default: Date },
    dateCheckin: { type: Sequelize.DATE, notNull: false },
    dateCheckout: { type: Sequelize.DATE, notNull: false },
    roomType: { type: Sequelize.STRING, notNull: false },
    roomNumber: { type: Sequelize.STRING, unique: false },

}, {
    timestamps: false
});

//syncing models in database
sequelize.sync({force: false});

// TABLES RELATIONSHIP/ASSOCIATION (for Many to Many Relationship)

User.belongsToMany(Rooms, { through: Bookings })
Rooms.belongsToMany(User, { through: Bookings })


//INDEX/HOME ROUTE
app.get('/', (req, res) => {
  res.render('index', {
    message: req.query.message,
    user: req.session.user
  });
});

//USERS LOGIN PAGE IS ON INDEX PAGE
app.post('/login', (req, res) => {
  if (req.body.email.length === 0) {
    res.redirect('/?message=' + encodeURIComponent("Please fill in your username."))
    return;                                                //checking if user has filled in both fields
  }
  if (req.body.password.length === 0) {
    res.redirect('/?message=' + encodeURIComponent("Please fill in your password."))
    return;
  }
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({
    where: {
      email: req.body.email
    }
  })
  .then((user) => {
    const hash = user.password;
    bcrypt.compare(password,hash)
    .then((result) => {
      if (user !== null && password === user.password) {
    }
    
          
      
      res.redirect(`/users/${user.lastname}`);          //if they exist and info is correct, start session for user
    } else {
      res.redirect('/?message=' + encodeURIComponent("Invalid email or password.")); //if incorrect showing error to user
    }
  })
  .catch((error) => {
     console.error(error);           //if any error occurs showing an invalid message to user
    res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
  });
});


//TO REGISTER ROUTE CREATING NEW USER IN DATABASE and starting session for the user and sending them to their profile
app.get('/register', (req,res) => {
  res.render('register');
})

//creating new user in database and starting session for the user and sending them to their profile
app.post('/register', (req,res) => {
  if (req.body.password === req.body.password) {
    const password = req.body.password;
    bcrypt.hash(password, 10)
    .then((hash) => {
  User.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    passport: req.body.passport,
    creditcard: req.body.creditcard,
    password: hash
  })
      .then((user) => {
        req.session.user = user;
      })
      .then(() => {
        res.redirect('/profile')
      })
    })
    .catch((error) => {
      console.error(error);
      res.redirect('/?message=' + encodeURIComponent('Error has occurred. Please check the server.'));
    })
  } else {
    res.render('register',
    {message: "The passwords don't match!"
    })
  };
});
app.get('/profile', (req,res) => {
  const user = req.session.user;
  if (user === undefined) {
    res.redirect('/?message=' + encodeURIComponent("Please log in"));
  } else {
    res.render('profile', {
      user: user
    })
  }
});
// //go to the user profile page with dynamic route, it will show the user's username
// app.get('/users/:lastname', (req,res) => {
//   const user = req.session.user;
//   if (user === undefined) {
//     res.redirect('/?message=' + encodeURIComponent("Please log in"));
//   } else {
//     res.render('profile', {
//       user: user
//     })
//   }
// });

<<<<<<< HEAD
//ROUTE AVAILABILITY
//User will check availabilty
app.get('/availabilty', (req, res) =>{
  res.render('availabilty');
=======
//ROUTE TO CHECK AVAILABILITY ROUTE
//User will make will check availabilty
app.get('/availability', (req,res) => {
  res.render('availability');
>>>>>>> e09e707cc59e7cbcdad1a80fe056c123de874261
})

//creating new reservation as per avaialability in database and starting session for the user and sending them to their profile
app.post('/availability', (req,res) => { // check with Robert weather post or get 
  const user = req.session.user;
  const roomAvailability = req.body.roomAvailability;
  const body = req.body.body
  Rooms.findall({
    where:{roomAvailability:boolean}
  })
  .then (() =>){
    return user.RoomsAvailability({
    dateBooked: req.body.dateBooked,
    dateCheckin: req.body.dateCheckin,
    dateCheckout:req.body.dateCheckout,
    roomNumber: req.body.roomNumber,
    })
    .then (()res.redirect('/roomAvailability') //check with Robert how to render after check availability
    .catch(error =>{console.error(error)})
  }

//GET BOOKINGS ROUTE CREATING NEW USER IN DATABASE and starting session for the user and sending them to their profile
app.get('/bookings', (req,res) => {
  res.render('bookings');
})

//creating new reservation in database and starting session for the user and sending them to their profile
app.post('/bookings', (req,res) => {
   Booking.create({
    //dateBooked: req.session.dateBooked // check how to use this with Robert 
    dateCheckin: req.body.dateCheckin,
    dateCheckout: req.body.dateCheckout,
    roomType: req.body.roomType,
    roomNumber: req.body.roomNumber,

  .then((Bookings) => {
    res. render('bookings')
  })
});
 
//ROUTE TO CONFIRMATION
//User will receive a confirmation on what has been booked
app.get('/confirmation', (req,res) => {
  res.render('confirmation');
})

//creating confirmation in database and starting session for the user and sending them to their profile
app.post('/confirmation', (req,res) => {
<<<<<<< HEAD
=======
  res.redirect('/bookings');
})

//TO BOOKINGS ROUTE CREATING NEW USER IN DATABASE and starting session for the user and sending them to their profile
app.get('/bookings', (req,res) => {
  res.render('bookings');
})

//creating new reservation in database and starting session for the user and sending them to their profile
app.post('/bookings', (req,res) => {
>>>>>>> e09e707cc59e7cbcdad1a80fe056c123de874261
  User.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    phone: req.body.phone,
    dateBooked: req.body.dateBooked,
    dateCheckin: req.body.dateCheckin,
    dateCheckout: req.body.dateCheckout,
    roomType: req.body.roomType,
    roomPreference: req.body.roomPreference,
    bedPreference: req.body.bedPreference,
    roomRate: req.body.roomRate
       
  })
  .then(()=> res.redirect('/confirmation')) 
  .catch(err => {console.error(err)})
    
  });


const server = app.listen(3000, () => {
    console.log('Hotel app is listening on port: ' + server.address().port);
})
