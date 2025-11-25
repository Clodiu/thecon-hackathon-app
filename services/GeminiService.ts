const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

// Folosim API-ul v1, care este compatibil cu modelul gemini-1.5-flash
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const generateLocationVibe = async (
  name: string,
  address: string,
  currentDesc: string
): Promise<string | null> => {
  
  if (!GEMINI_API_KEY) {
    console.error("❌ [EROARE] Cheia API lipsește din .env");
    return null;
  }

  // 1. Prompt-ul (Instrucțiunea)
  const prompt = `
    You are a local urban guide. Creatively rewrite the description for: "${name}", address: "${address}".
    Technical description: "${currentDesc}".
    
    Your task:
    Write a short (max 100 words), attractive text, full of good "vibe".
    Use emojis. Respond in English.
  `;

  try {
    // 2. Apelul API direct (fără diagnosticare)
    const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    // Verificăm erorile
    if (data.error) {
      console.error("🔥 Eroare API:", JSON.stringify(data.error, null, 2));
      return null;
    }

    // Returnăm textul
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }

    return null;

  } catch (error) {
    console.error("☠️ Eroare Rețea:", error);
    return null;
  }
};

export const generateChatResponse = async (
  history: Message[],
  locationsList: string
): Promise<string | null> => {
  if (!GEMINI_API_KEY) {
    console.error("❌ [EROARE] Cheia API lipsește din .env");
    return null;
  }

  const systemInstruction = {
    role: "system",
    parts: [{
      text: `You are a friendly AI assistant in an urban exploration app. Answer the user's questions in English, using the information below to make recommendations.
      When you recommend a location, use the EXACT NAME from the list. Do not invent locations.
      
      List of available locations (with details):
      - ${locationsList}
      ${locationsList}
      
      Analyze the user's request and search the description, address, or rating to find the most suitable location.
      Good response example if the user asks "a place with a rating over 4.5": "Certainly! I recommend Beans & Dots, it has an excellent rating of 4.8/5. ☕️"
      Bad response example: "You can try the Beans and Dots cafe." (the name is not exact)
      
      Be concise and use emojis to make the conversation more engaging.`
    }]
  };

  try {
    const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [...history],
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("🔥 Eroare API Chat:", JSON.stringify(data.error, null, 2));
      return "Oops! I encountered an error. Please try again.";
    }

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    return "I couldn't generate a response. Please rephrase the question.";
  } catch (error) {
    console.error("☠️ Eroare Rețea Chat:", error);
    return "It seems I'm having connection issues. Please check your network and try again.";
  }
};