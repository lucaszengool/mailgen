#!/usr/bin/env node

/**
 * Test the improved strategy-based email search
 */

const SuperPowerEmailSearchEngine = require('./server/agents/SuperPowerEmailSearchEngine');

async function testStrategyBasedSearch() {
    console.log('🧪 Testing Strategy-Based Email Search');
    console.log('='.repeat(50));
    
    const engine = new SuperPowerEmailSearchEngine();
    
    // Test the enhanced fallback search with strategy-based queries
    const testQueries = [
        'companies offering data annotation services email contact',
        'AI model training service providers contact email', 
        'data labeling businesses contact directory email',
        'machine learning companies contact information email'
    ];
    
    for (const query of testQueries) {
        console.log(`\n🔍 Testing query: "${query}"`);
        console.log('-'.repeat(60));
        
        try {
            // Create mock company info that represents a search query
            const mockCompanyInfo = {
                name: query,
                description: 'Strategy-based search query',
                industry: 'AI/Technology'
            };
            
            const results = await engine.searchRealEmails(mockCompanyInfo);
            
            console.log(`📊 Results: ${results.emails?.length || 0} emails found`);
            
            if (results.emails && results.emails.length > 0) {
                console.log('📧 Sample emails:');
                results.emails.slice(0, 5).forEach((email, index) => {
                    console.log(`   ${index + 1}. ${email.email}`);
                    console.log(`      Company: ${email.company || 'N/A'}`);
                    console.log(`      Role: ${email.title}`);
                    console.log(`      Confidence: ${email.confidence}%`);
                    console.log(`      Engine: ${email.engine}`);
                    console.log();
                });
                
                if (results.emails.length > 5) {
                    console.log(`   ... and ${results.emails.length - 5} more emails`);
                }
            } else {
                console.log('❌ No emails found');
            }
            
        } catch (error) {
            console.error(`❌ Error testing query: ${error.message}`);
        }
    }
}

// Run the test
if (require.main === module) {
    testStrategyBasedSearch().then(() => {
        console.log('\n✅ Strategy-based search test completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}