/**
 * LinkedIn Rate Limiter
 * Prevents multiple simultaneous LinkedIn scraper requests
 */

class LinkedInRateLimiter {
  constructor() {
    this.activeRequests = new Set();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  async executeWithRateLimit(requestId, searchQuery, executor) {
    // Check if same query is already being processed
    if (this.activeRequests.has(searchQuery)) {
      console.log(`   ⏳ LinkedIn search for "${searchQuery}" already in progress, waiting...`);
      
      // Wait for existing request to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.activeRequests.has(searchQuery)) {
            clearInterval(checkInterval);
            resolve([]);  // Return empty for duplicate requests
          }
        }, 1000);
      });
    }

    // Add to active requests
    this.activeRequests.add(searchQuery);
    console.log(`   🔐 Starting LinkedIn search for: "${searchQuery}"`);

    try {
      const result = await executor();
      return result;
    } catch (error) {
      console.log(`   ❌ LinkedIn search failed: ${error.message}`);
      return [];
    } finally {
      // Remove from active requests
      this.activeRequests.delete(searchQuery);
      console.log(`   ✅ Completed LinkedIn search for: "${searchQuery}"`);
    }
  }

  getActiveRequestsCount() {
    return this.activeRequests.size;
  }

  isQueryActive(searchQuery) {
    return this.activeRequests.has(searchQuery);
  }
}

// Singleton instance
const linkedInRateLimiter = new LinkedInRateLimiter();

module.exports = linkedInRateLimiter;