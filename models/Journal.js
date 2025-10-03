import mongoose from "mongoose";

const journalSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: "User",
      required: true 
    },
  title: {
     type: String,
      required: true 
    },
  content: { 
    type: String,
     required: true 
    },
  mood: {
    type: String,
    validate: {
        validator: function(v) {
          const moods = ["happy", "sad", "angry", "anxious", "neutral"];
          return moods.includes(v.toLowerCase());
        },
        message: props => `${props.value} is not a valid mood!`
      }
  },
  createdAt: { 
    type: Date,
     default: Date.now 
    },
});

const Journal = mongoose.model("Journal", journalSchema);

export default Journal;