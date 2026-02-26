import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, quizAnswers } = await req.json();

    const prompt = `You are a career counselor AI. Analyze the user's interests and return career recommendations.

User's interests: "${text}"
${quizAnswers?.workStyle ? `Work style preference: ${quizAnswers.workStyle}` : ''}
${quizAnswers?.environment ? `Environment preference: ${quizAnswers.environment}` : ''}
${quizAnswers?.education ? `Education preference: ${quizAnswers.education}` : ''}

Return a JSON object with this exact structure (no markdown, just raw JSON):
{
  "careers": [
    {
      "id": "unique-id",
      "title": "Career Title",
      "category": "Category (one of: Healthcare, Tech, Creative, Legal, Education, Science, Business, Trades)",
      "keywords": ["relevant", "keywords"],
      "education": "Required Education",
      "salary": "$XXK–$XXK",
      "workStyle": "Work Style",
      "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
      "color": "hsl(hue, saturation%, lightness%)",
      "matchPercentage": 85,
      "matchReason": "Specific reason why this matches the user's interests"
    }
  ],
  "keywordsDetected": ["keyword1", "keyword2"],
  "categories": [{"name": "Category", "percentage": 40}],
  "personality": ["Trait 1", "Trait 2", "Trait 3"]
}

Return exactly 6-8 careers sorted by matchPercentage (highest first). Match percentages should range from 95 to 45. Be specific in matchReason referencing what the user said.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
