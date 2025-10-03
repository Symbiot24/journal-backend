import express from 'express';
import Journal from '../models/Journal.js';
import { jwtAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Create a new journal entry
router.post('/journal', jwtAuthMiddleware, async (req, res) => {
    try {
        
        const data = req.body;

        const newEntry = new Journal({
            user : req.user.id || req.user,
            title: data.title,
            content: data.content,
            date: data.date,
            mood: data.mood
        });

        const savedEntry = await newEntry.save();
        res.status(201).json({
            message: 'Journal entry created successfully',
            entry: savedEntry
          });
        console.log(`Journal Entry for ${savedEntry.user} created successfully.`);
        

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Entry failed' });
    }
})

// Get all journal entries for a user
router.get('/journal/', jwtAuthMiddleware, async (req, res) => {
    try {
        
        const entries = await Journal.find({ user: req.user.id }).sort({createdAt : -1});
        res.json(entries);
        console.log('Journal entries fetched successfully.');

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to fetch entries' });
    }
})

// Update a journal entry
router.put('/journal/:id', jwtAuthMiddleware, async (req, res) => {
    try {
        
        const entryId = req.params.id;
        const data = req.body;

        const updatedEntry = await Journal.findByIdAndUpdate(
            { _id: entryId, user: req.user.id }, 
            {
                title: data.title,
                content: data.content,
                date: data.date,
                mood: data.mood
            },
            { new: true } 
        )

        if (!updatedEntry) {
            return res.status(404).json({ message: 'Entry not found or unauthorized' });
        }

        res.json({
            message: 'Journal entry updated successfully',
            entry: updatedEntry
          });
        console.log(`Journal Entry ${entryId} updated successfully.`);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Update failed' });
    }
});

// Delete a journal entry
router.delete('/journal/:id', jwtAuthMiddleware, async(req, res) =>{
    try {
        
        const entryId = req.params.id;

        const deletedEntry = await Journal.findOneAndDelete({ _id: entryId, user: req.user.id });

        if (!deletedEntry) {
            return res.status(404).json({ message: 'Entry not found or unauthorized' });
        }

        res.json({ message: 'Journal entry deleted successfully', entry: deletedEntry });
        console.log(`Journal Entry ${entryId} deleted successfully.`);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Can not delete user' });
    }
})

export default router;