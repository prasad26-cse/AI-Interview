export interface RecordingController {
  stop: () => Promise<Blob>;
  stream: MediaStream;
}

export async function startRecording(): Promise<RecordingController> {
  try {
    // Request media with optimized constraints for smaller file size
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640, max: 640 },
        height: { ideal: 480, max: 480 },
        facingMode: 'user',
        frameRate: { ideal: 15, max: 20 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000,
        channelCount: 1
      },
    });

    // Check supported MIME types and use the best available
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 64000,  // Reduced from 128000
      videoBitsPerSecond: 500000,  // Reduced from 2500000 (5x smaller)
    });

    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
        console.log('Recording chunk received:', event.data.size, 'bytes');
      }
    };

    recorder.onerror = (event: any) => {
      console.error('MediaRecorder error:', event.error);
    };

    // Start recording with timeslice for better data capture
    recorder.start(100); // Capture data every 100ms for smoother recording

    console.log('Recording started with MIME type:', mimeType);

    return {
      stream,
      stop: async () => {
        return new Promise<Blob>((resolve, reject) => {
          // Set up stop handler before stopping
          recorder.onstop = () => {
            console.log('Recording stopped. Total chunks:', chunks.length);
            
            // Stop all tracks
            stream.getTracks().forEach((track) => {
              track.stop();
              console.log('Stopped track:', track.kind);
            });
            
            if (chunks.length === 0) {
              console.warn('No recording data captured!');
              reject(new Error('No recording data captured'));
              return;
            }
            
            const blob = new Blob(chunks, { type: mimeType });
            console.log('Final blob created:', blob.size, 'bytes, type:', blob.type);
            
            // Verify blob is valid
            if (blob.size === 0) {
              console.error('Blob is empty!');
              reject(new Error('Recording blob is empty'));
              return;
            }
            
            resolve(blob);
          };
          
          // Handle errors during stop
          recorder.onerror = (event: any) => {
            console.error('Error during recording stop:', event.error);
            stream.getTracks().forEach((track) => track.stop());
            reject(event.error);
          };
          
          // Stop the recorder
          if (recorder.state === 'recording') {
            console.log('Stopping recorder...');
            recorder.stop();
          } else if (recorder.state === 'paused') {
            console.log('Resuming and stopping recorder...');
            recorder.resume();
            setTimeout(() => recorder.stop(), 100);
          } else {
            console.warn('Recorder already inactive, creating blob from chunks');
            stream.getTracks().forEach((track) => track.stop());
            
            if (chunks.length > 0) {
              const blob = new Blob(chunks, { type: mimeType });
              resolve(blob);
            } else {
              reject(new Error('No recording data available'));
            }
          }
        });
      },
    };
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}

export function checkMediaPermissions(): Promise<boolean> {
  return navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
      return true;
    })
    .catch(() => false);
}
