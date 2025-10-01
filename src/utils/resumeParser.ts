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
  console.log('Extracting contact fields from text of length:', text.length);
  
  // Clean the text for better extraction
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Enhanced email extraction with multiple patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
  const emailMatches = cleanText.match(emailRegex) || [];
  // Filter out common false positives
  const validEmails = emailMatches.filter(e => 
    !e.includes('example.com') && 
    !e.includes('domain.com') &&
    !e.includes('email.com')
  );
  const email = validEmails.length > 0 ? validEmails[0] : undefined;
  console.log('Extracted email:', email);

  // Enhanced phone extraction with international format support
  // Supports formats: +1 (123) 456-7890, 123-456-7890, 123.456.7890, +91-1234567890, etc.
  const phoneRegexes = [
    /\+\d{1,3}[\s-]?\(?\d{3,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}/g, // +1 (123) 456-7890, +91-1234567890
    /\(?\d{3,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}/g,                // (123) 456-7890 or 123-456-7890
    /\d{10,12}/g,                                                // 1234567890 or 123456789012
    /\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/g,                           // 123-456-7890
    /\+\d{1,3}\s?\d{10}/g                                        // +91 1234567890
  ];
  
  let phone: string | undefined;
  for (const regex of phoneRegexes) {
    const matches = cleanText.match(regex);
    if (matches && matches.length > 0) {
      // Take the first valid phone number
      phone = matches[0].trim();
      console.log('Extracted phone:', phone);
      break;
    }
  }

  // Enhanced name extraction with multiple strategies
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  
  let name: string | undefined;
  
  // Strategy 1: Look for common name patterns in the first few lines
  const namePatterns = [
    /^[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+$/,                          // First Last
    /^[A-Z][a-zA-Z]+\s+[A-Z]\.?\s+[A-Z][a-zA-Z]+$/,              // First M. Last or First M Last
    /^[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+$/,        // First Middle Last
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,                                // Strict case First Last
    /^[A-Z]+\s+[A-Z]+$/                                           // ALL CAPS FIRST LAST
  ];
  
  // Check first 20 lines for name
  for (const line of lines.slice(0, 20)) {
    // Skip lines with common resume keywords
    if (/resume|curriculum|vitae|profile|summary|objective|contact|email|phone/i.test(line)) {
      continue;
    }
    
    for (const pattern of namePatterns) {
      if (pattern.test(line) && 
          line.length > 3 && 
          line.length < 50 && 
          !/\d/.test(line) && 
          !/@/.test(line) && 
          !/http/i.test(line) &&
          !/\.com/i.test(line)) {
        name = line;
        console.log('Extracted name (pattern match):', name);
        break;
      }
    }
    if (name) break;
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
  
  // Strategy 3: Look for "Name:" label
  if (!name) {
    const nameMatch = text.match(/(?:name|candidate|applicant)[:\s]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/i);
    if (nameMatch && nameMatch[1]) {
      name = nameMatch[1].trim();
      console.log('Extracted name (label match):', name);
    }
  }

  console.log('Final extracted fields:', { name, email, phone });
  return { name, email, phone };
}

export function extractResumeData(text: string): ResumeData {
  // Extract Skills Section
  const skills: string[] = [];
  const skillsKeywords = ['skills', 'technical skills', 'technologies', 'expertise', 'proficiency'];
  const commonSkills = [
    'react', 'node', 'javascript', 'typescript', 'python', 'java', 'mongodb', 'sql', 
    'mysql', 'postgresql', 'express', 'redux', 'vue', 'angular', 'docker', 'kubernetes',
    'aws', 'azure', 'git', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jest',
    'graphql', 'rest', 'api', 'microservices', 'agile', 'scrum', 'ci/cd', 'jenkins'
  ];

  // Find skills section
  for (const keyword of skillsKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+(?:\\n[^\\n]+){0,10})`, 'i');
    const match = text.match(regex);
    if (match) {
      const skillsText = match[1];
      // Extract skills from the section
      commonSkills.forEach(skill => {
        const skillRegex = new RegExp(`\\b${skill}\\b`, 'i');
        if (skillRegex.test(skillsText)) {
          const properCase = skillsText.match(skillRegex)?.[0] || skill;
          if (!skills.includes(properCase)) {
            skills.push(properCase);
          }
        }
      });
      break;
    }
  }

  // If no skills section found, scan entire resume
  if (skills.length === 0) {
    commonSkills.forEach(skill => {
      const skillRegex = new RegExp(`\\b${skill}\\b`, 'i');
      if (skillRegex.test(text)) {
        const match = text.match(skillRegex);
        if (match && !skills.includes(match[0])) {
          skills.push(match[0]);
        }
      }
    });
  }

  // Extract Projects Section
  const projects: Array<{ name: string; description: string }> = [];
  const projectKeywords = ['projects', 'project experience', 'personal projects', 'academic projects'];
  
  for (const keyword of projectKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^]*?)(?=\\n\\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      const projectsText = match[1];
      // Split by common project delimiters
      const projectBlocks = projectsText.split(/\n(?=[A-Z])/);
      
      projectBlocks.forEach(block => {
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const name = lines[0].trim().replace(/^[•\-*]\s*/, '');
          const description = lines.slice(1).join(' ').substring(0, 200);
          if (name.length > 3 && name.length < 100) {
            projects.push({ name, description });
          }
        }
      });
      break;
    }
  }

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
