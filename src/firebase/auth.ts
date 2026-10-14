/**
 * Firebase Authentication Client Layer
 * PixelForge AI Architecture
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth as fbAuth, googleAuthProvider } from './firebaseConfig';
import { firestore, UserDoc } from './firestore';

const ADMIN_BOOTSTRAP_EMAIL = 'alhelal711@gmail.com';

class AuthClient {
  private user: UserDoc | null = null;
  private isReady: boolean = false;
  private listeners: Array<(user: UserDoc | null) => void> = [];
  private unsubscribeFbAuth: (() => void) | null = null;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    this.unsubscribeFbAuth = fbOnAuthStateChanged(fbAuth, async (fbUser: FirebaseUser | null) => {
      this.isReady = true;
      if (fbUser) {
        try {
          const isBootstrapAdmin = fbUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;
          let userDoc = await firestore.getUser(fbUser.uid);

          if (!userDoc) {
            // New user registration in Firestore
            userDoc = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator',
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || '',
              role: isBootstrapAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              status: 'active',
              settings: {
                theme: 'light',
                defaultFormat: 'png',
                autoEnhance: true,
                notificationsEnabled: true,
              },
            };
            await firestore.setUser(fbUser.uid, userDoc);
          } else {
            // Update last login
            const updates: Partial<UserDoc> = {
              lastLoginAt: new Date().toISOString(),
            };
            if (isBootstrapAdmin && userDoc.role !== 'admin') {
              updates.role = 'admin';
            }
            await firestore.setUser(fbUser.uid, updates);
            userDoc = { ...userDoc, ...updates };
          }
          this.user = userDoc;
        } catch (e) {
          console.warn('Firestore user fetch note:', e);
          const isBootstrapAdmin = fbUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;
          this.user = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Creator',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || '',
            role: isBootstrapAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            status: 'active',
          };
        }
      } else {
        // Unauthenticated visitor
        this.user = null;
      }
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.user));
  }

  public onAuthStateChanged(callback: (user: UserDoc | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.user);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public getCurrentUser(): UserDoc | null {
    return this.user;
  }

  public isAuthReady(): boolean {
    return this.isReady;
  }

  public isFirebaseAuthenticated(): boolean {
    return Boolean(fbAuth.currentUser);
  }

  public async signInWithGoogle(): Promise<UserDoc> {
    try {
      const result = await signInWithPopup(fbAuth, googleAuthProvider);
      const fbUser = result.user;
      const isBootstrapAdmin = fbUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;

      let userDoc = await firestore.getUser(fbUser.uid);
      if (!userDoc) {
        userDoc = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Google Creator',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
          role: isBootstrapAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          status: 'active',
          settings: {
            theme: 'light',
            defaultFormat: 'png',
            autoEnhance: true,
            notificationsEnabled: true,
          },
        };
        await firestore.setUser(fbUser.uid, userDoc);
      }
      this.user = userDoc;
      this.notifyListeners();
      return userDoc;
    } catch (err: any) {
      console.warn('Google Popup sign in notice:', err?.message || err);
      throw err;
    }
  }

  public async signInWithEmail(email: string, password?: string): Promise<UserDoc> {
    if (password) {
      const cred = await signInWithEmailAndPassword(fbAuth, email, password);
      const fbUser = cred.user;
      const userDoc = await firestore.getUser(fbUser.uid);
      if (userDoc) {
        this.user = userDoc;
        this.notifyListeners();
        return userDoc;
      }
    }
    throw new Error('Please enter valid email and password credentials.');
  }

  public async signUpWithEmail(name: string, email: string, password?: string): Promise<UserDoc> {
    if (password) {
      const cred = await createUserWithEmailAndPassword(fbAuth, email, password);
      const fbUser = cred.user;
      const isBootstrapAdmin = email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;
      const newUser: UserDoc = {
        uid: fbUser.uid,
        displayName: name,
        email,
        role: isBootstrapAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: 'active',
        settings: {
          theme: 'light',
          defaultFormat: 'png',
          autoEnhance: true,
          notificationsEnabled: true,
        },
      };
      await firestore.setUser(fbUser.uid, newUser);
      this.user = newUser;
      this.notifyListeners();
      return newUser;
    }
    throw new Error('Password is required for registration.');
  }

  public async signOut(): Promise<void> {
    try {
      await fbSignOut(fbAuth);
    } catch {
      // Ignore
    }
    this.user = null;
    this.notifyListeners();
  }

  public async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(fbAuth, email);
    } catch (e) {
      console.log('Password reset request logged for:', email, e);
    }
  }

  public async updateProfile(updates: Partial<UserDoc>): Promise<UserDoc | null> {
    if (!this.user || !fbAuth.currentUser) return null;
    const sanitized = { ...updates };
    // Non-admins cannot grant themselves admin
    if (sanitized.role && this.user.role !== 'admin') {
      delete sanitized.role;
    }
    const updated = { ...this.user, ...sanitized };
    this.user = updated;
    await firestore.setUser(fbAuth.currentUser.uid, sanitized);
    this.notifyListeners();
    return updated;
  }

  public toggleAdminRole(): void {
    if (!this.user) return;
    // Privilege escalation prevention: client cannot grant admin role without verified admin email
    if (this.user.email.toLowerCase() !== ADMIN_BOOTSTRAP_EMAIL) {
      console.warn('Unauthorized role change attempt rejected: client-side escalation prevented.');
      return;
    }
    const newRole = this.user.role === 'admin' ? 'user' : 'admin';
    this.user = { ...this.user, role: newRole as 'user' | 'admin' };
    this.notifyListeners();
  }
}

export const auth = new AuthClient();
