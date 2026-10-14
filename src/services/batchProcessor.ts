/**
 * PixelForge AI — Reusable Batch Processor Service
 * 
 * Manages concurrent asynchronous visual processing queues for multi-file workloads:
 * Select multiple files -> Validate -> Queue -> Concurrent Process -> Result Table -> Bulk ZIP Download
 */

import { SimpleZipBuilder, triggerBlobDownload } from '../utils/zipUtil';
import { providerRouter } from '../ai/providerRouter';

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  dataUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
}

export type BatchProcessorListener = (items: BatchItem[]) => void;

export class BatchProcessor {
  private items: BatchItem[] = [];
  private listeners: BatchProcessorListener[] = [];
  private isProcessing = false;
  private maxConcurrency = 2;

  public subscribe(listener: BatchProcessorListener): () => void {
    this.listeners.push(listener);
    listener([...this.items]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const copy = [...this.items];
    this.listeners.forEach((l) => l(copy));
  }

  public async addFiles(files: FileList | File[]): Promise<void> {
    const list = Array.from(files);
    for (const file of list) {
      // Validate file type & size
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 25 * 1024 * 1024) continue; // 25MB max

      const id = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const dataUrl = await this.readFileAsDataUrl(file);

      this.items.push({
        id,
        file,
        name: file.name,
        size: file.size,
        dataUrl,
        status: 'queued',
        progress: 0,
      });
    }
    this.notify();
  }

  public removeItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.notify();
  }

  public clearAll(): void {
    this.items = [];
    this.notify();
  }

  public async startProcessing(
    toolSlug: string,
    processFn?: (item: BatchItem) => Promise<string>
  ): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const queuedItems = this.items.filter((item) => item.status === 'queued' || item.status === 'failed');

    for (const item of queuedItems) {
      item.status = 'processing';
      item.progress = 25;
      this.notify();

      try {
        let result: string;
        if (processFn) {
          result = await processFn(item);
        } else {
          // Default to providerRouter background removal
          const res = await providerRouter.routeBackgroundRemoval(toolSlug, item.dataUrl);
          if (!res.success || !res.data) throw new Error(res.error || 'Processing failed');
          result = res.data.imageUrl;
        }

        item.resultUrl = result;
        item.status = 'completed';
        item.progress = 100;
      } catch (err: any) {
        item.status = 'failed';
        item.error = err.message || 'Processing failed';
        item.progress = 0;
      }
      this.notify();
    }

    this.isProcessing = false;
  }

  public async downloadBulkZip(archiveName = 'pixelforge-results.zip'): Promise<void> {
    const completedItems = this.items.filter((item) => item.status === 'completed' && item.resultUrl);
    if (completedItems.length === 0) return;

    const zip = new SimpleZipBuilder();
    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i];
      const ext = item.resultUrl?.startsWith('data:image/webp') ? '.webp' : '.png';
      const cleanName = item.name.replace(/\.[^/.]+$/, '');
      const zipFileName = `${cleanName}_cutout_${i + 1}${ext}`;
      await zip.addFileFromDataUrl(zipFileName, item.resultUrl!);
    }

    const blob = zip.generateZipBlob();
    triggerBlobDownload(blob, archiveName);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
