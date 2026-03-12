import { VerificationResult, Riddle } from "../models/GameModels";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AIManager - Orchestrates AI services for the app.
 * Uses Gemini as primary with Groq fallback.
 */
class AIManager {
    constructor() {
        this.geminiAi = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
        this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY || "";
    }

    /**
     * Generates a new daily riddle.
     */
    async generateDailyRiddle(category = "general") {
        const prompt = `
            Generate a clever riddle for a scavenger hunt about a common item found in ${category}.
            The riddle should be mysterious but solvable by finding a real-world object.
            
            Return JSON only:
            {
              "text": "The riddle text",
              "answer": "The core object name",
              "difficulty": 1-5
            }
        `;

        try {
            if (!this.geminiAi.apiKey) throw new Error("Gemini API Key missing");
            console.log("Generating riddle with Gemini AI...");
            const model = this.geminiAi.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            return this.parseRiddleResponse(responseText, category);
        } catch (e) {
            console.warn("Gemini AI riddle generation failed:", e.message);
            // Fallback to Groq
            try {
                if (!this.groqApiKey) throw new Error("Groq API Key missing");
                console.log("Trying Groq for riddle generation...");
                // Fast fallback for text generation
                const responseText = await this.groqTextCompletion(prompt);
                return this.parseRiddleResponse(responseText, category);
            } catch (groqError) {
                console.error("Groq riddle generation also failed:", groqError.message);
                console.log("Using built-in sample riddle as fallback.");
                return Riddle.SAMPLE;
            }
        }
    }

    /**
     * Verifies if the image answers the riddle.
     */
    async verifyAnswer(base64Image, riddle) {
        const prompt = `
            You are a playful and witty scavenger hunt judge for the game "Prompt Hunter". 
            Your goal is to be "unpredictably fair":
            - Sometimes accept creative or abstract interpretations if they are clever.
            - Sometimes be strict about exact matches if the riddle implies it.
            - Always return valid JSON ONLY. Do not wrap in markdown tags like \`\`\`json.
            - IMPORTANT: If the user's answer is WRONG, your feedback message must say what they found instead, and give a small hint for the correct answer. (eg. "That is a person, not the answer! Hint: Look for something you can sit on.")
            - If the user's answer is CORRECT, provide a witty, engaging feedback message (1-2 sentences).

            Riddle: "${riddle.text}"
            Target object (approximate): "${riddle.answer}"

            Task: Analyze the provided image. Does it answer the riddle?
            Output strict JSON in this exact format ONLY, nothing else:
            {
              "isCorrect": boolean,
              "feedback": "your witty response or hint here"
            }
        `;

        try {
            if (!this.geminiAi.apiKey) throw new Error("Gemini API Key missing");
            console.log("Attempting verification with Gemini AI...");
            const model = this.geminiAi.getGenerativeModel({ model: "gemini-2.0-flash" });

            const imageParts = [
                {
                    inlineData: {
                        data: base64Image.split(",")[1], // Remove data URL prefix
                        mimeType: "image/jpeg"
                    }
                }
            ];

            const result = await model.generateContent([prompt, ...imageParts]);
            const responseText = result.response.text();
            return this.parseVerificationResponse(responseText);

        } catch (e) {
            console.warn("Gemini AI verification failed:", e.message);

            console.log("Attempting Groq fallback for verification...");
            return await this.tryGroqFallback(base64Image, prompt);
        }
    }

    /**
     * Fallback using Groq LLM API.
     */
    async tryGroqFallback(base64Image, prompt) {
        try {
            if (!this.groqApiKey) throw new Error("Groq API Key missing");
            const responseText = await this.groqVisionCompletion(base64Image, prompt);
            const result = this.parseVerificationResponse(responseText);
            return new VerificationResult(result.isCorrect, result.feedback + " [via Groq]");
        } catch (e) {
            console.error("Groq fallback failed:", e.message);
            // Mock response if both fail
            console.log("Returning mock verification response");
            return new VerificationResult(
                true,
                "Looks like you found it! (Mock response as AI providers are missing/failing: " + e.message.substring(0, 30) + "...)"
            );
        }
    }

    async groqTextCompletion(prompt) {
        const requestBody = {
            model: "llama3-8b-8192", // Fast text model
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1024,
        };

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`Groq Error: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;
    }

    async groqVisionCompletion(base64Image, prompt) {
        // Ensure the base64 string has the correct data URL prefix
        const imageStr = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;

        const requestBody = {
            model: "meta-llama/llama-4-scout-17b-16e-instruct", // Model used in Android app
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageStr } }
                    ]
                }
            ],
            temperature: 0.7,
            max_tokens: 1024
        };

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`Groq Error: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;
    }

    extractJson(text) {
        // Find the first { and the last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return "{}";
    }

    parseVerificationResponse(text) {
        try {
            console.log("Raw AI Response:", text);
            const cleanJson = this.extractJson(text);
            const parsed = JSON.parse(cleanJson);
            return new VerificationResult(parsed.isCorrect || false, parsed.feedback || "I'm speechless!");
        } catch (e) {
            console.error("Failed to parse verification response:", text);
            return new VerificationResult(false, "Failed to parse AI response. It didn't speak JSON!");
        }
    }

    parseRiddleResponse(text, category) {
        try {
            const cleanJson = this.extractJson(text);
            const parsed = JSON.parse(cleanJson);
            return new Riddle(
                "id_" + Date.now(),
                parsed.text || "I have legs but cannot walk.",
                parsed.answer || "chair",
                parsed.difficulty || 1,
                category
            );
        } catch (e) {
            return Riddle.SAMPLE;
        }
    }
}

export default new AIManager();
