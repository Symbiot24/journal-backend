import Journal from '../models/Journal.js';
import analyzeJournal from '../utils/insights.js';
import { 
  calculateMoodDistribution,
  calculateMoodTrends,
  calculateCommonWords,
  generatePatternInsights
} from '../services/insights-service.js';

// Get insights for a specific journal entry
export const getJournalInsights = async (req, res) => {
  try {
    const { journalId } = req.params;
    const userId = req.user.id;

    const journal = await Journal.findOne({ _id: journalId, user: userId });
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    const insights = analyzeJournal(journal.content);

    return res.status(200).json({
      success: true,
      data: {
        ...insights,
        journalId,
        date: journal.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting journal insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving insights'
    });
  }
};

// Get a summary of user's insights across all journal entries
export const getUserInsightsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all user journals
    const journals = await Journal.find({ user: userId }).sort({ createdAt: -1 });
    
    if (journals.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No journal entries found',
          totalEntries: 0,
          insights: [{
            type: 'empty',
            title: 'Start your journaling journey',
            description: 'Write your first journal entry to receive personalized insights.'
          }]
        }
      });
    }

    // Calculate mood distribution
    const moodDistribution = calculateMoodDistribution(journals);
    
    // Calculate common words/topics
    const commonWords = calculateCommonWords(journals);
    
    // Calculate overall stats
    const totalEntries = journals.length;
    const averageWordCount = Math.round(
      journals.reduce((sum, journal) => sum + journal.content.split(/\s+/).length, 0) / totalEntries
    );
    
    // Get most recent mood
    const latestJournal = journals[0];
    const latestInsights = analyzeJournal(latestJournal.content);
    
    // Generate pattern-based insights
    const patternInsights = generatePatternInsights(journals);

    return res.status(200).json({
      success: true,
      data: {
        totalEntries,
        moodDistribution,
        commonWords,
        averageWordCount,
        latestMood: latestInsights.mood,
        streakDays: calculateStreakDays(journals),
        insights: [
          // Add latest entry insight
          {
            type: 'recent',
            title: 'From your most recent entry',
            description: `Your latest journal from ${formatDate(latestJournal.createdAt)} shows a ${latestInsights.mood.toLowerCase()} mood.`
          },
          // Add pattern-based insights
          ...patternInsights
        ]
      }
    });
  } catch (error) {
    console.error('Error getting user insights summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving insights summary'
    });
  }
};

// Get user's mood trends over time
export const getUserMoodTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // Default to 30 days
    
    // Calculate the start date based on period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Get journals for the specified period
    const journals = await Journal.find({ 
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });
    
    if (journals.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No journal entries found for the selected period',
          trends: []
        }
      });
    }

    // Calculate mood trends
    const trends = calculateMoodTrends(journals);
    
    // Generate insights specific to trends
    const trendInsights = generateTrendInsights(trends, parseInt(period));

    return res.status(200).json({
      success: true,
      data: {
        trends,
        period: parseInt(period),
        insights: trendInsights
      }
    });
  } catch (error) {
    console.error('Error getting mood trends:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving mood trends'
    });
  }
};

// Helper function to calculate streak days
function calculateStreakDays(journals) {
  if (journals.length === 0) return 0;
  
  let streak = 1;
  let currentDate = new Date(journals[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);
  
  // Check if the most recent entry is from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (currentDate.getTime() !== today.getTime()) {
    return 0; // Streak broken if most recent entry is not from today
  }
  
  // Count consecutive days
  for (let i = 1; i < journals.length; i++) {
    const entryDate = new Date(journals[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    if (entryDate.getTime() === prevDate.getTime()) {
      streak++;
      currentDate = entryDate;
    } else {
      break; // Streak broken
    }
  }
  
  return streak;
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

// Helper function to generate insights from trends
function generateTrendInsights(trends, period) {
  if (trends.length < 3) {
    return [{
      type: 'trend_limited',
      title: 'Limited trend data',
      description: 'Write more journal entries to see mood patterns over time.'
    }];
  }
  
  const insights = [];
  
  // Calculate overall trend
  const scores = trends.map(t => t.score);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  const trendDifference = secondHalfAvg - firstHalfAvg;
  
  if (Math.abs(trendDifference) > 1) {
    insights.push({
      type: 'trend_direction',
      title: trendDifference > 0 ? 'Your mood is improving' : 'Your mood is declining',
      description: trendDifference > 0 
        ? `Over the past ${period} days, your overall mood shows an upward trend. Keep doing what you're doing!` 
        : `There's a downward trend in your mood over the past ${period} days. This might be a good time for self-care.`
    });
  } else {
    insights.push({
      type: 'trend_stable',
      title: 'Your mood is relatively stable',
      description: `Your mood has remained fairly consistent over the past ${period} days.`
    });
  }
  
  // Check for volatility
  const volatility = scores.reduce((sum, score, i) => {
    if (i === 0) return 0;
    return sum + Math.abs(score - scores[i-1]);
  }, 0) / (scores.length - 1);
  
  if (volatility > 2) {
    insights.push({
      type: 'trend_volatility',
      title: 'Your mood shows significant fluctuations',
      description: 'Your journal entries reveal notable mood swings. This emotional variability might be worth exploring.'
    });
  } else if (volatility < 0.5 && trends.length > 5) {
    insights.push({
      type: 'trend_consistency',
      title: 'Your mood is very consistent',
      description: 'Your emotional state remains quite stable across your journal entries.'
    });
  }
  
  return insights;
}
