import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import bodyParser from 'body-parser';
import passport from './passport.js';
import {jwtAuthMiddleware, generateToken} from '../middleware/auth.js';

const router = express.Router();

const localAuth = passport.authenticate('local', { session: false });

router.use(bodyParser.json());

router.use(passport.initialize());

// Signup
router.post('/signup', async (req, res) => {
   try {
    const data = req.body;

   const newUser = new User(data);

   // Check if user already exists
   const existingUser = await User.findOne({ email: data.email });
   if(existingUser) return res.status(400).json({ message: 'User already exists' });

   if (data.password !== data.confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
   }

  const savedUser = await newUser.save();

  const payload = {
    id: savedUser._id,
    email: savedUser.email
  }

   const token = generateToken(payload);

    res.status(201).json({ message: 'User registered successfully', user: savedUser, token: token });
    console.log(`User ${savedUser.username} registered successfully`);
    console.log('Generated Token:', token);
    
    
   } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
    
   }
});

// To fetch all users
router.get('/users', jwtAuthMiddleware , async (req, res) =>{
    try {
        const users = await User.find();
        res.json(users);
        console.log('Users fetched successfully');
        
    } catch (error) {
        res.status(500).json({ message: 'Unable to fetch User data' });
        console.error(error);
    }
});

// To update user details
router.put('/users/:id', jwtAuthMiddleware, async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
  
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }
  
      const response = await User.findByIdAndUpdate(userId, updateData, { new: true });
  
      if (!response) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      console.log('User details updated successfully');
      return res.json({ response });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to update User data' });
    }
  });
  

// To delete a user
router.delete('/users/:id', async (req, res) =>{
    try {
        
        const userId = req.params.id;
        
        const deleteUser = await User.findByIdAndDelete(userId);

        if (!deleteUser) {
            return res.status(404).json({ message: 'User not found' });   
        }

        res.json({ deleteUser });
        console.log('User deleted successfully');

    } catch (error) {
        res.status(500).json({ message: 'Unable to delete User data' });
        console.error(error);
    }
})
  

// Login
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
  
      const payload = { 
        id: user._id,
        email: user.email
        };

      // Update last activity on login
      await User.updateOne({ _id: user._id }, { $set: { lastActivityAt: new Date() } });

      const token = generateToken(payload);
  
      console.log(`User ${user.username} logged in successfully`);
      console.log('Generated Token:', token);
  
      return res.status(200).json({
        message: 'Login successful',
        user: user,
        token: token
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Login error' });
    }
  });
  
  

export default router;