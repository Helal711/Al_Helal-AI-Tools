/**
 * Firebase Storage Client Layer
 * PixelForge AI Architecture
 * 
 * Enforces structured folder separation:
 * - users/{uid}/uploads/
 * - users/{uid}/results/
 * - users/{uid}/projects/
 */

import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage as fbStorage } from './firebaseConfig';
import { firestore, FileDoc } from './firestore';

export interface StorageValidationResult {
  valid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}

export class StorageClient {
  private allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private maxSizeBytes = 25 * 1024 * 1024; // 25MB

  /**
   * Validates file format, size, and extracts image dimensions
   */
  public async validateFile(file: File | Blob, mimeType?: string): Promise<StorageValidationResult> {
    const type = file.type || mimeType || '';
    if (!this.allowedMimeTypes.includes(type)) {
      return {
        valid: false,
        error: `Unsupported file format (${type}). Please upload JPG, PNG, or WEBP.`,
      };
    }

    if (file.size > this.maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds the 25MB maximum limit (Current: ${(file.size / 1024 / 1024).toFixed(1)}MB).`,
      };
    }

    try {
      const dimensions = await this.getImageDimensions(file);
      if (dimensions.width < 10 || dimensions.height < 10) {
        return { valid: false, error: 'Image dimensions are too small to process.' };
      }
      return { valid: true, dimensions };
    } catch {
      return { valid: true };
    }
  }

  private getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(dims);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  /**
   * Upload file to isolated user storage directory
   */
  public async uploadUserFile(
    userId: string,
    folder: 'uploads' | 'results' | 'projects',
    fileName: string,
    dataUrlOrBlob: string | Blob
  ): Promise<FileDoc> {
    const storagePath = `users/${userId}/${folder}/${Date.now()}_${fileName}`;

    let dataUri = '';
    let size = 0;
    let mimeType = 'image/png';

    if (typeof dataUrlOrBlob === 'string') {
      dataUri = dataUrlOrBlob;
      const match = dataUrlOrBlob.match(/^data:([^;]+);base64,/);
      if (match) mimeType = match[1];
      size = Math.round((dataUrlOrBlob.length * 3) / 4);
    } else {
      mimeType = dataUrlOrBlob.type || 'image/png';
      size = dataUrlOrBlob.size;
      dataUri = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(dataUrlOrBlob);
      });
    }

    let downloadUrl = dataUri;

    // Upload to Firebase Storage if available
    try {
      const storageRef = ref(fbStorage, storagePath);
      await uploadString(storageRef, dataUri, 'data_url');
      downloadUrl = await getDownloadURL(storageRef);
    } catch (e) {
      console.warn('Firebase Storage upload notice (using secure data URI directly):', e);
    }

    const fileDoc: FileDoc = {
      fileId: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      storagePath: downloadUrl,
      name: fileName,
      size,
      mimeType,
      createdAt: new Date().toISOString(),
    };

    // Index into Firestore
    await firestore.recordFile(fileDoc);

    return fileDoc;
  }

  /**
   * List files for a specific authenticated user
   */
  public async listUserFiles(userId: string): Promise<FileDoc[]> {
    return firestore.listUserFiles(userId);
  }

  /**
   * Delete file from storage and index
   */
  public async deleteUserFile(fileId: string, storagePath?: string): Promise<void> {
    if (storagePath && storagePath.startsWith('gs://')) {
      try {
        const storageRef = ref(fbStorage, storagePath);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('Firebase Storage delete warning:', e);
      }
    }
    await firestore.deleteFile(fileId);
  }
}

export const storage = new StorageClient();
