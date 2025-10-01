import { setGroqApiKey, isGroqApiInitialized } from './groqAPI';

/**
 * Initialize the Groq API with the provided API key
 * @param apiKey - The Groq API key
 */
export function initializeGroq(apiKey: string): void {
  setGroqApiKey(apiKey);
}

/**
 * Check if the Groq API has been initialized
 * @returns true if initialized, false otherwise
 */
export function isGroqInitialized(): boolean {
  return isGroqApiInitialized();
}

// Legacy exports for backward compatibility
export const initializeGemini = initializeGroq;
export const isGeminiInitialized = isGroqInitialized;

// Re-export all functions from groqAPI for convenience
export {
  generateQuestionDirect as generateQuestion,
  gradeAnswerDirect as gradeAnswer,
  generateFinalSummaryDirect as generateFinalSummary,
} from './groqAPI';
