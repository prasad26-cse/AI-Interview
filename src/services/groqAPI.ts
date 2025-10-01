// Groq API implementation
import { Difficulty, Question, Answer } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// SENSITIVE: API endpoint for Groq service
// const API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const API_ENDPOINT = process.env.VITE_GROQ_API_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';

let apiKey: string | null = null;

export function setGroqApiKey(key: string) {
  apiKey = key;
}

export function isGroqApiInitialized(): boolean {
  return apiKey !== null;
}

const DIFFICULTY_TIME_MAP: Record<Difficulty, number> = {
  easy: 20,
  medium: 60,
  hard: 120,
};

async function callGroqAPI(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key not set');
  }

  // SENSITIVE: API call with authorization header
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Authorization header uses the API key set by user
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // Using Groq's fast LLaMA model
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Groq API Error:', error);
    
    try {
      const errorData = JSON.parse(error);
      if (errorData.error?.message) {
        throw new Error(`Groq API: ${errorData.error.message}`);
      }
    } catch (e) {
      // If parsing fails, throw original error
    }
    
    throw new Error(`API Error: ${response.status} - Please check your Groq API key at https://console.groq.com/`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid response from Groq API');
  }
  
  return data.choices[0].message.content;
}

export async function generateQuestionDirect(difficulty: Difficulty, resumeContent?: string): Promise<Question> {
  const resumeContext = resumeContent 
    ? `\n\nCandidate's Resume Content:\n${resumeContent.substring(0, 3000)}\n\nIMPORTANT INSTRUCTIONS:
- ONLY ask questions about skills/technologies/projects that are EXPLICITLY mentioned in the resume above
- DO NOT assume or infer skills that are not clearly stated
- DO NOT ask about technologies not mentioned in the resume
- Extract actual project names and technologies from the text above
- If you cannot find clear skills or projects, ask general full-stack questions`
    : '';

  const prompt = `You are a senior full-stack interviewer for React/Node roles.
Generate 1 SHORT interview question at difficulty: ${difficulty.toUpperCase()}.${resumeContext}

CRITICAL REQUIREMENTS:
- Question must be MAXIMUM 2 LINES (1-2 short sentences)
- ONLY ask about content EXPLICITLY present in the resume
- DO NOT make assumptions about skills not mentioned
- Generate questions from what you can CLEARLY see in the resume:
  A) SKILLS: Technologies/tools explicitly listed (React, Node, MongoDB, etc.)
  B) PROJECTS: Actual project names and descriptions mentioned
- If resume has skills, ask about those specific technologies
- If resume has projects, ask about those specific projects
- Focus on ONE concept at a time - keep it simple and direct
- NO coding questions, NO code snippets
- Question should be clear and easy to answer verbally

Examples of SKILLS-based questions (only if skill is in resume):
- "What is the difference between useEffect and useLayoutEffect in React?"
- "Explain how JWT authentication works."
- "What are the benefits of using MongoDB over SQL databases?"

Examples of PROJECT-based questions (only if project is in resume):
- "In your [PROJECT NAME] project, how did you handle user authentication?"
- "What challenges did you face while building [SPECIFIC FEATURE]?"
- "Why did you choose [TECHNOLOGY] for [PROJECT NAME]?"

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "text": "short question (maximum 2 lines)",
  "rubric": "key points expected in answer",
  "gradingHints": "scoring criteria"
}`;

  try {
    const responseText = await callGroqAPI(prompt);
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanText);

    return {
      id: uuidv4(),
      text: data.text,
      difficulty,
      timeLimitSec: DIFFICULTY_TIME_MAP[difficulty],
      rubric: data.rubric,
      gradingHints: data.gradingHints,
    };
  } catch (error) {
    console.error('Failed to generate question:', error);
    throw error;
  }
}

export async function gradeAnswerDirect(
  question: Question,
  answer: Answer
): Promise<{ score: number; feedback: string }> {
  const hasRecording = answer.recordingBlobId ? true : false;
  const recordingNote = hasRecording 
    ? '\n\nNOTE: Candidate also provided a video/audio recording. Be lenient - they may have explained more verbally.'
    : '\n\nNOTE: Candidate provided ONLY written text (no recording).';

  const prompt = `You are grading a technical interview answer. Grade objectively based on what is written.

Question: ${question.text}
Expected Answer Points: ${question.rubric}
Grading Criteria: ${question.gradingHints}

Candidate's Written Answer: 
${answer.text || '(No written answer provided)'}
${recordingNote}

GRADING INSTRUCTIONS:
- Score from 0-10 based on the WRITTEN answer
- If answer is empty/minimal and there's a recording, give 5/10 (assume verbal explanation)
- If answer is empty with NO recording, give 0-2/10
- Feedback should be 2-3 SHORT bullet points (no asterisks, no markdown)
- Focus on what's GOOD and what's MISSING
- Be constructive and specific

CRITICAL: Return ONLY valid JSON with NO markdown formatting:
{"score": 7, "feedback": "Good explanation of X. Missing details about Y. Could improve Z."}`;

  try {
    const responseText = await callGroqAPI(prompt);
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanText);

    // Clean up feedback - remove markdown formatting
    let cleanFeedback = data.feedback || '';
    cleanFeedback = cleanFeedback
      .replace(/\*/g, '') // Remove asterisks
      .replace(/^[\s-]*•[\s]*/gm, '- ') // Replace bullets with dashes
      .replace(/^[\s]*\*[\s]*/gm, '- ') // Replace asterisk bullets with dashes
      .trim();

    return {
      score: Math.max(0, Math.min(10, parseInt(data.score))),
      feedback: cleanFeedback,
    };
  } catch (error) {
    console.error('Failed to grade answer:', error);
    return {
      score: 5,
      feedback: 'Unable to grade automatically. Manual review recommended.',
    };
  }
}

export async function generateFinalSummaryDirect(
  answers: Answer[],
  questions: Question[]
): Promise<{ finalScore: number; summary: string }> {
  const qaContext = answers
    .map((ans, idx) => {
      const q = questions.find((qu) => qu.id === ans.questionId);
      return `Q${idx + 1} [${q?.difficulty}]: ${q?.text}\nAnswer: ${ans.text || '(No answer)'}\nScore: ${ans.llmScore || 0}/10\nFeedback: ${ans.llmFeedback || 'N/A'}`;
    })
    .join('\n\n');

  const prompt = `You are a senior technical interviewer. Based on the following interview performance, provide:
1. A final overall score (0-100)
2. A brief summary of strengths and areas for improvement

Interview Performance:
${qaContext}

Return ONLY valid JSON: {"finalScore": 0-100, "summary": "brief summary text"}`;

  try {
    const responseText = await callGroqAPI(prompt);
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanText);

    return {
      finalScore: Math.max(0, Math.min(100, parseInt(data.finalScore))),
      summary: data.summary,
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    const avgScore = answers.reduce((sum, ans) => sum + (ans.llmScore || 0), 0) / answers.length;
    const finalScore = Math.round((avgScore / 10) * 100);
    return {
      finalScore,
      summary: 'Interview completed. Manual review recommended for detailed feedback.',
    };
  }
}
