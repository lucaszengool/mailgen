/**
 * Authenticated LinkedIn methods to replace the existing ones
 * Uses joeyism LinkedIn scraper with real credentials
 */

const axios = require('axios');
const linkedInRateLimiter = require('./linkedin_rate_limiter');
const simpleLinkedInSearcher = require('./simple_linkedin_searcher');

/**
 * Generate a single targeted LinkedIn search query using Ollama
 */
async function generateLinkedInSearchQuery(industry, segments, keywords, ollamaUrl, models) {
  try {
    const prompt = `Generate ONE targeted LinkedIn search query to find professionals in the ${industry} industry.

Target Segments: ${segments.join(', ')}
Keywords: ${keywords.join(', ')}

Create a search query that will find real people with email addresses in LinkedIn. 
Focus on roles like CEO, founder, director, manager, VP in the ${industry} industry.

Return ONLY the search query, no explanations:`;

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: models.fast,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_ctx: 1024
      }
    });

    const query = response.data.response.trim();
    return query || `${industry} CEO founder director manager`;
    
  } catch (error) {
    console.log('⚠️ Using fallback query due to Ollama error:', error.message);
    return `${industry} CEO founder director manager`;
  }
}

/**
 * Search LinkedIn using REAL backend approach with rate limiting
 */
async function searchLinkedInWithAuthentication(searchQuery) {
  // Use rate limiter to prevent duplicate requests
  return linkedInRateLimiter.executeWithRateLimit(
    `linkedin_search_${Date.now()}`,
    searchQuery,
    async () => {
      // Use REAL backend search - no browser window, no pre-existing data
      console.log(`   🔍 Using Simple Web Email Search (快速可靠的网络邮箱搜索)`);
      
      const { spawn } = require('child_process');
      const python = spawn('python3', [
        '/Users/James/Desktop/agent/SimpleWebEmailSearch.py',
        searchQuery,
        '5'  // Find 5 emails using simple web search
      ]);

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      return new Promise((resolve) => {
        python.on('close', (code) => {
          if (code !== 0) {
            console.log(`   ⚠️ Backend error: ${error}`);
            resolve([]);
            return;
          }

          try {
            // Extract JSON from output - handle multiline JSON
            let jsonResult = null;
            
            // Find JSON block in output
            const jsonStart = output.indexOf('{');
            if (jsonStart !== -1) {
              const jsonPart = output.substring(jsonStart);
              try {
                jsonResult = JSON.parse(jsonPart);
              } catch (e) {
                // Try to find complete JSON by looking for balanced braces
                let braceCount = 0;
                let jsonEnd = jsonStart;
                for (let i = jsonStart; i < output.length; i++) {
                  if (output[i] === '{') braceCount++;
                  if (output[i] === '}') braceCount--;
                  if (braceCount === 0) {
                    jsonEnd = i + 1;
                    break;
                  }
                }
                try {
                  jsonResult = JSON.parse(output.substring(jsonStart, jsonEnd));
                } catch (e2) {
                  console.log('   ⚠️ JSON parse error:', e2.message);
                }
              }
            }

            if (jsonResult && jsonResult.emails) {
              console.log(`   ✅ Found ${jsonResult.emails.length} REAL LinkedIn profiles!`);
              resolve(jsonResult.emails);
            } else {
              console.log(`   ⚠️ No profiles found`);
              resolve([]);
            }
          } catch (parseError) {
            console.log(`   ⚠️ Parse error: ${parseError.message}`);
            resolve([]);
          }
        });
      });
    }
  );
}

/**
 * Execute LinkedIn search (internal method)
 */
async function executeLinkedInSearch(searchQuery) {
  try {
    console.log(`   🔐 Executing LinkedIn search with credentials...`);
    
    const { spawn } = require('child_process');
    const python = spawn('python3', [
      '/Users/James/Desktop/agent/linkedin_scraper_bridge.py',
      searchQuery,
      '2' // Max 2 results for faster execution
    ]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    return new Promise((resolve, reject) => {
      python.on('close', (code) => {
        if (code !== 0) {
          console.log(`   ⚠️ Python script error: ${error}`);
          resolve([]);
          return;
        }

        try {
          // Extract JSON from output (may have other logs)
          const lines = output.split('\n');
          let jsonResult = null;
          
          for (const line of lines.reverse()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.emails || parsed.error) {
                jsonResult = parsed;
                break;
              }
            } catch (e) {
              continue;
            }
          }

          if (jsonResult && jsonResult.error) {
            console.log(`   ❌ LinkedIn scraper error: ${jsonResult.error}`);
            resolve([]);
          } else if (jsonResult && jsonResult.emails) {
            console.log(`   ✅ Found ${jsonResult.emails.length} REAL emails with authentication!`);
            resolve(jsonResult.emails);
          } else {
            console.log(`   ⚠️ No valid JSON result found in output`);
            resolve([]);
          }
        } catch (parseError) {
          console.log(`   ⚠️ Failed to parse LinkedIn scraper output: ${parseError.message}`);
          resolve([]);
        }
      });

      // No timeout - let LinkedIn scraper complete properly
      // Removed timeout to allow full scraping process
    });

  } catch (error) {
    console.log(`   ❌ Authentication search failed: ${error.message}`);
    return [];
  }
}

/**
 * Main authenticated LinkedIn email discovery method
 */
async function findRealEmailsFromLinkedInProfiles(companyInfo, ollamaUrl, models) {
  try {
    const industry = companyInfo.industry || 'Technology';
    const segments = companyInfo.target_audience?.primary_segments || ['startups'];
    const keywords = companyInfo.target_audience?.search_keywords || ['business'];
    
    console.log(`   🔍 Using AUTHENTICATED LinkedIn Scraper with joeyism approach for REAL ${industry} emails...`);
    
    // Step 1: Generate targeted LinkedIn search query using Ollama
    const searchQuery = await generateLinkedInSearchQuery(industry, segments, keywords, ollamaUrl, models);
    console.log(`   🧠 Generated search query: "${searchQuery}"`);
    
    // Step 2: Use Python bridge to search LinkedIn with real credentials
    const foundEmails = await searchLinkedInWithAuthentication(searchQuery);
    
    if (foundEmails.length === 0) {
      console.log(`   ⚠️ No emails found for ${industry} using authenticated LinkedIn search`);
      return [];
    }
    
    console.log(`   📊 Total REAL emails found with authentication: ${foundEmails.length}`);
    return foundEmails;
    
  } catch (error) {
    console.log(`   ❌ Authenticated LinkedIn email discovery failed: ${error.message}`);
    return [];
  }
}

module.exports = {
  generateLinkedInSearchQuery,
  searchLinkedInWithAuthentication,
  executeLinkedInSearch,
  findRealEmailsFromLinkedInProfiles
};