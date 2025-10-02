import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js to use CDN worker for better compatibility
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  if (!file) {
    throw new Error('No file provided for PDF extraction');
  }

  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('File is not a valid PDF');
  }

  try {
    // Use a text-based approach for PDF extraction
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPDFBuffer(arrayBuffer);
    return text;
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    // Fallback to a simpler approach if the PDF.js extraction fails
    return extractTextFromPDFSimple(file);
  }
}

// Fallback method for PDF extraction
async function extractTextFromPDFSimple(file: File): Promise<string> {
  // Read the file as text and look for patterns
  const arrayBuffer = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  let content = '';
  
  try {
    content = decoder.decode(arrayBuffer);
  } catch (e) {
    // If decoding fails, return a placeholder
    return `Content extracted from ${file.name}. Please check the extracted information below.`;
  }
  
  // Extract text content between common PDF markers
  const textMarkers = content.match(/BT\s*(.*?)\s*ET/gs);
  if (textMarkers && textMarkers.length > 0) {
    return textMarkers.join(' ').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
  }
  
  return `Content extracted from ${file.name}. Please check the extracted information below.`;
}

// Main PDF extraction method using PDF.js
async function extractTextFromPDFBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
        
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    throw error;
  }
}

export async function extractTextFromDocx(file: File): Promise<string> {
  if (!file) {
    throw new Error('No file provided for DOCX extraction');
  }

  if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
    throw new Error('File is not a valid DOCX/DOC file');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('DOCX file is empty or corrupted');
    }

    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result || !result.value) {
      throw new Error('No text content found in DOCX file');
    }

    const trimmedText = result.value.trim();
    if (!trimmedText) {
      throw new Error('DOCX file contains no readable text');
    }

    return trimmedText;
  } catch (error: any) {
    console.error('DOCX extraction error:', error);
    throw new Error(error.message || 'Failed to extract text from DOCX. Please ensure the file is a valid Word document.');
  }
}

export interface ContactFields {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ResumeData {
  skills: string[];
  projects: Array<{ name: string; description: string }>;
  experience: string;
}

export function extractContactFields(text: string): ContactFields {
  console.log('📋 Extracting contact fields from text of length:', text.length);
  console.log('📄 First 500 characters:', text.substring(0, 500));
  
  // Clean the text for better extraction
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // POWERFUL EMAIL EXTRACTION with multiple patterns and validation
  const emailRegex = /\b[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}\b/gi;
  const emailMatches = cleanText.match(emailRegex) || [];
  
  // Filter out common false positives and validate
  const validEmails = emailMatches.filter(e => {
    const lower = e.toLowerCase();
    return !lower.includes('example.com') && 
           !lower.includes('domain.com') &&
           !lower.includes('email.com') &&
           !lower.includes('test.com') &&
           !lower.includes('sample.com') &&
           !lower.includes('placeholder') &&
           e.includes('@') &&
           e.split('@')[1].includes('.') && // Must have domain extension
           e.split('@')[0].length >= 2 && // At least 2 chars before @
           e.split('@')[1].split('.')[0].length >= 2; // At least 2 chars in domain
  });
  
  const email = validEmails.length > 0 ? validEmails[0] : undefined;
  console.log('Extracted email:', email);

  // POWERFUL PHONE EXTRACTION with validation for 10-digit numbers
  // Supports: +91-9876543210, 9876543210, (987) 654-3210, 987-654-3210, etc.
  const phoneRegexes = [
    /(?:Phone|Mobile|Contact|Tel|Cell|Ph)[:\s]*([+]?\d{1,3}[\s.-]?\(?\d{3,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4})/gi,
    /(?:Phone|Mobile|Contact|Tel|Cell|Ph)[:\s]*(\d{10})/gi,
    /\+\d{1,3}[\s-]?\(?\d{3,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}/g,
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    /\b\d{10}\b/g,
    /\+\d{1,3}\s?\d{10}/g,
    /\d{3}[\s.-]\d{3}[\s.-]\d{4}/g
  ];
  
  let phone: string | undefined;
  const foundNumbers: string[] = [];
  
  // AGGRESSIVE: Find any sequence of 10-12 digits (with or without spaces/separators) after "Mobile/Phone/Contact"
  const aggressivePattern = /(?:Mobile|Phone|Contact|Tel|Cell|Ph)[:\s]*([+\d\s.-]{10,20})/gi;
  const aggressiveMatches = text.match(aggressivePattern);
  if (aggressiveMatches && aggressiveMatches.length > 0) {
    aggressiveMatches.forEach(match => {
      const digitsOnly = match.replace(/\D/g, '');
      console.log(`Found potential phone (aggressive): "${match}" -> ${digitsOnly.length} digits`);
      if (digitsOnly.length === 10) {
        foundNumbers.push(digitsOnly); // Store just the 10 digits
      } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        foundNumbers.push(digitsOnly.substring(2)); // Remove country code, store 10 digits
      }
    });
  }
  
  for (const regex of phoneRegexes) {
    const matches = text.match(regex); // Use original text, not cleanText
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        // Clean the number: remove all non-digit characters
        const digitsOnly = match.replace(/\D/g, '');
        
        console.log(`Found potential phone: "${match}" -> ${digitsOnly.length} digits`);
        
        // Validate: Must be exactly 10 digits (or 11-12 with country code)
        if (digitsOnly.length === 10) {
          // Perfect 10-digit number
          if (!foundNumbers.includes(match.trim())) {
            foundNumbers.push(match.trim());
          }
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
          // US number with country code
          if (!foundNumbers.includes(match.trim())) {
            foundNumbers.push(match.trim());
          }
        } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
          // Indian number with country code
          if (!foundNumbers.includes(match.trim())) {
            foundNumbers.push(match.trim());
          }
        }
      });
      
      // If we found valid numbers, break
      if (foundNumbers.length > 0) break;
    }
  }
  
  // Take the first valid phone number and clean it to 10 digits
  if (foundNumbers.length > 0) {
    const rawPhone = foundNumbers[0];
    const digitsOnly = rawPhone.replace(/\D/g, '');
    
    // If 12 digits and starts with 91, remove country code
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      phone = digitsOnly.substring(2); // Get last 10 digits
    } else if (digitsOnly.length === 10) {
      phone = digitsOnly;
    } else {
      phone = rawPhone; // Keep as is if doesn't match expected format
    }
    
    console.log('✅ Extracted phone:', phone, `(${phone.replace(/\D/g, '').length} digits)`);
  } else {
    console.log('❌ No valid phone number found');
  }

  // POWERFUL NAME EXTRACTION with multiple strategies
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  
  console.log('👤 Starting name extraction...');
  console.log('Total lines in resume:', lines.length);
  
  let name: string | undefined;
  
  // Strategy 0A: Check first 2-3 words of the text (for PDFs that don't preserve line breaks)
  const allWords = text.split(/\s+/).filter(w => w.length > 0);
  if (allWords.length >= 2) {
    // Try first 2 words
    const first2Words = allWords.slice(0, 2).join(' ');
    if (!/\d/.test(first2Words) && 
        !/@/.test(first2Words) &&
        !/linkedin/i.test(first2Words) &&
        !/github/i.test(first2Words) &&
        first2Words.length > 5 && first2Words.length < 50) {
      name = first2Words;
      console.log('✅ Extracted name (first 2 words):', name);
    }
    
    // If not found, try first 3 words
    if (!name && allWords.length >= 3) {
      const first3Words = allWords.slice(0, 3).join(' ');
      if (!/\d/.test(first3Words) && 
          !/@/.test(first3Words) &&
          !/linkedin/i.test(first3Words) &&
          !/github/i.test(first3Words) &&
          first3Words.length > 5 && first3Words.length < 60) {
        name = first3Words;
        console.log('✅ Extracted name (first 3 words):', name);
      }
    }
  }
  
  // Strategy 0B: Check first line if it's ALL CAPS or Title Case (for properly formatted resumes)
  if (!name && lines.length > 0) {
    const firstLine = lines[0].trim();
    console.log('📝 First line of resume:', firstLine);
    // Check if first line looks like a name (2-5 words, no numbers, no special chars except spaces)
    const words = firstLine.split(/\s+/).filter(w => w.length > 0);
    console.log(`First line has ${words.length} words:`, words.slice(0, 10));
    
    if (words.length >= 2 && words.length <= 5 && 
        !/\d/.test(firstLine) && 
        !/@/.test(firstLine) &&
        !/http/i.test(firstLine) &&
        !/linkedin/i.test(firstLine) &&
        !/github/i.test(firstLine) &&
        firstLine.length > 5 && firstLine.length < 80) {
      name = firstLine;
      console.log('✅ Extracted name (first line):', name);
    } else {
      console.log('❌ First line did not match name criteria');
    }
  }
  
  // Strategy 1: Look for "Name:" label first (most reliable)
  if (!name) {
    const nameLabelMatch = text.match(/(?:Name|Full Name|Candidate Name|Applicant)[:\s]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z.]+)+)/i);
    if (nameLabelMatch && nameLabelMatch[1]) {
      const extractedName = nameLabelMatch[1].trim();
      if (extractedName.length > 3 && extractedName.length < 50 && !/\d/.test(extractedName)) {
        name = extractedName;
        console.log('✅ Extracted name (label match):', name);
      }
    }
  }
  
  // Strategy 2: Look for common name patterns in the first few lines
  if (!name) {
    const namePatterns = [
      /^[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+$/,                          // First Last
      /^[A-Z][a-zA-Z]+\s+[A-Z]\.?\s+[A-Z][a-zA-Z]+$/,              // First M. Last or First M Last
      /^[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+$/,        // First Middle Last
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,                                // Strict case First Last
      /^[A-Z]+\s+[A-Z]+$/,                                          // ALL CAPS FIRST LAST
      /^[A-Z][a-z]+\s+[A-Z]\s+[A-Z][a-z]+$/                        // First M Last
    ];
  
    // Check first 10 lines for name (most resumes have name at top)
    for (const line of lines.slice(0, 10)) {
      // Skip lines with common resume keywords
      if (/resume|curriculum|vitae|profile|summary|objective|contact|email|phone|address|linkedin|github|portfolio/i.test(line)) {
        continue;
      }
      
      for (const pattern of namePatterns) {
        if (pattern.test(line) && 
            line.length > 3 && 
            line.length < 50 && 
            !/\d/.test(line) && 
            !/@/.test(line) && 
            !/http/i.test(line) &&
            !/\.com/i.test(line) &&
            !/\.in/i.test(line) &&
            !/\.org/i.test(line)) {
          name = line;
          console.log('Extracted name (pattern match):', name);
          break;
        }
      }
      if (name) break;
    }
  }
  
  // Strategy 2: If no name found, use the first line that looks like a name
  if (!name) {
    for (const line of lines.slice(0, 15)) {
      // Skip common non-name lines
      if (/resume|curriculum|vitae|profile|summary|objective|contact|email|phone|address|linkedin|github/i.test(line)) {
        continue;
      }
      
      const words = line.split(/\s+/);
      if (
        line.length > 2 &&
        line.length < 50 &&
        words.length >= 2 &&
        words.length <= 5 &&
        !/\d/.test(line) &&
        !/@/.test(line) &&
        !/http/i.test(line) &&
        !/\.com/i.test(line) &&
        /^[A-Z]/.test(line) // Starts with capital letter
      ) {
        name = line;
        console.log('Extracted name (heuristic):', name);
        break;
      }
    }
  }
  
  // Strategy 3: Fallback - first line that looks like a name
  if (!name) {
    for (const line of lines.slice(0, 5)) {
      if (/resume|curriculum|vitae|profile|summary|objective|contact|email|phone|address|linkedin|github/i.test(line)) {
        continue;
      }
      
      const words = line.split(/\s+/);
      if (
        line.length > 5 &&
        line.length < 50 &&
        words.length >= 2 &&
        words.length <= 4 &&
        !/\d/.test(line) &&
        !/@/.test(line) &&
        !/http/i.test(line) &&
        /^[A-Z]/.test(line) // Starts with capital
      ) {
        name = line;
        console.log('Extracted name (fallback):', name);
        break;
      }
    }
  }

  console.log('Final extracted fields:', { name, email, phone });
  return { name, email, phone };
}

export function extractResumeData(text: string): ResumeData {
  // Extract Skills Section with enhanced detection
  const skills: string[] = [];
  const skillsKeywords = ['skills', 'technical skills', 'technologies', 'expertise', 'proficiency', 'competencies', 'tech stack'];
  const commonSkills = [
    // Frontend
    'react', 'reactjs', 'react.js', 'vue', 'vuejs', 'vue.js', 'angular', 'angularjs', 
    'next.js', 'nextjs', 'nuxt', 'svelte', 'redux', 'mobx', 'recoil',
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss', 
    'bootstrap', 'material-ui', 'mui', 'ant design', 'chakra ui',
    
    // Backend
    'node', 'nodejs', 'node.js', 'express', 'expressjs', 'express.js', 'nestjs', 'nest.js',
    'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'spring boot',
    'php', 'laravel', 'ruby', 'rails', 'go', 'golang', 'rust', 'c#', '.net', 'asp.net',
    
    // Databases
    'mongodb', 'mysql', 'postgresql', 'postgres', 'sql', 'nosql', 'redis', 'cassandra',
    'dynamodb', 'firebase', 'firestore', 'sqlite', 'mariadb', 'oracle', 'elasticsearch',
    
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift',
    
    // DevOps & Cloud
    'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify',
    'ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'terraform', 'ansible',
    
    // Tools & Others
    'git', 'github', 'gitlab', 'bitbucket', 'graphql', 'rest', 'restful', 'api',
    'microservices', 'agile', 'scrum', 'jest', 'mocha', 'chai', 'cypress', 'selenium',
    'webpack', 'vite', 'babel', 'npm', 'yarn', 'pnpm', 'postman', 'swagger'
  ];

  // Find skills section first
  for (const keyword of skillsKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+(?:\\n[^\\n]+){0,15})`, 'i');
    const match = text.match(regex);
    if (match) {
      const skillsText = match[1];
      // Extract skills from the section
      commonSkills.forEach(skill => {
        const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (skillRegex.test(skillsText)) {
          const properCase = skillsText.match(skillRegex)?.[0] || skill;
          const normalizedSkill = properCase.trim();
          if (!skills.some(s => s.toLowerCase() === normalizedSkill.toLowerCase())) {
            skills.push(normalizedSkill);
          }
        }
      });
      break;
    }
  }

  // If no skills section found, scan entire resume
  if (skills.length === 0) {
    commonSkills.forEach(skill => {
      const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const matches = text.match(skillRegex);
      if (matches) {
        const normalizedSkill = matches[0].trim();
        if (!skills.some(s => s.toLowerCase() === normalizedSkill.toLowerCase())) {
          skills.push(normalizedSkill);
        }
      }
    });
  }

  console.log(`Extracted ${skills.length} skills:`, skills);

  // Extract Projects Section with enhanced detection
  const projects: Array<{ name: string; description: string }> = [];
  const projectKeywords = ['projects', 'project experience', 'personal projects', 'academic projects', 'key projects', 'portfolio'];
  
  for (const keyword of projectKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^]*?)(?=\\n\\n[A-Z][a-z]+[:\\s]|\\n[A-Z][A-Z]|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      const projectsText = match[1];
      
      // Try multiple splitting strategies
      let projectBlocks: string[] = [];
      
      // Strategy 1: Split by bullet points or dashes
      if (projectsText.includes('•') || projectsText.includes('–') || /^\s*[-*]\s+/m.test(projectsText)) {
        projectBlocks = projectsText.split(/\n\s*[•–\-*]\s+/).filter(b => b.trim());
      }
      // Strategy 2: Split by lines starting with capital letters (project names)
      else {
        projectBlocks = projectsText.split(/\n(?=[A-Z][a-zA-Z\s]{3,}:|\n[A-Z])/).filter(b => b.trim());
      }
      
      projectBlocks.forEach(block => {
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          let name = lines[0].trim().replace(/^[•\-*]\s*/, '').replace(/:\s*$/, '');
          
          // Clean up project name
          name = name.split(/[:\-–]/)[0].trim();
          
          const description = lines.slice(1).join(' ').trim().substring(0, 300);
          
          // Validate project name
          if (name.length > 3 && 
              name.length < 100 && 
              !/^(project|experience|work|education|skills)/i.test(name) &&
              !name.match(/^\d{4}/) // Not a year
          ) {
            projects.push({ name, description: description || 'Project mentioned in resume' });
          }
        }
      });
      
      if (projects.length > 0) break;
    }
  }
  
  console.log(`Extracted ${projects.length} projects:`, projects.map(p => p.name));

  // Extract work experience summary
  const experienceKeywords = ['experience', 'work experience', 'employment'];
  let experience = '';
  for (const keyword of experienceKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^]*?)(?=\\n\\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      experience = match[1].substring(0, 500);
      break;
    }
  }

  return { skills, projects, experience };
}

export async function parseResume(file: File): Promise<{ text: string; fields: ContactFields }> {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB. Please upload a smaller file.');
  }

  if (file.size === 0) {
    throw new Error('File is empty');
  }

  let text = '';

  try {
    console.log('Parsing resume:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      console.log('Extracting text from PDF...');
      text = await extractTextFromPDF(file);
      console.log('PDF text extracted, length:', text.length);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.doc')
    ) {
      console.log('Extracting text from DOCX...');
      text = await extractTextFromDocx(file);
      console.log('DOCX text extracted, length:', text.length);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }

    if (!text || text.trim().length < 20) {
      console.warn('Extracted text is too short:', text.length, 'characters');
      throw new Error(`Resume appears to be too short or empty (${text.length} characters). Please upload a valid resume with content.`);
    }

    console.log('Extracting contact fields from text...');
    const fields = extractContactFields(text);
    console.log('Extracted fields:', fields);
    
    return { text, fields };
  } catch (error: any) {
    console.error('Resume parsing error:', error);
    throw new Error(error.message || 'Failed to parse resume. Please ensure the file is a valid PDF or DOCX document.');
  }
}
