#!/usr/bin/env node

/**
 * Test script for validating email search functionality
 * Tests Super Power Email Search Engine with real web search
 */

const SuperPowerEmailSearchEngine = require('./server/agents/SuperPowerEmailSearchEngine');

async function testEmailSearch() {
    console.log('🧪 Testing Super Power Email Search Engine');
    console.log('=' .repeat(50));
    
    const engine = new SuperPowerEmailSearchEngine();
    
    // Test with a real company that should have public contact information
    const testCompany = {
        name: 'GitHub',
        domain: 'github.com', 
        website: 'https://github.com',
        industry: 'Technology',
        description: 'Software development platform'
    };
    
    console.log(`🔍 Searching for emails for: ${testCompany.name}`);
    console.log(`   Domain: ${testCompany.domain}`);
    console.log(`   Website: ${testCompany.website}`);
    console.log();
    
    try {
        const results = await engine.searchRealEmails(testCompany);
        
        console.log('📊 Search Results:');
        console.log(`   Total emails found: ${results.emails?.length || 0}`);
        console.log(`   Search queries used: ${results.searchQueries?.length || 0}`);
        console.log(`   Sources checked: ${results.sources?.length || 0}`);
        console.log();
        
        if (results.emails && results.emails.length > 0) {
            console.log('📧 Found emails:');
            results.emails.forEach((email, index) => {
                console.log(`   ${index + 1}. ${email.email}`);
                console.log(`      Title: ${email.title || 'N/A'}`);
                console.log(`      Source: ${email.source || 'N/A'}`);
                console.log(`      Confidence: ${email.confidence || 'N/A'}%`);
                console.log(`      Engine: ${email.engine || 'N/A'}`);
                console.log();
            });
        } else {
            console.log('❌ No emails found');
        }
        
        if (results.searchQueries && results.searchQueries.length > 0) {
            console.log('🔎 Search queries used:');
            results.searchQueries.forEach((query, index) => {
                console.log(`   ${index + 1}. "${query}"`);
            });
            console.log();
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
if (require.main === module) {
    testEmailSearch().then(() => {
        console.log('✅ Test completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testEmailSearch };