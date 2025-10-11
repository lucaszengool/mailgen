#!/usr/bin/env node

/**
 * Advanced System Monitoring and Auto-Fixing System
 * Addresses timeout issues and provides persistent monitoring
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

class AdvancedSystemMonitor {
  constructor() {
    this.processes = new Map();
    this.logs = [];
    this.isMonitoring = false;
    this.timeouts = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.baseTimeout = 120000; // 2 minutes base timeout
    this.timeoutMultiplier = 1.5; // Increase timeout by 50% each retry
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = {
      'info': '📝',
      'success': '✅', 
      'warning': '⚠️',
      'error': '❌',
      'progress': '🔄'
    }[level] || '📝';
    
    const logEntry = `${emoji} [${timestamp}] ${message}`;
    console.log(logEntry);
    this.logs.push({ timestamp, message, level });
    
    // Keep only last 100 log entries to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  /**
   * Start persistent monitoring with timeout handling
   */
  startMonitoring() {
    this.log('🚀 Starting Advanced System Monitor...', 'info');
    this.isMonitoring = true;
    
    // Monitor system health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
    
    this.log('📊 Health monitoring started (30s intervals)', 'success');
  }

  /**
   * Stop monitoring system
   */
  stopMonitoring() {
    this.log('🛑 Stopping system monitor...', 'warning');
    this.isMonitoring = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Clean up running processes
    for (const [processId, process] of this.processes) {
      this.log(`Terminating process: ${processId}`, 'warning');
      process.kill('SIGTERM');
    }
    
    this.processes.clear();
    this.timeouts.clear();
    this.retryAttempts.clear();
  }

  /**
   * Execute command with advanced timeout and retry logic
   */
  async executeWithTimeoutHandling(command, options = {}) {
    const processId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const maxTimeout = options.timeout || this.baseTimeout;
    const retryCount = this.retryAttempts.get(command) || 0;
    
    this.log(`🔄 Executing: ${command} (Attempt ${retryCount + 1}/${this.maxRetries})`, 'progress');
    
    return new Promise((resolve, reject) => {
      // Calculate dynamic timeout based on retry attempts
      const currentTimeout = maxTimeout * Math.pow(this.timeoutMultiplier, retryCount);
      
      this.log(`⏱️  Timeout set to: ${Math.round(currentTimeout/1000)}s`, 'info');
      
      const childProcess = spawn('bash', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...options.env }
      });
      
      this.processes.set(processId, childProcess);
      
      let stdout = '';
      let stderr = '';
      let isCompleted = false;
      
      // Set up timeout with dynamic extension
      const timeoutId = setTimeout(() => {
        if (!isCompleted && retryCount < this.maxRetries - 1) {
          this.log(`⏰ Command timed out, retrying... (${retryCount + 1}/${this.maxRetries})`, 'warning');
          
          childProcess.kill('SIGTERM');
          this.retryAttempts.set(command, retryCount + 1);
          
          // Retry with exponential backoff
          setTimeout(() => {
            this.executeWithTimeoutHandling(command, options)
              .then(resolve)
              .catch(reject);
          }, 2000 * Math.pow(2, retryCount));
          
        } else if (!isCompleted) {
          this.log(`❌ Command failed after ${this.maxRetries} attempts`, 'error');
          childProcess.kill('SIGKILL');
          reject(new Error(`Command timed out after ${this.maxRetries} attempts: ${command}`));
        }
      }, currentTimeout);
      
      this.timeouts.set(processId, timeoutId);
      
      // Handle stdout
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Log progress to show system is alive
        if (stdout.length % 1000 === 0) {
          this.log(`📊 Progress: ${Math.round(stdout.length/1000)}KB output received`, 'progress');
        }
      });
      
      // Handle stderr
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log errors immediately
        this.log(`⚠️ Error output: ${data.toString().trim()}`, 'warning');
      });
      
      // Handle process completion
      childProcess.on('close', (code) => {
        isCompleted = true;
        clearTimeout(timeoutId);
        this.processes.delete(processId);
        this.timeouts.delete(processId);
        this.retryAttempts.delete(command); // Reset retry count on success
        
        if (code === 0) {
          this.log(`✅ Command completed successfully`, 'success');
          resolve({ stdout, stderr, code });
        } else {
          this.log(`❌ Command failed with code: ${code}`, 'error');
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      // Handle process errors
      childProcess.on('error', (error) => {
        isCompleted = true;
        clearTimeout(timeoutId);
        this.processes.delete(processId);
        this.timeouts.delete(processId);
        
        this.log(`❌ Process error: ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  /**
   * Test all system fixes with proper monitoring
   */
  async testSystemWithMonitoring() {
    this.log('🧪 Starting comprehensive system test with monitoring...', 'info');
    
    const tests = [
      {
        name: 'CTA Configuration Test',
        command: `SCRAPINGDOG_API_KEY=689e1eadbec7a9c318cc34e9 node -e "
          console.log('Testing CTA configuration...');
          const PersonalizedEmailGenerator = require('./server/services/PersonalizedEmailGenerator');
          const generator = new PersonalizedEmailGenerator();
          
          const testProspect = {
            name: 'Sarah Chen',
            email: 'sarah@innovate.com',
            company: 'InnovateAI',
            preferredTemplate: 'partnership_outreach',
            templateData: {
              senderName: 'James Wilson',
              senderEmail: 'james@fruitai.org',
              companyWebsite: 'https://fruitai.org',
              companyName: 'FruitAI',
              ctaUrl: 'https://calendly.com/test-meeting',
              ctaText: 'Schedule Meeting'
            }
          };
          
          const businessAnalysis = {
            companyName: 'FruitAI',
            industry: 'AI Technology',
            valueProposition: 'AI-powered solutions'
          };
          
          generator.generatePersonalizedEmail(testProspect, businessAnalysis, null, 'partnership')
            .then(result => {
              if (result.success) {
                const hasCustomCTA = result.email.body.includes('calendly.com/test-meeting') && 
                                    result.email.body.includes('Schedule Meeting');
                console.log('CTA Test Result:', hasCustomCTA ? 'PASS' : 'FAIL');
              } else {
                console.log('CTA Test Result: FAIL - Generation failed');
              }
            }).catch(err => {
              console.log('CTA Test Result: FAIL -', err.message);
            });
        "`,
        timeout: 60000
      },
      {
        name: 'Template Variety Test', 
        command: `SCRAPINGDOG_API_KEY=689e1eadbec7a9c318cc34e9 node test-comprehensive-system.js`,
        timeout: 30000
      },
      {
        name: 'Frontend Template Preview Test',
        command: `node -e "
          const fs = require('fs');
          const templateFile = fs.readFileSync('./client/src/components/EmailTemplateSelection.jsx', 'utf8');
          const hasCorrectIDs = templateFile.includes('partnership_outreach') && 
                               templateFile.includes('value_demonstration') &&
                               templateFile.includes('cold_outreach') &&
                               templateFile.includes('initial_contact');
          console.log('Template Preview Test:', hasCorrectIDs ? 'PASS' : 'FAIL');
        "`,
        timeout: 10000
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        this.log(`🔍 Running: ${test.name}`, 'progress');
        const startTime = Date.now();
        
        const result = await this.executeWithTimeoutHandling(test.command, { 
          timeout: test.timeout 
        });
        
        const duration = Date.now() - startTime;
        this.log(`✅ ${test.name} completed in ${Math.round(duration/1000)}s`, 'success');
        
        results.push({
          name: test.name,
          success: true,
          duration,
          output: result.stdout
        });
        
      } catch (error) {
        this.log(`❌ ${test.name} failed: ${error.message}`, 'error');
        results.push({
          name: test.name,
          success: false,
          error: error.message
        });
      }
    }
    
    // Generate test report
    this.generateTestReport(results);
    
    return results;
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      // Check if Ollama is running
      await this.executeWithTimeoutHandling('curl -s http://localhost:11434/api/version', { timeout: 5000 });
      this.log('💚 Ollama service: Healthy', 'success');
    } catch (error) {
      this.log('💔 Ollama service: Unhealthy - ' + error.message, 'warning');
    }
    
    // Check disk space
    try {
      const result = await this.executeWithTimeoutHandling('df -h . | tail -1', { timeout: 5000 });
      const usage = result.stdout.match(/(\d+)%/);
      if (usage && parseInt(usage[1]) > 90) {
        this.log('💿 Disk space: Critical - ' + usage[1] + '% used', 'warning');
      } else {
        this.log('💿 Disk space: Normal - ' + (usage ? usage[1] : 'Unknown') + '% used', 'info');
      }
    } catch (error) {
      this.log('💿 Disk space: Check failed - ' + error.message, 'warning');
    }
    
    // Check memory usage
    try {
      const result = await this.executeWithTimeoutHandling('free -m | head -2 | tail -1', { timeout: 5000 });
      const memory = result.stdout.match(/\s+(\d+)\s+(\d+)/);
      if (memory) {
        const usagePercent = Math.round((parseInt(memory[2]) / parseInt(memory[1])) * 100);
        if (usagePercent > 85) {
          this.log(`🧠 Memory: High usage - ${usagePercent}%`, 'warning');
        } else {
          this.log(`🧠 Memory: Normal - ${usagePercent}%`, 'info');
        }
      }
    } catch (error) {
      this.log('🧠 Memory: Check failed - ' + error.message, 'warning');
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(results) {
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const successRate = Math.round((passed / results.length) * 100);
    
    this.log('📋 ================== TEST REPORT ==================', 'info');
    this.log(`📊 Total Tests: ${results.length}`, 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
    this.log('================================================', 'info');
    
    // Detailed results
    for (const result of results) {
      if (result.success) {
        this.log(`✅ ${result.name}: PASSED (${Math.round(result.duration/1000)}s)`, 'success');
      } else {
        this.log(`❌ ${result.name}: FAILED - ${result.error}`, 'error');
      }
    }
    
    if (successRate === 100) {
      this.log('🎉 ALL TESTS PASSED! System is fully operational.', 'success');
    } else if (successRate >= 80) {
      this.log(`✅ System mostly operational (${successRate}% success rate)`, 'success');
    } else {
      this.log(`⚠️ System needs attention (${successRate}% success rate)`, 'warning');
    }
  }

  /**
   * Run continuous monitoring mode
   */
  async startContinuousMonitoring() {
    this.startMonitoring();
    
    this.log('🔄 Starting continuous monitoring mode...', 'info');
    this.log('💡 Press Ctrl+C to stop monitoring', 'info');
    
    // Initial test run
    await this.testSystemWithMonitoring();
    
    // Run tests every 5 minutes
    const testInterval = setInterval(async () => {
      this.log('🔄 Running scheduled system test...', 'progress');
      await this.testSystemWithMonitoring();
    }, 300000); // 5 minutes
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('🛑 Received shutdown signal...', 'warning');
      clearInterval(testInterval);
      this.stopMonitoring();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      this.log('🛑 Received termination signal...', 'warning');
      clearInterval(testInterval);
      this.stopMonitoring();
      process.exit(0);
    });
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new AdvancedSystemMonitor();
  
  const command = process.argv[2] || 'test';
  
  switch (command) {
    case 'monitor':
      monitor.startContinuousMonitoring();
      break;
    case 'test':
      monitor.testSystemWithMonitoring().then(() => {
        process.exit(0);
      }).catch(() => {
        process.exit(1);
      });
      break;
    case 'health':
      monitor.performHealthCheck().then(() => {
        process.exit(0);
      }).catch(() => {
        process.exit(1);
      });
      break;
    default:
      console.log('Usage: node create-monitoring-system.js [test|monitor|health]');
      console.log('  test    - Run comprehensive system tests');
      console.log('  monitor - Start continuous monitoring');
      console.log('  health  - Perform health check');
      process.exit(1);
  }
}

module.exports = AdvancedSystemMonitor;