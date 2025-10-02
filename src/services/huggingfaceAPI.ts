// Hugging Face API implementation
import { Difficulty, Question, Answer } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Hugging Face API Configuration
// Note: Currently using template-based generation. Uncomment callHuggingFaceAPI to use these.
// const API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
// const BASE_URL = 'https://api-inference.huggingface.co/models';
// const CHAT_MODEL = 'microsoft/DialoGPT-large';

export function setHuggingFaceApiKey(_key: string) {
  console.log('API key is hardcoded - no need to set');
}

export function isHuggingFaceApiInitialized(): boolean {
  return true;
}

const DIFFICULTY_TIME_MAP: Record<Difficulty, number> = {
  easy: 20,
  medium: 60,
  hard: 120,
};

// Hugging Face API call function (currently using template-based generation)
// Uncomment and use this function if you want to call HF models directly
/*
async function callHuggingFaceAPI(prompt: string, model: string = CHAT_MODEL): Promise<string> {
  const url = `${BASE_URL}/${model}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_length: 500,
        temperature: 0.7,
        return_full_text: false
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Hugging Face API Error:', error);
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  
  if (Array.isArray(data) && data.length > 0) {
    if (data[0].generated_text) {
      return data[0].generated_text;
    }
    if (data[0].answer) {
      return data[0].answer;
    }
  }
  
  if (typeof data === 'string') {
    return data;
  }
  
  throw new Error('Invalid response from Hugging Face API');
}
*/

// Track generated questions
const generatedQuestionsCache = new Map<string, Set<string>>();
const globalQuestionsCache = new Set<string>();

function isQuestionUnique(questionText: string, sessionKey: string): boolean {
  if (!generatedQuestionsCache.has(sessionKey)) {
    generatedQuestionsCache.set(sessionKey, new Set());
  }
  
  const sessionQuestions = generatedQuestionsCache.get(sessionKey)!;
  const normalizedQuestion = questionText.toLowerCase().trim();
  
  if (sessionQuestions.has(normalizedQuestion)) {
    return false;
  }
  
  for (const existingQuestion of globalQuestionsCache) {
    const similarity = calculateSimilarity(normalizedQuestion, existingQuestion);
    if (similarity > 0.6) {
      return false;
    }
  }
  
  return true;
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

function markQuestionAsUsed(questionText: string, sessionKey: string): void {
  if (!generatedQuestionsCache.has(sessionKey)) {
    generatedQuestionsCache.set(sessionKey, new Set());
  }
  const normalized = questionText.toLowerCase().trim();
  generatedQuestionsCache.get(sessionKey)!.add(normalized);
  globalQuestionsCache.add(normalized);
}

export function clearQuestionCache(sessionKey: string): void {
  generatedQuestionsCache.delete(sessionKey);
  console.log(`Cleared question cache for session: ${sessionKey}`);
}

// Predefined question templates based on difficulty
const QUESTION_TEMPLATES = {
  easy: [
    "What is {skill} and why is it used?",
    "Explain the basic concept of {skill}.",
    "What are the main features of {skill}?",
    "How would you describe {skill} to a beginner?",
    "What problem does {skill} solve?",
  ],
  medium: [
    "How does {skill} work internally?",
    "What are the advantages and disadvantages of {skill}?",
    "Explain a real-world use case for {skill}.",
    "How would you implement {feature} using {skill}?",
    "What are the best practices when working with {skill}?",
  ],
  hard: [
    "How would you optimize performance when using {skill}?",
    "Explain the architecture and design patterns in {skill}.",
    "What are the scalability considerations for {skill}?",
    "How would you handle {scenario} in a production environment using {skill}?",
    "Compare {skill} with alternative solutions and justify when to use each.",
  ]
};

async function analyzeResume(resumeContent: string): Promise<{skills: string[], projects: string[], experience: string[]}> {
  console.log('Analyzing resume...');
  
  const skills: string[] = [];
  const projects: string[] = [];
  const experience: string[] = [];
  
  // Comprehensive tech keywords
  const techKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby',
    'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Laravel', 'Rails',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform',
    'Git', 'GitHub', 'GitLab', 'Bitbucket',
    'REST API', 'GraphQL', 'gRPC', 'WebSocket', 'Microservices',
    'HTML', 'CSS', 'SASS', 'LESS', 'TailwindCSS', 'Bootstrap', 'Material-UI', 'Ant Design',
    'Redux', 'MobX', 'Zustand', 'Context API', 'Recoil',
    'Jest', 'Mocha', 'Pytest', 'JUnit', 'Selenium', 'Cypress',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
    'React Native', 'Flutter', 'Ionic', 'Xamarin',
    'SQL', 'NoSQL', 'ORM', 'Prisma', 'Sequelize', 'TypeORM'
  ];
  
  // Extract skills (case-insensitive matching)
  techKeywords.forEach(keyword => {
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(resumeContent)) {
      skills.push(keyword);
    }
  });
  
  // Extract project names with better patterns
  const projectPatterns = [
    /(?:Project|Built|Developed|Created|Worked on)[\s:]+([A-Z][^\n.]{10,80})/gi,
    /(?:Project Name|Title)[\s:]+([A-Z][^\n.]{5,80})/gi,
    /\*\*([A-Z][^*]{10,60})\*\*/g  // Bold project names
  ];
  
  projectPatterns.forEach(pattern => {
    const matches = resumeContent.matchAll(pattern);
    for (const match of matches) {
      const projectName = match[1].replace(/^(?:Project|Built|Developed|Created|Worked on)[\s:]+/i, '').trim();
      if (projectName.length > 5 && !projects.includes(projectName)) {
        projects.push(projectName);
      }
    }
  });
  
  console.log(`📋 Resume Analysis: ${skills.length} skills, ${projects.length} projects`);
  console.log(`   Skills: ${skills.slice(0, 10).join(', ')}${skills.length > 10 ? '...' : ''}`);
  console.log(`   Projects: ${projects.slice(0, 3).join(', ')}${projects.length > 3 ? '...' : ''}`);
  
  return { skills, projects, experience };
}

export async function generateQuestionDirect(
  difficulty: Difficulty,
  resumeContent?: string,
  sessionKey?: string
): Promise<Question> {
  const currentSessionKey = sessionKey || 'default-session';
  let resumeData = { skills: [] as string[], projects: [] as string[], experience: [] as string[] };
  
  if (!resumeContent) {
    throw new Error('Resume content is required to generate questions');
  }
  
  resumeData = await analyzeResume(resumeContent);
  
  // STRICT: Only generate questions if we have resume data
  if (resumeData.skills.length === 0 && resumeData.projects.length === 0) {
    throw new Error('No skills or projects found in resume. Please upload a detailed resume.');
  }
  
  const templates = QUESTION_TEMPLATES[difficulty];
  let questionText = '';
  let rubric = '';
  let gradingHints = '';
  let selectedSkill = '';
  let selectedProject = '';
  
  // Randomly decide: 70% skills, 30% projects
  const useSkills = Math.random() > 0.3 && resumeData.skills.length > 0;
  
  const maxRetries = 10;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    if (useSkills || resumeData.projects.length === 0) {
      // Generate skill-based question
      selectedSkill = resumeData.skills[Math.floor(Math.random() * resumeData.skills.length)];
      questionText = template
        .replace('{skill}', selectedSkill)
        .replace('{feature}', 'a feature')
        .replace('{scenario}', 'performance issues');
      
      rubric = `Must explain ${selectedSkill} concepts accurately. Key points: definition, use cases, ${difficulty === 'easy' ? 'basic features' : difficulty === 'medium' ? 'implementation details' : 'advanced concepts and best practices'}.`;
      gradingHints = `Expected keywords: ${selectedSkill}, ${getRelatedKeywords(selectedSkill).join(', ')}`;
    } else {
      // Generate project-based question
      selectedProject = resumeData.projects[Math.floor(Math.random() * resumeData.projects.length)];
      const projectQuestions = [
        `Tell me about your ${selectedProject} project. What technologies did you use and why?`,
        `What was the most challenging part of building ${selectedProject}?`,
        `How did you handle ${difficulty === 'easy' ? 'user interface' : difficulty === 'medium' ? 'data management' : 'scalability and performance'} in ${selectedProject}?`,
        `Explain the architecture of ${selectedProject}.`
      ];
      questionText = projectQuestions[Math.floor(Math.random() * projectQuestions.length)];
      
      rubric = `Must discuss ${selectedProject} with technical details. Should mention technologies used, challenges faced, and solutions implemented.`;
      gradingHints = `Expected: project description, technologies, challenges, solutions, outcomes`;
    }
    
    // Check uniqueness
    if (isQuestionUnique(questionText, currentSessionKey)) {
      markQuestionAsUsed(questionText, currentSessionKey);
      console.log(`✅ Generated ${useSkills ? 'skill' : 'project'}-based question: ${questionText}`);
      break;
    }
  }
  
  return {
    id: uuidv4(),
    text: questionText,
    difficulty,
    timeLimitSec: DIFFICULTY_TIME_MAP[difficulty],
    rubric,
    gradingHints,
  };
}

// Helper function to get related keywords for a skill
function getRelatedKeywords(skill: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'React': ['component', 'hooks', 'state', 'props', 'JSX', 'virtual DOM'],
    'Node.js': ['server', 'async', 'callback', 'event loop', 'npm', 'modules'],
    'Python': ['syntax', 'libraries', 'pip', 'functions', 'classes', 'data types'],
    'MongoDB': ['database', 'collection', 'document', 'query', 'NoSQL', 'schema'],
    'JavaScript': ['variables', 'functions', 'objects', 'arrays', 'promises', 'async'],
    'TypeScript': ['types', 'interfaces', 'generics', 'compiler', 'static typing'],
    'AWS': ['cloud', 'EC2', 'S3', 'Lambda', 'deployment', 'infrastructure'],
    'Docker': ['container', 'image', 'dockerfile', 'orchestration', 'deployment'],
    'REST API': ['HTTP', 'endpoints', 'GET', 'POST', 'JSON', 'status codes'],
    'SQL': ['database', 'tables', 'queries', 'joins', 'relationships', 'SELECT']
  };
  
  return keywordMap[skill] || ['implementation', 'features', 'usage', 'benefits'];
}

export async function gradeAnswerDirect(
  question: Question,
  answer: Answer
): Promise<{ score: number; feedback: string }> {
  const hasRecording = answer.recordingBlobId ? true : false;
  const answerText = answer.text?.trim() || '';
  
  // Empty answer check - NO MARKS
  if (answerText.length === 0 && !hasRecording) {
    return {
      score: 0,
      feedback: 'No answer provided. Score: 0/10. Please provide a response to demonstrate your knowledge.',
    };
  }
  
  // Only recording, no text - NO MARKS (recording alone is not acceptable)
  if (answerText.length === 0 && hasRecording) {
    return {
      score: 0,
      feedback: 'Only recording provided, no written answer. Score: 0/10. You must provide a written explanation. Recording is optional and supplementary only.',
    };
  }
  
  // Very brief answer (1-10 chars) - NO MARKS
  if (answerText.length < 10) {
    return {
      score: 0,
      feedback: `Answer too short (${answerText.length} characters). Score: 0/10. Please provide a detailed explanation with at least 50 characters.`,
    };
  }
  
  // Brief answer (10-30 chars) - MINIMAL MARKS
  if (answerText.length < 30) {
    return {
      score: 1,
      feedback: `Answer is too brief (${answerText.length} characters). Score: 1/10. Please provide a detailed explanation with examples (at least 50 characters).`,
    };
  }
  
  const lowerAnswer = answerText.toLowerCase();
  const expectedKeywords = question.gradingHints?.toLowerCase() || '';
  
  let score = 0;
  const feedback: string[] = [];
  
  // Extract skill/technology from question
  const skillMatch = question.text.match(/\b(React|Node\.js|Python|JavaScript|TypeScript|MongoDB|SQL|AWS|Docker|Java|C\+\+|Angular|Vue|Django|Flask|Express|PostgreSQL|MySQL|Redis|Kubernetes|Git|REST API|GraphQL|HTML|CSS|Spring|Laravel|Ruby|Rails|PHP|Kotlin|Swift|Flutter|Android|iOS)\b/i);
  const skill = skillMatch ? skillMatch[0] : '';
  
  // STRICT REQUIREMENT: Answer MUST mention the skill/technology being asked about
  if (!skill || !lowerAnswer.includes(skill.toLowerCase())) {
    // If answer doesn't mention the main topic, it's irrelevant - give 0
    return {
      score: 0,
      feedback: `Irrelevant answer. (0/10)\n✗ Did not address the question about ${skill || 'the topic'}\n✗ Answer must be relevant to the question asked\nSuggestion: Read the question carefully and provide a relevant answer about ${skill || 'the specific topic'}.`
    };
  }
  
  // 1. Skill mentioned (required) - 2 points
  score += 2;
  feedback.push(`✓ Mentioned ${skill}`);
  
  // 2. Check for expected keywords from grading hints (3 points) - STRICT
  const keywords = expectedKeywords.split(',').map(k => k.trim()).filter(k => k.length > 3);
  let keywordMatches = 0;
  keywords.forEach(keyword => {
    if (lowerAnswer.includes(keyword)) {
      keywordMatches++;
    }
  });
  
  // STRICT: Need at least 40% of keywords to get any points
  const keywordPercentage = keywords.length > 0 ? (keywordMatches / keywords.length) : 0;
  
  if (keywordPercentage >= 0.6) {
    score += 3;
    feedback.push(`✓ Covered key concepts (${keywordMatches}/${keywords.length})`);
  } else if (keywordPercentage >= 0.4) {
    score += 2;
    feedback.push(`⚠ Covered some concepts (${keywordMatches}/${keywords.length}) but missing important details`);
  } else if (keywordPercentage >= 0.2) {
    score += 1;
    feedback.push(`⚠ Mentioned few concepts (${keywordMatches}/${keywords.length}) - needs much more detail`);
  } else {
    feedback.push(`✗ Missing most key technical concepts (${keywordMatches}/${keywords.length})`);
  }
  
  // 3. Check answer length and depth (2 points)
  if (answerText.length >= 150) {
    score += 2;
    feedback.push('✓ Detailed explanation');
  } else if (answerText.length >= 80) {
    score += 1;
    feedback.push('⚠ Could provide more details');
  } else {
    feedback.push('✗ Answer too brief');
  }
  
  // 4. Check for examples or practical knowledge (2 points)
  const exampleIndicators = ['example', 'for instance', 'such as', 'like', 'used', 'implemented', 'built', 'created', 'worked on'];
  const hasExample = exampleIndicators.some(indicator => lowerAnswer.includes(indicator));
  if (hasExample) {
    score += 2;
    feedback.push('✓ Provided examples or practical context');
  } else {
    feedback.push('✗ No examples or practical context provided');
  }
  
  // 5. Check for technical accuracy (1 point)
  const technicalTerms = ['function', 'method', 'class', 'component', 'module', 'library', 'framework', 'API', 'database', 'server', 'client', 'request', 'response', 'data', 'algorithm', 'structure'];
  const technicalTermCount = technicalTerms.filter(term => lowerAnswer.includes(term)).length;
  if (technicalTermCount >= 2) {
    score += 1;
    feedback.push('✓ Used technical terminology');
  }
  
  // Recording bonus (only if answer has substance)
  if (hasRecording && score >= 3) {
    score += 1;
    feedback.push('✓ Provided video/audio recording');
  }
  
  // Cap score at 10
  score = Math.min(10, score);
  
  // Generate final feedback
  let finalFeedback = '';
  if (score >= 8) {
    finalFeedback = `Excellent answer! (${score}/10)\n${feedback.join('\n')}`;
  } else if (score >= 6) {
    finalFeedback = `Good answer. (${score}/10)\n${feedback.join('\n')}\nSuggestion: Add more technical details and examples.`;
  } else if (score >= 4) {
    finalFeedback = `Fair answer. (${score}/10)\n${feedback.join('\n')}\nSuggestion: Explain concepts more thoroughly with specific examples.`;
  } else {
    finalFeedback = `Needs improvement. (${score}/10)\n${feedback.join('\n')}\nSuggestion: Provide detailed technical explanation with relevant examples.`;
  }
  
  return { score, feedback: finalFeedback };
}

export async function generateFinalSummaryDirect(
  answers: Answer[],
  _questions: Question[]
): Promise<{ finalScore: number; summary: string }> {
  const scores = answers.map(ans => ans.llmScore || 0);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const maxPossibleScore = answers.length * 10;
  const finalScore = Math.round((totalScore / maxPossibleScore) * 100);
  
  const answeredCount = answers.filter(ans => (ans.text?.trim() || '').length > 0).length;
  const unansweredCount = answers.length - answeredCount;
  
  const performanceLevel = finalScore >= 70 ? 'Excellent' : 
                          finalScore >= 50 ? 'Good' : 
                          finalScore >= 30 ? 'Fair' : 'Needs Improvement';
  
  const summary = `Interview Performance: ${performanceLevel} (${finalScore}%)

Answered ${answeredCount} out of ${answers.length} questions.
Total Score: ${totalScore}/${maxPossibleScore}

${finalScore >= 70 ? 'Strong performance demonstrating good technical knowledge.' : ''}
${finalScore < 70 && finalScore >= 50 ? 'Decent performance with room for improvement in technical depth.' : ''}
${finalScore < 50 ? 'Consider reviewing fundamental concepts and practicing more technical questions.' : ''}

${unansweredCount > 0 ? `Note: ${unansweredCount} questions were not answered.` : 'All questions were attempted.'}`;
  
  return { finalScore, summary };
}
