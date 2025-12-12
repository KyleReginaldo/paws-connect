/**
 * OpenAI utility for generating event-related suggestions
 */

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function generateEventSuggestions(
  title: string, 
  description?: string | null
): Promise<string[] | null> {
  try {
    const postContent = description 
      ? `Post Title: ${title}\nPost Content: ${description}`
      : `Post: ${title}`;

    const systemPrompt = `You are a helpful assistant specialized in pet and animal care community posts. You help generate engaging questions for social media-style posts about pets, animals, shelters, and pet-related experiences.

Your task is to generate 3-5 short, engaging questions that encourage community interaction and support based on the post content provided.

Format your response as a JSON array of strings, like this:
["How can we help?", "Which shelter is this?", "Need donations?"]

Keep suggestions:
- Very short questions (3-6 words maximum)
- Question format ending with "?"
- Encouraging community engagement
- Supportive and caring tone
- Related to pets/animals/shelters only
- Prompting action or discussion

Examples of good suggestions for different post types:
For hunger/feeding posts: "How can we help?", "Need food donations?", "Which shelter?"
For adoption posts: "Still available?", "Any requirements?", "How to apply?"
For medical posts: "Need vet funds?", "How is recovery?", "Updates please?"
For lost pets: "Last seen where?", "Contact info?", "Still missing?"
For happy posts: "So adorable!", "More photos please?", "Success story?"

If the post is not related to pets or animals, respond with an empty array: []`;

    const userPrompt = `Generate engaging community questions for this pet-related post:

${postContent}

Create short questions that would encourage community members to engage, offer help, or show support. Keep each question under 6 words and end with "?". Focus on fostering community interaction and support.`;

    const requestBody: OpenAIRequest = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return null;
    }

    const data: OpenAIResponse = await response.json();
    const generatedContent = data.choices[0]?.message?.content;
    console.log('generated content:', generatedContent);
    if (!generatedContent) {
      return null;
    }

    // Try to parse the JSON response
    try {
      const suggestions = JSON.parse(generatedContent);
      if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
        return suggestions.slice(0, 5); // Limit to max 5 suggestions
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI suggestions as JSON:', parseError);
      
      // Fallback: try to extract suggestions from plain text
      const lines = generatedContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-•*]\s*/, '')) // Remove bullet points
        .slice(0, 5);
      
      return lines.length > 0 ? lines : null;
    }

    return null;
  } catch (error) {
    console.error('Error generating event suggestions:', error);
    return null;
  }
}

export async function regenerateEventSuggestions(
  postId: number,
  title: string,
  description?: string | null
): Promise<string[] | null> {
  const suggestions = await generateEventSuggestions(title, description);
  return suggestions;
}

/**
 * Extract payment information from payment proof image using OCR
 * @param imageBase64 - Base64 encoded image string (with data URL prefix)
 * @returns Extracted payment information (amount and reference number)
 */
export async function extractPaymentInfo(
  imageBase64: string
): Promise<{ amount: string | null; referenceNumber: string | null }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return { amount: null, referenceNumber: null };
    }

    const systemPrompt = `You are an OCR assistant specialized in extracting payment information from transaction receipts, payment proofs, bank transfer screenshots, e-wallet confirmations, and payment confirmations from services like GCash, PayMaya, PayPal, bank apps, etc.

Your task is to analyze the image and extract:
1. The transaction amount - Look for:
   - Amount, Total, Paid, Sent, Received
   - Currency symbols: PHP, ₱, $, USD
   - Numbers with decimals (e.g., 500.00, 1,234.56)
   - Could be labeled as "Amount Sent", "Total Amount", "Transfer Amount", etc.
   
2. The reference number - Look for:
   - Reference Number, Ref No, Transaction ID, Receipt No
   - Confirmation Number, Transaction Reference, Receipt ID
   - Alphanumeric codes (e.g., ABC123456, TXN-12345, 1234567890123)
   - Could be any unique identifier in the receipt

IMPORTANT:
- Extract ONLY the numeric value for amount (remove currency symbols, commas)
- Extract the complete reference/transaction number (include all characters)
- Look carefully at ALL text in the image, including small text
- If you see any numbers or codes that could be payment-related, extract them
- If a field is not found, return null for that field

Respond ONLY with a valid JSON object in this exact format:
{
  "amount": "500.00",
  "referenceNumber": "ABC123456789"
}

Examples:
{
  "amount": "1500",
  "referenceNumber": "TXN123456789"
}
{
  "amount": null,
  "referenceNumber": "REF987654"
}`;

    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract the payment amount and reference number from this payment proof image."
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    };

    console.log('[OCR] Calling OpenAI Vision API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Vision API error:', response.status, response.statusText, errorText);
      return { amount: null, referenceNumber: null };
    }

    const data: OpenAIResponse = await response.json();
    const generatedContent = data.choices[0]?.message?.content;
    
    console.log('[OCR] OpenAI response:', generatedContent);
    
    if (!generatedContent) {
      console.error('[OCR] No content in response');
      return { amount: null, referenceNumber: null };
    }

    // Parse the JSON response
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonContent = generatedContent.trim();
      
      // Remove markdown code blocks
      const jsonMatch = generatedContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      
      // Remove any leading/trailing text that's not part of JSON
      const jsonStartIndex = jsonContent.indexOf('{');
      const jsonEndIndex = jsonContent.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      console.log('[OCR] Attempting to parse JSON:', jsonContent);
      
      const extracted = JSON.parse(jsonContent);
      console.log('[OCR] Extracted data:', extracted);
      
      return {
        amount: extracted.amount || null,
        referenceNumber: extracted.referenceNumber || null
      };
    } catch (parseError) {
      console.error('[OCR] Failed to parse response:', parseError);
      console.error('[OCR] Raw content:', generatedContent);
      
      // Fallback: Try to extract values manually
      try {
        const amountMatch = generatedContent.match(/"amount"\s*:\s*"?([0-9.,]+)"?/i);
        const refMatch = generatedContent.match(/"referenceNumber"\s*:\s*"?([A-Za-z0-9-]+)"?/i);
        
        if (amountMatch || refMatch) {
          console.log('[OCR] Using fallback extraction');
          return {
            amount: amountMatch ? amountMatch[1] : null,
            referenceNumber: refMatch ? refMatch[1] : null
          };
        }
      } catch (fallbackError) {
        console.error('[OCR] Fallback extraction also failed:', fallbackError);
      }
      
      return { amount: null, referenceNumber: null };
    }
  } catch (error) {
    console.error('Error extracting payment info:', error);
    return { amount: null, referenceNumber: null };
  }
}