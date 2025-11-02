import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'icebreaker-user-preferences';

  constructor() {}

  /**
   * Get the PC username using various methods
   */
  getPCUsername(): string {
    try {
      console.log('UserService: Attempting to detect PC username...');
      
      // Method 1: Try to get from environment variables (Windows)
      const username = this.getSystemUsername() || 
                      this.getWindowsUsername() || 
                      this.getBrowserUsername() || 
                      this.getStoredUsername() || 
                      this.generateDefaultUsername();
      
      console.log('UserService: Detected username:', username);
      
      // Store the username for future use
      this.storeUsername(username);
      return username;
    } catch (error) {
      console.warn('Could not detect PC username:', error);
      const defaultName = this.generateDefaultUsername();
      console.log('UserService: Using default username:', defaultName);
      return defaultName;
    }
  }

  /**
   * Try to get system username from various sources
   */
  private getSystemUsername(): string | null {
    try {
      // Check if running in Electron or similar environment with Node.js access
      if (typeof (window as any)?.require !== 'undefined') {
        try {
          const os = (window as any).require('os');
          const username = os.userInfo().username;
          if (username) {
            return username;
          }
        } catch (e) {
          // Node.js not available
        }
      }

      // Try to get from environment variables if exposed (for SSR or Electron)
      if (typeof (globalThis as any)?.process !== 'undefined' && (globalThis as any).process.env) {
        const env = (globalThis as any).process.env;
        return env['USERNAME'] || 
               env['USER'] || 
               env['LOGNAME'] || 
               null;
      }

      // Try to get from browser's File System Access API
      return this.tryFileSystemUsername();
    } catch (error) {
      return null;
    }
  }

  /**
   * Attempt to infer username from file system paths (requires user interaction)
   */
  private tryFileSystemUsername(): string | null {
    try {
      // This would require user to grant file system access
      // and is mainly for demonstration - in practice, users would need to
      // click and grant permission to access their file system
      
      // For Windows, typical user profile path is C:\Users\[USERNAME]
      // We could potentially ask user to select their profile directory
      // and extract username from the path
      
      return null; // Not implementing the full file picker for this example
    } catch (error) {
      return null;
    }
  }

  /**
   * Get Windows username from various browser sources
   */
  private getWindowsUsername(): string | null {
    try {
      // Try to get from navigator.userAgent (limited info)
      const userAgent = navigator.userAgent;
      
      // Check if we can get username from any available APIs
      // Note: Most modern browsers restrict access to system info for security
      
      // Try to extract from file system API if available (very limited)
      if ('showDirectoryPicker' in window) {
        // This won't directly give us username but we could try other methods
      }

      // Try to get from localStorage if previously stored
      const stored = localStorage.getItem('pc-username');
      if (stored) {
        return stored;
      }

      return null;
    } catch (error) {
      console.warn('Could not get Windows username:', error);
      return null;
    }
  }

  /**
   * Get username from browser-specific methods
   */
  private getBrowserUsername(): string | null {
    try {
      // Try to get from browser's built-in credential manager
      if ('credentials' in navigator) {
        // This is mainly for web credentials, not system username
      }

      // Check for any stored browser profile information
      // Most browsers don't expose this for security reasons
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get previously stored username from localStorage
   */
  private getStoredUsername(): string | null {
    try {
      console.log('UserService: Checking for stored username...');
      const preferences = localStorage.getItem(this.STORAGE_KEY);
      if (preferences) {
        const parsed = JSON.parse(preferences);
        const stored = parsed.username || null;
        console.log('UserService: Found stored username:', stored);
        return stored;
      }
      console.log('UserService: No stored username found');
      return null;
    } catch (error) {
      console.warn('UserService: Error reading stored username:', error);
      return null;
    }
  }

  /**
   * Generate a default username
   */
  private generateDefaultUsername(): string {
    const adjectives = ['Cool', 'Swift', 'Brave', 'Sharp', 'Quick', 'Smart', 'Bold', 'Fast'];
    const nouns = ['Fisher', 'Player', 'Gamer', 'Hero', 'Star', 'Ace', 'Pro', 'Master'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 99) + 1;
    
    const defaultName = `${adjective}${noun}${number}`;
    console.log('UserService: Generated default username:', defaultName);
    return defaultName;
  }

  /**
   * Store username preference
   */
  private storeUsername(username: string): void {
    try {
      const preferences = {
        username: username,
        lastUsed: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
      
      // Also store simple version for quick access
      localStorage.setItem('pc-username', username);
    } catch (error) {
      console.warn('Could not store username:', error);
    }
  }

  /**
   * Allow user to manually set their preferred username
   */
  setPreferredUsername(username: string): void {
    if (username && username.trim().length > 0) {
      this.storeUsername(username.trim());
    }
  }

  /**
   * Get display name for the current user
   */
  getDisplayName(): string {
    return this.getPCUsername();
  }

  /**
   * Prompt user to enter their name if not detected
   */
  async promptForUsername(): Promise<string> {
    const storedUsername = this.getStoredUsername();
    
    if (storedUsername) {
      return storedUsername;
    }

    // For browsers that support the File System Access API, we could potentially
    // get more system information, but it requires user interaction
    try {
      if ('showDirectoryPicker' in window) {
        // We could ask user to select a directory and try to infer username
        // from the path, but this requires explicit user permission
      }
    } catch (error) {
      // Fallback to generated username
    }

    return this.generateDefaultUsername();
  }

  /**
   * Clear stored username
   */
  clearStoredUsername(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('pc-username');
    } catch (error) {
      console.warn('Could not clear stored username:', error);
    }
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): any {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }
}