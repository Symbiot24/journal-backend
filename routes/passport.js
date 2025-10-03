import passport from 'passport';
import LocalStrategy from 'passport-local';
import User from '../models/User.js';

passport.use(new LocalStrategy.Strategy(async (username, password, done) => {
    try {
      const user = await User.findOne({username : username});
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isValid = await user.comparePassword(password); 
      if (!isValid) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

export default passport;