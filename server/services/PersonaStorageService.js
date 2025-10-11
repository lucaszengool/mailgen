/**
 * Persona Storage Service
 * Handles storage and retrieval of LinkedIn-generated user personas
 * Integrates with Redis for fast persona lookup and caching
 */

const fs = require('fs').promises;
const path = require('path');

class PersonaStorageService {
  constructor() {
    this.storageDir = path.join(__dirname, '../data/personas');
    this.indexFile = path.join(this.storageDir, 'persona_index.json');
    this.personas = new Map(); // In-memory cache
    
    this.initializeStorage();
    console.log('👤 Persona Storage Service initialized');
  }

  /**
   * Initialize storage directory and load existing personas
   */
  async initializeStorage() {
    try {
      // Create storage directory if it doesn't exist
      await fs.mkdir(this.storageDir, { recursive: true });
      
      // Load existing persona index
      await this.loadPersonaIndex();
      
      console.log(`✅ Loaded ${this.personas.size} existing personas`);
    } catch (error) {
      console.log('⚠️ Error initializing persona storage:', error.message);
    }
  }

  /**
   * Load persona index from file
   */
  async loadPersonaIndex() {
    try {
      const indexData = await fs.readFile(this.indexFile, 'utf8');
      const personaIndex = JSON.parse(indexData);
      
      for (const [key, personaData] of Object.entries(personaIndex)) {
        this.personas.set(key, personaData);
      }
    } catch (error) {
      // Index file doesn't exist yet, start with empty index
      console.log('📝 Creating new persona index');
    }
  }

  /**
   * Save persona index to file
   */
  async savePersonaIndex() {
    try {
      const personaIndex = Object.fromEntries(this.personas);
      await fs.writeFile(this.indexFile, JSON.stringify(personaIndex, null, 2));
    } catch (error) {
      console.error('❌ Error saving persona index:', error.message);
    }
  }

  /**
   * Store a persona with profile data
   */
  async storePersona(email, profileData, persona) {
    try {
      const personaKey = this.generatePersonaKey(email);
      const timestamp = new Date().toISOString();
      
      const personaRecord = {
        email: email,
        profileData: profileData,
        persona: persona,
        createdAt: timestamp,
        lastAccessed: timestamp,
        accessCount: 1,
        linkedinProfile: profileData.url,
        name: profileData.name,
        company: profileData.experience?.[0]?.company,
        headline: profileData.headline,
        location: profileData.location
      };

      // Store in memory cache
      this.personas.set(personaKey, personaRecord);
      
      // Save individual persona file
      const personaFile = path.join(this.storageDir, `${personaKey}.json`);
      await fs.writeFile(personaFile, JSON.stringify(personaRecord, null, 2));
      
      // Update index
      await this.savePersonaIndex();
      
      console.log(`💾 Stored persona for ${email} (${profileData.name})`);
      return personaKey;

    } catch (error) {
      console.error('❌ Error storing persona:', error.message);
      return null;
    }
  }

  /**
   * Retrieve persona by email
   */
  async getPersona(email) {
    try {
      const personaKey = this.generatePersonaKey(email);
      let personaRecord = this.personas.get(personaKey);
      
      if (!personaRecord) {
        // Try loading from file
        const personaFile = path.join(this.storageDir, `${personaKey}.json`);
        try {
          const fileData = await fs.readFile(personaFile, 'utf8');
          personaRecord = JSON.parse(fileData);
          this.personas.set(personaKey, personaRecord);
        } catch {
          return null;
        }
      }

      if (personaRecord) {
        // Update access tracking
        personaRecord.lastAccessed = new Date().toISOString();
        personaRecord.accessCount = (personaRecord.accessCount || 0) + 1;
        await this.savePersonaIndex();
        
        console.log(`📖 Retrieved persona for ${email}`);
        return personaRecord;
      }

      return null;
    } catch (error) {
      console.error('❌ Error retrieving persona:', error.message);
      return null;
    }
  }

  /**
   * Search personas by criteria
   */
  async searchPersonas(criteria) {
    try {
      const results = [];
      
      for (const [key, persona] of this.personas) {
        let matches = true;
        
        if (criteria.company && !persona.company?.toLowerCase().includes(criteria.company.toLowerCase())) {
          matches = false;
        }
        
        if (criteria.industry && !persona.profileData?.industry?.toLowerCase().includes(criteria.industry.toLowerCase())) {
          matches = false;
        }
        
        if (criteria.location && !persona.location?.toLowerCase().includes(criteria.location.toLowerCase())) {
          matches = false;
        }
        
        if (criteria.skills && persona.profileData?.skills) {
          const hasSkill = persona.profileData.skills.some(skill => 
            criteria.skills.some(searchSkill => 
              skill.toLowerCase().includes(searchSkill.toLowerCase())
            )
          );
          if (!hasSkill) matches = false;
        }
        
        if (matches) {
          results.push(persona);
        }
      }
      
      console.log(`🔍 Found ${results.length} personas matching criteria`);
      return results;
    } catch (error) {
      console.error('❌ Error searching personas:', error.message);
      return [];
    }
  }

  /**
   * Get all personas with optional pagination
   */
  async getAllPersonas(page = 1, limit = 20) {
    try {
      const allPersonas = Array.from(this.personas.values());
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedPersonas = allPersonas
        .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
        .slice(startIndex, endIndex);
      
      return {
        personas: paginatedPersonas,
        total: allPersonas.length,
        page: page,
        totalPages: Math.ceil(allPersonas.length / limit)
      };
    } catch (error) {
      console.error('❌ Error getting all personas:', error.message);
      return { personas: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Update persona data
   */
  async updatePersona(email, updates) {
    try {
      const personaKey = this.generatePersonaKey(email);
      const personaRecord = this.personas.get(personaKey);
      
      if (!personaRecord) {
        console.log(`⚠️ Persona not found for ${email}`);
        return false;
      }

      // Merge updates
      Object.assign(personaRecord, updates);
      personaRecord.updatedAt = new Date().toISOString();
      
      // Save to file
      const personaFile = path.join(this.storageDir, `${personaKey}.json`);
      await fs.writeFile(personaFile, JSON.stringify(personaRecord, null, 2));
      
      // Update index
      await this.savePersonaIndex();
      
      console.log(`📝 Updated persona for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating persona:', error.message);
      return false;
    }
  }

  /**
   * Delete persona
   */
  async deletePersona(email) {
    try {
      const personaKey = this.generatePersonaKey(email);
      
      // Remove from memory
      this.personas.delete(personaKey);
      
      // Delete file
      const personaFile = path.join(this.storageDir, `${personaKey}.json`);
      try {
        await fs.unlink(personaFile);
      } catch {
        // File might not exist
      }
      
      // Update index
      await this.savePersonaIndex();
      
      console.log(`🗑️ Deleted persona for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting persona:', error.message);
      return false;
    }
  }

  /**
   * Get persona statistics
   */
  getPersonaStats() {
    const stats = {
      totalPersonas: this.personas.size,
      byCompany: {},
      byLocation: {},
      recentlyAccessed: 0
    };

    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const persona of this.personas.values()) {
      // Count by company
      if (persona.company) {
        stats.byCompany[persona.company] = (stats.byCompany[persona.company] || 0) + 1;
      }
      
      // Count by location
      if (persona.location) {
        stats.byLocation[persona.location] = (stats.byLocation[persona.location] || 0) + 1;
      }
      
      // Count recently accessed
      if (new Date(persona.lastAccessed).getTime() > oneWeekAgo) {
        stats.recentlyAccessed++;
      }
    }

    return stats;
  }

  /**
   * Generate a unique key for persona storage
   */
  generatePersonaKey(email) {
    return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Export personas for backup
   */
  async exportPersonas() {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        personas: Object.fromEntries(this.personas)
      };
      
      const exportFile = path.join(this.storageDir, `personas_export_${Date.now()}.json`);
      await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
      
      console.log(`📦 Exported ${this.personas.size} personas to ${exportFile}`);
      return exportFile;
    } catch (error) {
      console.error('❌ Error exporting personas:', error.message);
      return null;
    }
  }
}

module.exports = PersonaStorageService;