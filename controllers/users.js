const express = require('express');
const router = express.Router();
const User = require('../models/users');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const userDbEntry = {};
    userDbEntry.username = req.body.username;
    userDbEntry.password = hashedPassword;
    try {
        const userIsTaken = await User.findOne({username:req.body.username});
        if (!userIsTaken) {
          const createdUser = await User.create(userDbEntry);
          console.log(`created user ${createdUser}`)
          req.session.userId = createdUser._id;
          req.session.username = createdUser.username;
          req.session.logged = true;
          res.json({
              status: 200,
              data: {
                userId: createdUser._id,
                trackedBills: createdUser.trackedBills
              }
          })
        } else {
          res.json({
            status: 400,
            message: "Username is taken!"
          })
        }
    } catch (err) {
        console.log(err);
        res.send(err);
    }
})

router.post('/login', async (req, res) => {
    try {
      const foundUser = await User.findOne({
          username: req.body.username
      })
      if (foundUser) {
        if (bcrypt.compareSync(req.body.password, foundUser.password)) {
            req.session.message = '';
            req.session.userId = foundUser._id;
            req.session.username = foundUser.username;
            req.session.logged = true;
            console.log(req.session, req.body)
            res.json({
                status: 200,
                data: {
                  userId: foundUser._id,
                  trackedBills: foundUser.trackedBills
                }
            })
        } else {
            req.session.message = 'Invalid username or password.';
        }
      } else {
        req.session.message = 'Invalid username or password.';
      }
    } catch (err) {
        res.send(err);
    };
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send(err);
        } else {
            res.redirect('/');
        }
    });
});

router.get('/', async (req, res) => {
    console.log(req.body, ' req.body in show route');
    try {
        const allUsers = await User.find();

        res.json({
            status: 200,
            data: allUsers
        })
    } catch (err) {
        res.send(err)
    }
});

router.get('/:id', async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.id);
        res.json({
            status: 200,
            data: foundUser
        });
    } catch (err) {
        res.send(err)
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({
            status: 200,
            data: updatedUser
        });
    } catch (err) {
        res.send(err)
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndRemove(req.params.id);
        res.json({
            status: 200,
            data: deletedUser
        });
    } catch (err) {
        res.send(err);
    }
});

router.put('/:userid/track/:id', async (req, res) => {
    console.log(`Updating tracked bills for user: ${req.session.id}`)
  
    try {
      const alreadyTracking = await User.findOne(
        { '_id' : req.params.userid , 
        'trackedBills.bill_id' : req.params.id
        },
      );
      if (!alreadyTracking) {
        const updatedUser = await User.findByIdAndUpdate(
        req.params.userid, 
        { $push : { trackedBills : req.body.bill } },
        );
        res.json({
          status: 200,
          data: 'user update successful'
        });
        console.log(`Tracking this bill, user info is now: ${updatedUser}`)
      } else {
        res.json({
          status: 401,
          data: {
            text: 'user already tracking',
            alreadyTracking: alreadyTracking,
            idSent: req.params.id
          }
        });
        console.log(`User is already tracking this bill...`)
      }
    } catch(err){
      console.log(err);
      res.send(err);
    }
});

router.put('/:userid/untrack/:id', async (req, res) => {
    // Troubleshooting Input
    console.log(`TRYING TO UNTRACK BILL ${req.params.id} FROM USER ${req.params.userid}...`)
  
    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.params.userid,
          "trackedBills.bill_id" : req.params.id }, 
        { $pull:  { 
          "trackedBills": {
            bill_id: req.params.id} 
        }},
      { upsert:false,
        new:true
      }, function(err, product){
        console.log(`AFTER UNTRACKING, USER STILL TRACKS ${product}...`)
        if (err) {
          return res.json({
            status: 404,
            data: 'UNTRACKED BILL FAILED'
          });
        }
        return res.json({
          status: 200,
          data: {
            _id: req.params.id,
            message: 'UNTRACKED BILL SUCCESS'
          }
        });
      })
    } catch(err){
      console.log(`Untracking bill failed. Error: ${err}`);
      res.send(`Untracking bill failed. Error: ${err}`);
    }
});

module.exports = router;