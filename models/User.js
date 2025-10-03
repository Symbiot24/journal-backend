import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name : {
    type: String,
    required: [true, 'Name is required'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be at most 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.virtual("confirmPassword");

userSchema.pre('save', async function(next) {
  const user = this;

  if (!user.isModified('password')) return next();

  try {
    
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
    next();

  } catch (error) {
    throw(error); 
  }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const isValid = await bcrypt.compare(candidatePassword, this.password);
    return isValid;
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;