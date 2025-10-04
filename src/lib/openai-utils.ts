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