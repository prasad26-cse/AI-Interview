import localForage from 'localforage';
import { UUID } from '@/types';

// Configure localForage for blob storage with error handling
let blobStore: LocalForage;
let settingsStore: LocalForage;

try {
  blobStore = localForage.createInstance({
    name: 'ai-interview-blobs',
    storeName: 'recordings',
    description: 'Storage for interview recordings',
  });

  settingsStore = localForage.createInstance({
    name: 'ai-interview-settings',
    storeName: 'settings',
    description: 'Storage for application settings',
  });
} catch (error) {
  console.error('Failed to initialize storage:', error);
  throw new Error('Storage initialization failed. Please check browser compatibility.');
}

export async function saveRecording(blobId: UUID, blob: Blob): Promise<void> {
  if (!blobId) {
    throw new Error('Recording ID is required');
  }

  if (!blob || blob.size === 0) {
    throw new Error('Invalid recording blob');
  }

  try {
    await blobStore.setItem(blobId, blob);
  } catch (error: any) {
    console.error('Failed to save recording:', error);
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please clear some old recordings.');
    }
    throw new Error('Failed to save recording. Please try again.');
  }
}

export async function getRecording(blobId: UUID): Promise<Blob | null> {
  if (!blobId) {
    console.warn('No recording ID provided');
    return null;
  }

  try {
    return await blobStore.getItem<Blob>(blobId);
  } catch (error) {
    console.error('Failed to retrieve recording:', error);
    return null;
  }
}

export async function deleteRecording(blobId: UUID): Promise<void> {
  if (!blobId) {
    console.warn('No recording ID provided for deletion');
    return;
  }

  try {
    await blobStore.removeItem(blobId);
  } catch (error) {
    console.error('Failed to delete recording:', error);
    // Don't throw - deletion failures shouldn't block other operations
  }
}

export async function saveApiKey(apiKey: string): Promise<void> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  try {
    await settingsStore.setItem('geminiApiKey', apiKey.trim());
  } catch (error) {
    console.error('Failed to save API key:', error);
    throw new Error('Failed to save API key. Please try again.');
  }
}

export async function getApiKey(): Promise<string | null> {
  try {
    return await settingsStore.getItem<string>('geminiApiKey');
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    return null;
  }
}

export async function clearApiKey(): Promise<void> {
  try {
    await settingsStore.removeItem('geminiApiKey');
  } catch (error) {
    console.error('Failed to clear API key:', error);
    throw new Error('Failed to clear API key. Please try again.');
  }
}

// Health check function
export async function checkStorageHealth(): Promise<boolean> {
  try {
    const testKey = '__storage_test__';
    const testValue = 'test';
    await settingsStore.setItem(testKey, testValue);
    const retrieved = await settingsStore.getItem(testKey);
    await settingsStore.removeItem(testKey);
    return retrieved === testValue;
  } catch (error) {
    console.error('Storage health check failed:', error);
    return false;
  }
}
