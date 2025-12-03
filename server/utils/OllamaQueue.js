const axios = require('axios');

/**
 * Ollama Request Queue Manager
 * Handles concurrent Ollama API calls with rate limiting and queue management
 * Optimized for Railway deployment with multiple users and campaigns
 */
class OllamaQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 5; // Max concurrent Ollama calls
    this.timeout = options.timeout || 60000; // 60s timeout per request
    this.ollamaUrl = options.ollamaUrl || process.env.OLLAMA_URL || 'http://localhost:11434';

    // Queue management
    this.queue = []; // Pending requests
    this.running = new Map(); // Currently running requests (key: requestId)
    this.completed = new Map(); // Completed requests cache (key: requestId)

    // Statistics
    this.stats = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      peakConcurrent: 0
    };

    console.log(`🎯 OllamaQueue initialized: maxConcurrent=${this.maxConcurrent}, timeout=${this.timeout}ms`);
  }

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId(userId, campaignId) {
    return `${userId}_${campaignId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add request to queue
   */
  async enqueue(request) {
    const { userId, campaignId, model, prompt, options = {} } = request;
    const requestId = this.generateRequestId(userId, campaignId);

    this.stats.totalRequests++;

    const queueItem = {
      requestId,
      userId,
      campaignId,
      model,
      prompt,
      options,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries || 2
    };

    // Check if we can run immediately
    if (this.running.size < this.maxConcurrent) {
      console.log(`🚀 [${requestId}] Executing immediately (${this.running.size}/${this.maxConcurrent} slots used)`);
      return this.executeRequest(queueItem);
    }

    // Add to queue
    console.log(`⏳ [${requestId}] Added to queue (position: ${this.queue.length + 1}, running: ${this.running.size})`);
    this.queue.push(queueItem);

    // 🔥 CRITICAL FIX: Add queue timeout to prevent stuck requests
    const QUEUE_TIMEOUT = 120000; // 2 minutes max wait in queue

    // Return a promise that resolves when request is processed OR times out
    return new Promise((resolve, reject) => {
      queueItem.resolve = resolve;
      queueItem.reject = reject;

      // Queue timeout - reject if waiting too long
      queueItem.queueTimeout = setTimeout(() => {
        // Remove from queue if still there
        const index = this.queue.indexOf(queueItem);
        if (index > -1) {
          this.queue.splice(index, 1);
          console.error(`⏰ [${requestId}] Queue timeout after ${QUEUE_TIMEOUT}ms - request removed from queue`);
          reject(new Error(`Queue timeout: request waited more than ${QUEUE_TIMEOUT / 1000} seconds`));
        }
      }, QUEUE_TIMEOUT);
    });
  }

  /**
   * Execute a request
   */
  async executeRequest(queueItem) {
    const { requestId, userId, campaignId, model, prompt, options } = queueItem;

    // 🔥 Clear queue timeout when starting execution
    if (queueItem.queueTimeout) {
      clearTimeout(queueItem.queueTimeout);
      queueItem.queueTimeout = null;
    }

    this.running.set(requestId, queueItem);

    // Update peak concurrent
    if (this.running.size > this.stats.peakConcurrent) {
      this.stats.peakConcurrent = this.running.size;
    }

    const startTime = Date.now();

    try {
      console.log(`🔄 [${requestId}] Executing Ollama request for user=${userId}, campaign=${campaignId}, model=${model}`);

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.timeout);
      });

      // Create Ollama request promise
      const ollamaPromise = axios.post(`${this.ollamaUrl}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || 1000,
          ...options
        }
      });

      // Race between timeout and actual request
      const response = await Promise.race([ollamaPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      // Update statistics
      this.stats.completedRequests++;
      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.completedRequests - 1) + duration) /
        this.stats.completedRequests;

      console.log(`✅ [${requestId}] Completed in ${duration}ms (avg: ${Math.round(this.stats.averageResponseTime)}ms)`);

      // Cache result
      this.completed.set(requestId, {
        response: response.data,
        timestamp: Date.now()
      });

      // Clean up
      this.running.delete(requestId);
      this.processQueue();

      // Resolve if this was queued
      if (queueItem.resolve) {
        queueItem.resolve(response.data);
      }

      return response.data;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${requestId}] Failed after ${duration}ms:`, error.message);

      // Retry logic
      if (queueItem.retries < queueItem.maxRetries) {
        queueItem.retries++;
        console.log(`🔄 [${requestId}] Retrying (${queueItem.retries}/${queueItem.maxRetries})`);

        this.running.delete(requestId);

        // Re-queue with delay
        setTimeout(() => {
          this.executeRequest(queueItem);
        }, 1000 * queueItem.retries); // Exponential backoff

      } else {
        this.stats.failedRequests++;
        this.running.delete(requestId);
        this.processQueue();

        if (queueItem.reject) {
          queueItem.reject(error);
        }

        throw error;
      }
    }
  }

  /**
   * Process next item in queue
   */
  processQueue() {
    // Process as many items as we have capacity for
    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const nextItem = this.queue.shift();
      console.log(`📤 [${nextItem.requestId}] Processing from queue (${this.queue.length} remaining)`);
      this.executeRequest(nextItem);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queue: {
        pending: this.queue.length,
        running: this.running.size,
        maxConcurrent: this.maxConcurrent
      },
      stats: {
        ...this.stats,
        averageResponseTime: Math.round(this.stats.averageResponseTime)
      },
      runningRequests: Array.from(this.running.values()).map(r => ({
        requestId: r.requestId,
        userId: r.userId,
        campaignId: r.campaignId,
        duration: Date.now() - r.timestamp
      }))
    };
  }

  /**
   * Clear old completed requests (cleanup)
   */
  cleanup(maxAge = 300000) { // 5 minutes
    const now = Date.now();
    for (const [requestId, data] of this.completed.entries()) {
      if (now - data.timestamp > maxAge) {
        this.completed.delete(requestId);
      }
    }
  }
}

// Singleton instance
let ollamaQueue = null;

function getOllamaQueue(options) {
  if (!ollamaQueue) {
    ollamaQueue = new OllamaQueue(options);

    // Auto cleanup every 5 minutes
    setInterval(() => {
      ollamaQueue.cleanup();
    }, 300000);
  }
  return ollamaQueue;
}

module.exports = { OllamaQueue, getOllamaQueue };
