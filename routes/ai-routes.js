import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Category-based system prompts
const categoryPrompts = {
  general: "You are a warm, friendly AI mental health assistant. Offer general guidance and emotional support.",
  anxiety: "You are an AI assistant specialized in helping with anxiety. Respond calmly and suggest coping techniques like breathing, grounding, or journaling.",
  depression: "You are an AI assistant helping with depression. Be empathetic and provide gentle, uplifting suggestions.",
  stress: "You are an AI assistant for stress management. Share stress-relief exercises, relaxation tips, and healthy routines.",
  mindfulness: "You are an AI assistant guiding mindfulness and meditation. Encourage awareness, calmness, and guided breathing exercises."
};

// Retry wrapper for Gemini API
async function generateWithRetry(prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.status === 503 && i < retries - 1) {
        console.warn(`Gemini overloaded. Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}

router.post("/chat", async (req, res) => {
  try {
    const { category, message } = req.body;

    if (!message || !category) {
      return res.status(400).json({ error: "Message and category are required" });
    }

    const basePrompt =
      categoryPrompts[category.toLowerCase()] || categoryPrompts.general;

    const prompt = `${basePrompt} \n User: ${message} \n AI:`;

    const aiReply = await generateWithRetry(prompt);

    res.json(aiReply);
    
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({
      error:
        error.status === 503
          ? "AI service is temporarily overloaded. Please try again in a few seconds."
          : "Failed to generate AI response. Please try again.",
    });
  }
});

export default router;
