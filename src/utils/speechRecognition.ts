export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognition(
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
): SpeechRecognitionController {
  // Check if browser supports Speech Recognition
  const SpeechRecognition = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser');
    return {
      start: () => {},
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognition();
  
  // Configuration
  recognition.continuous = true; // Keep listening
  recognition.interimResults = true; // Get partial results
  recognition.lang = 'en-US'; // Language
  recognition.maxAlternatives = 1;

  let isRunning = false;
  let finalTranscript = '';

  recognition.onstart = () => {
    console.log('Speech recognition started');
    isRunning = true;
    finalTranscript = ''; // Reset on start
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let newFinalText = '';

    // Process all results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        newFinalText += transcript + ' ';
        console.log('Final transcript chunk:', transcript);
      } else {
        interimTranscript += transcript;
      }
    }

    // Add new final text to accumulated transcript
    if (newFinalText) {
      finalTranscript += newFinalText;
    }

    // Send the combined transcript (accumulated final + current interim)
    const fullTranscript = (finalTranscript + interimTranscript).trim();
    if (fullTranscript) {
      console.log('Sending transcript update:', fullTranscript.substring(0, 50) + '...');
      onResult(fullTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    
    if (event.error === 'no-speech') {
      console.log('No speech detected, continuing...');
      return;
    }
    
    if (event.error === 'aborted') {
      console.log('Speech recognition aborted');
      return;
    }

    if (onError) {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    console.log('Speech recognition ended, isRunning:', isRunning);
    
    // Don't auto-restart - let the user control it
    // This prevents the recognition from continuing to the next question
    isRunning = false;
    finalTranscript = ''; // Clear transcript when ended
  };

  return {
    start: () => {
      if (!isRunning) {
        try {
          finalTranscript = ''; // Reset transcript on start
          isRunning = true;
          recognition.start();
          console.log('Speech recognition starting...');
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          if (onError) {
            onError('Failed to start speech recognition');
          }
        }
      } else {
        console.log('Speech recognition already running');
      }
    },
    stop: () => {
      if (isRunning) {
        isRunning = false; // Set to false BEFORE stopping
        finalTranscript = ''; // Clear accumulated transcript
        try {
          recognition.stop();
          console.log('Speech recognition stopping...');
        } catch (error) {
          console.error('Failed to stop speech recognition:', error);
        }
      }
    },
    isSupported: true,
  };
}

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  );
}
