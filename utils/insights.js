import Sentiment from "sentiment";

const sentiment = new Sentiment();

const analyzeJournal = (journal) => {
    // Exit early if journal is empty
    if (!journal || journal.trim() === '') {
        return {
            mood: 'Unknown',
            score: 0,
            intensity: 0,
            keyWords: [],
            possibleTriggers: [],
            wordCount: 0,
            feedback: 'No content to analyze.',
            insights: []
        };
    }

    const result = sentiment.analyze(journal);

    // Determine mood based on score
    let mood;
    if (result.score > 2) {
        mood = "Positive";
    } else if (result.score < -2) {
        mood = "Negative";
    } else {
        mood = "Neutral";
    }

    // Calculate intensity of sentiment
    const intensity = Math.abs(result.score) / 5; // Normalized to a 0-1 scale
    
    // Extract words by sentiment
    const positiveWords = result.positive;
    const negativeWords = result.negative;
    
    // Identify key words that might be triggers or topics
    const keyWords = [...positiveWords, ...negativeWords].slice(0, 5);
    
    // Extract possible triggers (negative terms)
    const possibleTriggers = negativeWords.slice(0, 3);
    
    // Extract topics using natural language processing (simplified approach)
    const words = journal.toLowerCase().split(/\W+/).filter(word => 
        word.length > 3 && !['this', 'that', 'then', 'than', 'with', 'would', 'could', 'should', 'have', 'what'].includes(word)
    );
    
    const wordFrequency = {};
    words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
    
    // Generate dynamic insights based on actual content
    const insights = [];
    
    // Insight 1: Overall mood
    insights.push({
        type: 'mood',
        title: `Your writing reflects a ${mood.toLowerCase()} mood`,
        description: generateMoodInsight(mood, intensity)
    });
    
    // Insight 2: Topics of focus
    if (topWords.length > 0) {
        insights.push({
            type: 'topics',
            title: 'Main topics in your writing',
            description: `You focused on topics like ${formatList(topWords)}. ${
                mood === 'Positive' ? 'These topics appear to bring positive energy to your writing.' :
                mood === 'Negative' ? 'Consider how these topics affect your emotional state.' :
                'Your perspective on these topics appears balanced.'
            }`
        });
    }
    
    // Insight 3: Emotional triggers (if negative)
    if (negativeWords.length > 0 && mood === 'Negative') {
        insights.push({
            type: 'triggers',
            title: 'Potential emotional triggers',
            description: `Words like ${formatList(negativeWords.slice(0, 3))} suggest possible sources of concern. Recognizing these triggers is the first step toward addressing them.`
        });
    }
    
    // Insight 4: Positive elements (if present)
    if (positiveWords.length > 0) {
        insights.push({
            type: 'strengths',
            title: 'Positive elements in your writing',
            description: `Terms like ${formatList(positiveWords.slice(0, 3))} highlight positive aspects that you might want to focus on more.`
        });
    }
    
    // Insight 5: Writing style
    const sentenceCount = journal.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = words.length / (sentenceCount || 1);
    
    if (avgSentenceLength > 20) {
        insights.push({
            type: 'style',
            title: 'Writing style observation',
            description: 'You tend to write in longer, more complex sentences, which suggests detailed thinking about your experiences.'
        });
    } else if (avgSentenceLength < 10) {
        insights.push({
            type: 'style',
            title: 'Writing style observation',
            description: 'Your writing style is concise and direct, focusing on key points rather than elaborate descriptions.'
        });
    }
    
    // Insight 6: Expression intensity
    if (intensity > 0.7) {
        insights.push({
            type: 'intensity',
            title: 'Strong emotional expression',
            description: 'Your writing contains strong emotional language, suggesting these experiences have significant impact on you.'
        });
    } else if (intensity < 0.3) {
        insights.push({
            type: 'intensity',
            title: 'Measured expression',
            description: 'You express yourself in a measured, moderate way, which may reflect careful consideration of your experiences.'
        });
    }

    return {
        mood,
        score: result.score,
        intensity,
        keyWords,
        possibleTriggers,
        wordCount: journal.split(/\s+/).length,
        insights,
        rawData: {
            positive: positiveWords,
            negative: negativeWords,
            comparative: result.comparative,
            topWords
        }
    };
};

// Helper function to generate mood-specific insights
function generateMoodInsight(mood, intensity) {
    const intensityDesc = intensity > 0.7 ? 'strongly' : intensity > 0.3 ? 'moderately' : 'mildly';
    
    switch (mood) {
        case 'Positive':
            return `You express yourself in a ${intensityDesc} positive way. This suggests you're experiencing events or thoughts that bring you joy or satisfaction.`;
        case 'Negative':
            return `Your writing reflects a ${intensityDesc} negative perspective. This may indicate challenges or concerns you're currently processing.`;
        default:
            return `Your writing has a balanced, neutral tone. This could reflect either mixed emotions or a thoughtful, measured approach to your experiences.`;
    }
}

// Helper function to format a list of words
function formatList(words) {
    if (!words || words.length === 0) return '';
    if (words.length === 1) return `"${words[0]}"`;
    if (words.length === 2) return `"${words[0]}" and "${words[1]}"`;
    return words.slice(0, -1).map(word => `"${word}"`).join(', ') + `, and "${words[words.length - 1]}"`;
}

export default analyzeJournal;