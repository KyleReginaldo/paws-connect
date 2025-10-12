// Content moderation using Gemini AI
export interface ModerationResult {
  isInappropriate: boolean;
  confidence: number;
  reason?: string;
  categories?: string[];
}

export async function moderateContent(message: string, apiKey: string): Promise<ModerationResult> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please analyze the following message for inappropriate content including verbal abuse, hate speech, harassment, threats, profanity, or any harmful language. This includes content in English, Tagalog, Bisaya, Cebuano, and other Filipino languages. 

Pay special attention to Filipino curse words like: putang ina, gago, tanga, bobo, yawa, buang, peste, etc.

Respond ONLY with a JSON object in this exact format:

{
  "isInappropriate": boolean,
  "confidence": number (0-1),
  "reason": "brief explanation if inappropriate",
  "categories": ["array of violation types if any"]
}

Message to analyze: "${message}"`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Try to parse the JSON response
    try {
      const result = JSON.parse(generatedText.trim());
      return {
        isInappropriate: result.isInappropriate || false,
        confidence: result.confidence || 0,
        reason: result.reason,
        categories: result.categories || []
      };
    } catch {
      console.error('Failed to parse Gemini response:', generatedText);
      // Fallback to simple keyword detection
      return fallbackModeration(message);
    }

  } catch (error) {
    console.error('Content moderation error:', error);
    // Fallback to simple keyword detection if API fails
    return fallbackModeration(message);
  }
}

// Fallback moderation using simple keyword detection
function fallbackModeration(message: string): ModerationResult {
  const abusiveWords = [
    // English curse words
    'damn', 'hell', 'stupid', 'idiot', 'moron', 'fool', 'loser', 'hate',
    'kill yourself', 'die', 'worthless', 'pathetic', 'disgusting', 'trash',
    'garbage', 'scum', 'piece of shit', 'bastard', 'bitch', 'asshole',
    'fuck', 'shit', 'crap', 'piss', 'slut', 'whore', 'retard', 'faggot',
    'ugly', 'fat', 'dumb', 'retarded', 'nigga', 'negro',
    
    // Tagalog curse words
    'putang ina', 'putangina', 'puta', 'gago', 'gaga', 'ulol', 'tanga',
    'bobo', 'tarantado', 'kupal', 'kingina', 'leche', 'peste', 'buwisit',
    'hayop', 'animal', 'inutil', 'walang kwenta', 'walang hiya', 'pakyu',
    'fuck you', 'tangina', 'punyeta', 'hinayupak', 'hudas', 'demonyo',
    'syet', 'shit', 'bwisit', 'lintek', 'pucha', 'putek', 'amputa',
    'tangina mo', 'gago ka', 'bobo mo', 'tanga mo', 'pokpok', 'bayot',
    
    // Bisaya/Cebuano curse words
    'yawa', 'piste', 'buang', 'bogo', 'bugo', 'animal ka', 'putang',
    'atay', 'kayata', 'pakyaw', 'giatay', 'anak sa puta', 'putragis',
    'bugoy', 'tarugo', 'lintian', 'patay', 'yudiputa', 'yudeputa',
    'bilat', 'itlog', 'bayot ka', 'bading', 'bakla', 'gunggong',
    
    // Other Filipino regional curse words
    'walanghiya', 'pokpok', 'suso', 'tite', 'pekpek', 'betlog', 'oten',
    'kantot','kantut', 'jakol', 'chupa', 'supsop', 'libog', 'malibog', 'bastos',
    'manyak', 'salsal', 'torjak', 'bruha', 'mangkukulam', 'demonyo ka',
    
    // Common Filipino internet slang curses
    'ampota', 'potangina', 'potang', 'ina mo', 'linta', 'peste ka',
    'hudas ka', 'sira ulo', 'gunggong', 'loko', 'loka', 'praning',
    
    // Mixed/Code-switched curses
    'putang ina mo', 'gago kang', 'bobo kang', 'tanga kang', 'fuck ka',
    'shit ka', 'walang utak', 'sira ka', 'loko ka', 'praning ka'
  ];

  const lowerMessage = message.toLowerCase();
  const foundWords = abusiveWords.filter(word => lowerMessage.includes(word.toLowerCase()));
  
  return {
    isInappropriate: foundWords.length > 0,
    confidence: foundWords.length > 0 ? 0.8 : 0,
    reason: foundWords.length > 0 ? 'This message contains language that violates our community guidelines. Please avoid using foul or offensive words.' : undefined,
    categories: foundWords.length > 0 ? ['profanity'] : []
  };
}

// Get standardized warning message
export function getStandardWarningMessage(): string {
  return 'This message contains language that violates our community guidelines. Please avoid using foul or offensive words.';
}

// Cache moderation results to avoid repeated API calls for the same message
const moderationCache = new Map<string, ModerationResult>();

export async function moderateContentWithCache(message: string, apiKey: string): Promise<ModerationResult> {
  const cacheKey = message.toLowerCase().trim();
  
  if (moderationCache.has(cacheKey)) {
    return moderationCache.get(cacheKey)!;
  }

  const result = await moderateContent(message, apiKey);
  moderationCache.set(cacheKey, result);
  
  return result;
}