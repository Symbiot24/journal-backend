import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './db.js';
import userRoutes from './routes/user-routes.js';
import bodyParser from 'body-parser';
import journalRoutes from './routes/journal-routes.js';
import insightsRoutes from './routes/insights-routes.js';
import aiRoutes from './routes/ai-routes.js';

const PORT = process.env.PORT || 2430;

dotenv.config();
const app = express();

const corsOptions = {
  origin : "https://mindecho30.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}

app.use(cors(corsOptions)); 
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('MindEcho - Your Mental Health Journal');
});

// Routes
app.use(userRoutes);
app.use(journalRoutes);
app.use(insightsRoutes);
app.use(aiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
