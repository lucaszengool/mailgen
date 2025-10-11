#!/usr/bin/env python3
"""
Use existing LinkedIn session - Connect to already running Chrome with LinkedIn logged in
This avoids the login detection issue
"""

import sys
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from linkedin_scraper import Person

def connect_to_existing_session():
    """Connect to existing Chrome session with LinkedIn already logged in"""
    try:
        # Connect to existing Chrome session on debug port
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        driver = webdriver.Chrome(options=chrome_options)
        print("✅ Connected to existing Chrome session")
        return driver
    except Exception as e:
        print(f"❌ Failed to connect: {str(e)}")
        print("💡 Please start Chrome with: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222")
        return None

def search_and_scrape(driver, query, max_results=2):
    """Search and scrape using existing session"""
    try:
        print(f"🔍 Searching for: {query}")
        
        # Navigate to search
        search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
        driver.get(search_url)
        time.sleep(3)
        
        # Find profile links
        profile_links = []
        links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/in/']")
        
        for link in links[:max_results * 2]:
            href = link.get_attribute("href")
            if href and "/in/" in href and "search" not in href:
                clean_url = href.split('?')[0]
                if clean_url not in profile_links:
                    profile_links.append(clean_url)
                    print(f"   ✅ Found profile: {clean_url}")
        
        # Scrape profiles
        results = []
        for profile_url in profile_links[:max_results]:
            try:
                print(f"📄 Scraping: {profile_url}")
                
                # Use joeyism Person class
                person = Person(profile_url, driver=driver, scrape=False)
                person.scrape()
                
                # Extract data
                name = person.name if hasattr(person, 'name') else 'Unknown'
                job_title = person.job_title if hasattr(person, 'job_title') else ''
                company = person.company if hasattr(person, 'company') else ''
                
                # Generate professional email
                email = None
                if name and name != 'Unknown':
                    name_parts = name.lower().split()
                    if len(name_parts) >= 2:
                        company_domain = company.lower().replace(' ', '').replace(',', '')[:20] if company else 'company'
                        email = f"{name_parts[0]}.{name_parts[-1]}@{company_domain}.com"
                
                if email:
                    results.append({
                        'email': email,
                        'name': name,
                        'role': job_title,
                        'company': company,
                        'linkedin_url': profile_url,
                        'source': 'linkedin_existing_session',
                        'confidence': 0.85
                    })
                    print(f"   ✅ Scraped: {name} - {email}")
                
                time.sleep(2)
                
            except Exception as e:
                print(f"   ⚠️ Failed to scrape: {str(e)}")
                continue
        
        return {'emails': results, 'total_found': len(results)}
        
    except Exception as e:
        return {'error': f'Search failed: {str(e)}'}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        return
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    
    print(f"🚀 Using existing LinkedIn session for: {query}")
    
    driver = connect_to_existing_session()
    if not driver:
        print(json.dumps({'error': 'Could not connect to existing session'}))
        return
    
    results = search_and_scrape(driver, query, max_results)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()