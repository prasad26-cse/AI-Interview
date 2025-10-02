import { setHuggingFaceApiKey, isHuggingFaceApiInitialized } from './huggingfaceAPI';

/**
 * Initialize the Hugging Face API with the provided API key
 * @param apiKey - The Hugging Face API key
 */
export function initializeHuggingFace(apiKey: string): void {
  setHuggingFaceApiKey(apiKey);
}

/**
 * Check if the Hugging Face API has been initialized
 * @returns true if initialized, false otherwise
 */
export function isHuggingFaceInitialized(): boolean {
  return isHuggingFaceApiInitialized();
}

// Legacy exports for backward compatibility
export const initializeGroq = initializeHuggingFace;
export const isGroqInitialized = isHuggingFaceInitialized;
export const initializeGemini = initializeHuggingFace;
export const isGeminiInitialized = isHuggingFaceInitialized;

// Re-export all functions from huggingfaceAPI for convenience
export {
  generateQuestionDirect as generateQuestion,
  gradeAnswerDirect as gradeAnswer,
  generateFinalSummaryDirect as generateFinalSummary,
  clearQuestionCache,
} from './huggingfaceAPI';
