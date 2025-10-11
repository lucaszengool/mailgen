#!/usr/bin/env node

/**
 * Test email search with companies that actually publish contact emails
 */

const SuperPowerEmailSearchEngine = require('./server/agents/SuperPowerEmailSearchEngine');

async function testRealisticEmailSearch() {
    console.log('🧪 Testing with realistic business email scenarios');
    console.log('=' .repeat(50));
    
    const engine = new SuperPowerEmailSearchEngine();
    
    // Test companies that are more likely to have published contact emails
    const testCompanies = [
        {
            name: 'Mailchimp',
            domain: 'mailchimp.com',
            website: 'https://mailchimp.com',
            industry: 'Email Marketing',
            description: 'Email marketing platform'
        },
        {
            name: 'HubSpot',
            domain: 'hubspot.com', 
            website: 'https://hubspot.com',
            industry: 'Marketing',
            description: 'CRM and marketing platform'
        }
    ];
    
    for (const company of testCompanies) {
        console.log(`\n🔍 Testing: ${company.name} (${company.domain})`);
        console.log('-'.repeat(30));
        
        try {
            const results = await engine.searchRealEmails(company);
            
            console.log(`📊 Results: ${results.emails?.length || 0} emails found`);
            
            if (results.emails && results.emails.length > 0) {
                console.log('📧 Found emails:');
                results.emails.slice(0, 3).forEach((email, index) => {
                    console.log(`   ${index + 1}. ${email.email} (${email.confidence}% confidence)`);
                });
                if (results.emails.length > 3) {
                    console.log(`   ... and ${results.emails.length - 3} more`);
                }
            } else {
                console.log('❌ No emails found');
            }
            
        } catch (error) {
            console.error(`❌ Error testing ${company.name}:`, error.message);
        }
    }
}

// Also test the fallback method
async function testFallbackEmailGeneration() {
    console.log('\n🔄 Testing fallback email generation');
    console.log('-'.repeat(40));
    
    const engine = new SuperPowerEmailSearchEngine();
    
    const testCompany = {
        name: 'TechStartup',
        domain: 'techstartup.io',
        website: 'https://techstartup.io',
        industry: 'Technology'
    };
    
    try {
        const results = await engine.fallbackSearch(testCompany);
        
        console.log(`📊 Fallback generated: ${results.emails?.length || 0} emails`);
        
        if (results.emails && results.emails.length > 0) {
            console.log('📧 Generated emails:');
            results.emails.slice(0, 5).forEach((email, index) => {
                console.log(`   ${index + 1}. ${email.email} (${email.title})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Fallback test failed:', error.message);
    }
}

// Run tests
if (require.main === module) {
    (async () => {
        await testRealisticEmailSearch();
        await testFallbackEmailGeneration();
        console.log('\n✅ All tests completed');
        process.exit(0);
    })().catch(error => {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    });
}