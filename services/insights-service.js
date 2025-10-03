import analyzeJournal from '../utils/insights.js';

// Calculate mood distribution across journal entries
export const calculateMoodDistribution = (journals) => {
  const distribution = { Positive: 0, Negative: 0, Neutral: 0 };
  
  journals.forEach(journal => {
    const { mood } = analyzeJournal(journal.content);
    distribution[mood]++;
  });
  
  return distribution;
};

// Calculate mood trends over time
export const calculateMoodTrends = (journals) => {
  return journals.map(journal => {
    const { mood, score, intensity } = analyzeJournal(journal.content);
    return {
      date: journal.createdAt,
      mood,
      score,
      intensity
    };
  });
};

// Find common words/topics across journal entries
export const calculateCommonWords = (journals) => {
  const stopWords = new Set([
    'the', 'and', 'a', 'to', 'of', 'in', 'that', 'is', 'was', 'for',
    'with', 'this', 'on', 'my', 'it', 'at', 'be', 'have', 'had', 'were',
    'are', 'but', 'not', 'they', 'from', 'has', 'by', 'an', 'as', 'me',
    'their', 'i', 'am', 'be', 'been', 'being', 'do', 'does', 'did',
    'doing', 'very', 'just', 'should', 'would', 'could', 'can'
  ]);

  const wordCounts = {};
  
  journals.forEach(journal => {
    const words = journal.content
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 3 && !stopWords.has(word)); // Filter out short words and stop words
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  // Sort by frequency and take top 10
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
};

// Generate pattern insights across journals
export const generatePatternInsights = (journals) => {
  if (journals.length < 2) {
    return [{
      type: 'general',
      title: 'Not enough entries for pattern analysis',
      description: 'Write more journal entries to receive pattern insights.'
    }];
  }

  const insights = [];
  const moodCounts = { Positive: 0, Negative: 0, Neutral: 0 };
  const topicFrequency = {};
  const timeOfDayMoods = { morning: [], afternoon: [], evening: [], night: [] };
  const dayOfWeekMoods = Array(7).fill().map(() => []);
  
  // Calculate day-to-day mood changes
  const moodChanges = [];
  
  // Track most common words by mood
  const moodWords = {
    Positive: {},
    Negative: {},
    Neutral: {}
  };

  // Analyze each journal
  journals.forEach((journal, index) => {
    const journalDate = new Date(journal.createdAt);
    const analysis = analyzeJournal(journal.content);
    
    // Count moods
    moodCounts[analysis.mood]++;
    
    // Track time of day
    const hour = journalDate.getHours();
    let timeOfDay;
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    timeOfDayMoods[timeOfDay].push(analysis.mood);
    
    // Track day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = journalDate.getDay();
    dayOfWeekMoods[dayOfWeek].push(analysis.mood);
    
    // Track topic frequency
    analysis.rawData.topWords.forEach(word => {
      topicFrequency[word] = (topicFrequency[word] || 0) + 1;
    });
    
    // Track words by mood
    analysis.rawData.topWords.forEach(word => {
      moodWords[analysis.mood][word] = (moodWords[analysis.mood][word] || 0) + 1;
    });
    
    // Track mood changes day-to-day
    if (index < journals.length - 1) {
      const nextAnalysis = analyzeJournal(journals[index + 1].content);
      const nextDate = new Date(journals[index + 1].createdAt);
      
      // Only consider consecutive days
      const dayDiff = Math.round((journalDate - nextDate) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1 || dayDiff === -1) {
        moodChanges.push({
          from: nextAnalysis.mood,
          to: analysis.mood
        });
      }
    }
  });

  // Generate insight about dominant mood
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
  const dominantMoodPercentage = Math.round((moodCounts[dominantMood] / journals.length) * 100);
  
  insights.push({
    type: 'pattern_mood',
    title: `Your dominant mood is ${dominantMood}`,
    description: `${dominantMoodPercentage}% of your journal entries reflect a ${dominantMood.toLowerCase()} mood. ${
      dominantMood === 'Positive' ? 'This suggests you generally maintain a positive outlook.' : 
      dominantMood === 'Negative' ? 'This might indicate ongoing challenges that deserve attention.' :
      'This balanced perspective may reflect thoughtful processing of your experiences.'
    }`
  });

  // Generate insight about time of day patterns
  const timeOfDayAnalysis = {};
  Object.entries(timeOfDayMoods).forEach(([timeOfDay, moods]) => {
    if (moods.length > 0) {
      const moodCounts = moods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {});
      
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
      const percentage = Math.round((moodCounts[dominantMood] / moods.length) * 100);
      
      timeOfDayAnalysis[timeOfDay] = {
        dominantMood,
        percentage,
        count: moods.length
      };
    }
  });
  
  // Find time of day with most entries
  const mostActiveTime = Object.entries(timeOfDayAnalysis)
    .sort((a, b) => b[1].count - a[1].count)[0];
  
  if (mostActiveTime && mostActiveTime[1].count >= 3) {
    insights.push({
      type: 'pattern_time',
      title: `You journal most often in the ${mostActiveTime[0]}`,
      description: `You tend to write in the ${mostActiveTime[0]} and your mood during this time is usually ${mostActiveTime[1].dominantMood.toLowerCase()} (${mostActiveTime[1].percentage}% of entries).`
    });
  }
  
  // Generate insight about day of week patterns
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAnalysis = dayOfWeekMoods.map((moods, index) => {
    if (moods.length > 0) {
      const moodCounts = moods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {});
      
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
      
      return {
        day: dayNames[index],
        dominantMood,
        count: moods.length
      };
    }
    return null;
  }).filter(Boolean);
  
  const bestDay = dayAnalysis
    .filter(day => day.dominantMood === 'Positive')
    .sort((a, b) => b.count - a.count)[0];
    
  const worstDay = dayAnalysis
    .filter(day => day.dominantMood === 'Negative')
    .sort((a, b) => b.count - a.count)[0];
  
  if (bestDay && bestDay.count >= 2) {
    insights.push({
      type: 'pattern_day',
      title: `${bestDay.day} seems to be your best day`,
      description: `Your journal entries on ${bestDay.day}s tend to be more positive than other days.`
    });
  }
  
  if (worstDay && worstDay.count >= 2) {
    insights.push({
      type: 'pattern_day',
      title: `${worstDay.day} appears to be more challenging`,
      description: `You tend to express more negative feelings in your journal entries on ${worstDay.day}s.`
    });
  }

  // Generate insight about recurring topics
  const topTopics = Object.entries(topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);
  
  if (topTopics.length >= 2) {
    insights.push({
      type: 'pattern_topics',
      title: 'Recurring topics in your journal',
      description: `You frequently write about ${formatList(topTopics)}. These recurring themes may represent important aspects of your life.`
    });
  }

  // Generate insight about mood triggers
  const positiveTopics = Object.entries(moodWords.Positive)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([topic]) => topic);
    
  const negativeTopics = Object.entries(moodWords.Negative)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([topic]) => topic);
  
  if (positiveTopics.length > 0) {
    insights.push({
      type: 'pattern_positive_triggers',
      title: 'Topics linked to positive moods',
      description: `When you write about ${formatList(positiveTopics)}, your entries tend to be more positive. These topics might boost your mood.`
    });
  }
  
  if (negativeTopics.length > 0) {
    insights.push({
      type: 'pattern_negative_triggers',
      title: 'Topics linked to negative moods',
      description: `Writing about ${formatList(negativeTopics)} often appears in your more negative entries. Being aware of these triggers can help manage their impact.`
    });
  }

  // Analyze mood transitions
  if (moodChanges.length >= 3) {
    const positiveToNegative = moodChanges.filter(c => c.from === 'Positive' && c.to === 'Negative').length;
    const negativeToPositive = moodChanges.filter(c => c.from === 'Negative' && c.to === 'Positive').length;
    
    if (positiveToNegative > negativeToPositive && positiveToNegative > 1) {
      insights.push({
        type: 'pattern_mood_swings',
        title: 'Mood recovery pattern observed',
        description: 'Your mood tends to shift from positive to negative more often than the reverse. This may suggest sensitivity to setbacks.'
      });
    } else if (negativeToPositive > positiveToNegative && negativeToPositive > 1) {
      insights.push({
        type: 'pattern_mood_swings',
        title: 'Resilience pattern observed',
        description: 'You often bounce back from negative moods to positive ones. This suggests good emotional resilience.'
      });
    }
  }
  
  return insights;
};

// Helper function to format a list of words
function formatList(words) {
  if (!words || words.length === 0) return '';
  if (words.length === 1) return `"${words[0]}"`;
  if (words.length === 2) return `"${words[0]}" and "${words[1]}"`;
  return words.slice(0, -1).map(word => `"${word}"`).join(', ') + `, and "${words[words.length - 1]}"`;
}
