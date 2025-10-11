// EmailDatabase.js - Robust email editor persistence with Dexie.js
import Dexie from 'dexie';

export class EmailDatabase extends Dexie {
  constructor() {
    super('EmailEditorDatabaseV2'); // Changed database name to avoid migration issues

    // Start fresh with version 1 using emailKey as primary key
    this.version(1).stores({
      emailEdits: 'emailKey, components, html, subject, lastModified, metadata'
    });

    // Add hooks for automatic timestamping
    this.emailEdits.hook('creating', function (primKey, obj, trans) {
      obj.lastModified = new Date();
      obj.metadata = obj.metadata || {};
    });

    this.emailEdits.hook('updating', function (modifications) {
      modifications.lastModified = new Date();
    });
  }
}

// Create database instance
export const emailDB = new EmailDatabase();

// Clean up old database on first load
(async () => {
  try {
    // Check if old database exists and delete it
    const oldDbExists = await Dexie.exists('EmailEditorDatabase');
    if (oldDbExists) {
      console.log('🗑️ [Dexie] Removing old database version');
      await Dexie.delete('EmailEditorDatabase');
      console.log('✅ [Dexie] Old database removed successfully');
    }
  } catch (error) {
    console.log('⚠️ [Dexie] Could not remove old database:', error.message);
  }
})();

// Helper functions for email editor operations
export class EmailPersistenceManager {
  static async saveEmailEdit(emailKey, data) {
    try {
      console.log('💾 [Dexie] Saving email edit for:', emailKey, {
        componentCount: data.components?.length || 0,
        htmlLength: data.html?.length || 0,
        subject: data.subject || 'empty'
      });

      // Check if global save blocking is active
      if (typeof window !== 'undefined' && window.globalSaveBlocked) {
        console.log('🔒 [Dexie] Save blocked by global protection');
        return null;
      }

      const editData = {
        emailKey, // This is now the primary key
        components: data.components || [],
        html: data.html || '',
        subject: data.subject || '',
        lastModified: new Date(),
        metadata: {
          componentCount: data.components?.length || 0,
          htmlLength: data.html?.length || 0,
          firstComponentType: data.components?.[0]?.type || 'none'
        }
      };

      // Use put to insert or update (will update existing record with same emailKey)
      const result = await emailDB.emailEdits.put(editData);
      console.log('✅ [Dexie] Email edit saved/updated successfully for key:', emailKey);
      return result;
    } catch (error) {
      console.error('❌ [Dexie] Failed to save email edit:', error);
      throw error;
    }
  }

  static async loadEmailEdit(emailKey) {
    try {
      console.log('📁 [Dexie] Loading email edit for:', emailKey);

      // Use get() since emailKey is now the primary key
      const edit = await emailDB.emailEdits.get(emailKey);

      if (edit) {
        console.log('✅ [Dexie] Email edit found:', {
          emailKey: edit.emailKey,
          componentCount: edit.components?.length || 0,
          htmlLength: edit.html?.length || 0,
          lastModified: edit.lastModified
        });
        return {
          components: edit.components || [],
          html: edit.html || '',
          subject: edit.subject || ''
        };
      } else {
        console.log('📂 [Dexie] No email edit found for:', emailKey);
        return null;
      }
    } catch (error) {
      console.error('❌ [Dexie] Failed to load email edit:', error);
      return null;
    }
  }

  static async deleteEmailEdit(emailKey) {
    try {
      console.log('🗑️ [Dexie] Deleting email edit for:', emailKey);

      // Use delete() with primary key
      await emailDB.emailEdits.delete(emailKey);

      console.log('✅ [Dexie] Deleted email edit for:', emailKey);
      return 1;
    } catch (error) {
      console.error('❌ [Dexie] Failed to delete email edit:', error);
      throw error;
    }
  }

  static async getAllEmailEdits() {
    try {
      console.log('📋 [Dexie] Loading all email edits');

      const edits = await emailDB.emailEdits.orderBy('lastModified').reverse().toArray();

      console.log('✅ [Dexie] Found', edits.length, 'email edits');
      return edits.map(edit => ({
        emailKey: edit.emailKey,
        componentCount: edit.components?.length || 0,
        htmlLength: edit.html?.length || 0,
        lastModified: edit.lastModified
      }));
    } catch (error) {
      console.error('❌ [Dexie] Failed to load all email edits:', error);
      return [];
    }
  }

  static async clearAllEmailEdits() {
    try {
      console.log('🧹 [Dexie] Clearing all email edits');

      const cleared = await emailDB.emailEdits.clear();

      console.log('✅ [Dexie] Cleared all email edits');
      return cleared;
    } catch (error) {
      console.error('❌ [Dexie] Failed to clear email edits:', error);
      throw error;
    }
  }

  // Check if an email has meaningful edits
  static async hasMeaningfulEdit(emailKey) {
    try {
      const edit = await this.loadEmailEdit(emailKey);
      if (!edit) return false;

      const hasMeaningfulContent = (edit.components && edit.components.length > 0) ||
                                 (edit.html && edit.html.length > 100);

      console.log('🔍 [Dexie] Email', emailKey, 'has meaningful edit:', hasMeaningfulContent);
      return hasMeaningfulContent;
    } catch (error) {
      console.error('❌ [Dexie] Failed to check meaningful edit:', error);
      return false;
    }
  }
}

// Debounced save function to prevent excessive database writes
export class DebouncedEmailSaver {
  constructor(delay = 1000) {
    this.delay = delay;
    this.timeouts = new Map();
  }

  save(emailKey, data) {
    // Clear existing timeout for this email
    if (this.timeouts.has(emailKey)) {
      clearTimeout(this.timeouts.get(emailKey));
    }

    // Set new timeout
    const timeoutId = setTimeout(async () => {
      try {
        await EmailPersistenceManager.saveEmailEdit(emailKey, data);
        this.timeouts.delete(emailKey);
      } catch (error) {
        console.error('❌ [Dexie] Debounced save failed:', error);
      }
    }, this.delay);

    this.timeouts.set(emailKey, timeoutId);
    console.log('⏰ [Dexie] Debounced save scheduled for:', emailKey);
  }

  // Force immediate save
  async saveImmediately(emailKey, data) {
    // Clear any pending save
    if (this.timeouts.has(emailKey)) {
      clearTimeout(this.timeouts.get(emailKey));
      this.timeouts.delete(emailKey);
    }

    // Save immediately
    return await EmailPersistenceManager.saveEmailEdit(emailKey, data);
  }
}

// Global debounced saver instance
export const debouncedSaver = new DebouncedEmailSaver(1000);