import React, { createContext, useContext, useState, useEffect } from 'react';
import { GeneratedImageItem } from '../types';
import { useAuth } from './AuthContext';
import { firestore, ProjectDoc, GenerationDoc } from '../firebase/firestore';
import { auth } from '../firebase/firebaseConfig';

interface HistoryContextType {
  history: GeneratedImageItem[];
  addHistoryItem: (item: Omit<GeneratedImageItem, 'id' | 'createdAt'>) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
  downloadCount: number;
  incrementDownloads: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GeneratedImageItem[]>(() => {
    try {
      const stored = localStorage.getItem('pixelforge_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [downloadCount, setDownloadCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('pixelforge_downloads') || '18', 10);
    } catch {
      return 18;
    }
  });

  // Sync with Firestore projects for authenticated user
  useEffect(() => {
    if (!user?.uid || !auth.currentUser) return;

    try {
      const unsubscribe = firestore.subscribeUserProjects(user.uid, (projects) => {
        if (projects.length > 0) {
          const mapped: GeneratedImageItem[] = projects.map((p) => ({
            id: p.projectId,
            tool: p.tool,
            url: p.resultFile || p.originalFile || '',
            processedImage: p.resultFile || '',
            originalUrl: p.originalFile || '',
            originalImage: p.originalFile || '',
            createdAt: p.createdAt,
            metadata: p.metadata,
          }));
          setHistory((prev) => {
            const existingIds = new Set(mapped.map((m) => m.id));
            const uniqueLocals = prev.filter((p) => !existingIds.has(p.id));
            return [...mapped, ...uniqueLocals];
          });
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore project subscription notice:', e);
    }
  }, [user?.uid]);

  useEffect(() => {
    try {
      localStorage.setItem('pixelforge_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Local storage quota notice for history', e);
    }
  }, [history]);

  useEffect(() => {
    localStorage.setItem('pixelforge_downloads', downloadCount.toString());
  }, [downloadCount]);

  const addHistoryItem = (item: Omit<GeneratedImageItem, 'id' | 'createdAt'>) => {
    const timestamp = new Date().toISOString();
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const finalUrl = item.url || item.processedImage || item.originalImage || '';
    const finalOrig = item.originalUrl || item.originalImage || '';

    const newItem: GeneratedImageItem = {
      ...item,
      id,
      url: finalUrl,
      processedImage: item.processedImage || finalUrl,
      originalUrl: finalOrig,
      originalImage: finalOrig,
      createdAt: timestamp,
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);

    // Persist to Firestore if user is authenticated with Firebase
    if (user?.uid && auth.currentUser) {
      const projectDoc: ProjectDoc = {
        projectId: id,
        userId: user.uid,
        name: `${item.tool} Creation`,
        tool: item.tool,
        originalFile: finalOrig,
        resultFile: finalUrl,
        status: 'completed',
        createdAt: timestamp,
        updatedAt: timestamp,
        metadata: item.metadata,
      };

      const generationDoc: GenerationDoc = {
        generationId: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.uid,
        tool: item.tool,
        prompt: item.prompt,
        inputFile: finalOrig,
        outputFile: finalUrl,
        model: 'gemini-3.1-flash-lite-image',
        provider: 'Google AI Studio',
        status: 'completed',
        createdAt: timestamp,
        processingTime: item.metadata?.processingTimeMs || 850,
      };

      firestore.setProject(projectDoc).catch((e) => console.warn('Firestore setProject log:', e));
      firestore.logGeneration(generationDoc).catch((e) => console.warn('Firestore logGeneration:', e));
    }
  };

  const removeHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (user?.uid && auth.currentUser) {
      firestore.deleteProject(id).catch((e) => console.warn('Firestore deleteProject error:', e));
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const incrementDownloads = () => {
    setDownloadCount((prev) => prev + 1);
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addHistoryItem,
        removeHistoryItem,
        clearHistory,
        downloadCount,
        incrementDownloads,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within a HistoryProvider');
  return context;
}
