#!/usr/bin/env python3
"""
Undetected LinkedIn Scraper - Uses undetected-chromedriver to bypass detection
Works completely in backend without popup windows
"""

import sys
import json
import time
import undetected_chromedriver as uc
from linkedin_scraper import Person, actions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class UndetectedLinkedInScraper:
    def __init__(self):
        self.driver = None
        self.email = "luzgool@berkeley.edu"
        self.password = "bright551"
        
    def setup_driver(self):
        """Setup undetected Chrome driver - NO POPUPS"""
        try:
            options = uc.ChromeOptions()
            options.add_argument('--headless')  # Run in background
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            
            # Create undetected Chrome instance
            self.driver = uc.Chrome(options=options, version_main=None)
            print("✅ Undetected Chrome driver initialized (headless)")
            return True
        except Exception as e:
            print(f"❌ Driver setup failed: {str(e)}")
            return False
    
    def login_to_linkedin(self):
        """Login using joeyism actions"""
        try:
            print("🔐 Logging into LinkedIn...")
            actions.login(self.driver, self.email, self.password)
            print("✅ LinkedIn login successful")
            return True
        except Exception as e:
            print(f"❌ Login failed: {str(e)}")
            return False
    
    def search_and_scrape(self, query, max_results=2):
        """Search and scrape LinkedIn profiles"""
        try:
            # Setup driver
            if not self.setup_driver():
                return {'error': 'Failed to setup driver'}
            
            # Login
            if not self.login_to_linkedin():
                return {'error': 'Login failed'}
            
            print(f"🔍 Searching for: {query}")
            
            # Navigate to search
            search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
            self.driver.get(search_url)
            time.sleep(3)
            
            # Find profile links
            profile_links = []
            links = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/in/']")
            
            for link in links[:max_results * 2]:
                href = link.get_attribute("href")
                if href and "/in/" in href and "search" not in href:
                    clean_url = href.split('?')[0]
                    if clean_url not in profile_links:
                        profile_links.append(clean_url)
                        print(f"   ✅ Found profile: {clean_url}")
            
            # Scrape profiles using joeyism API
            results = []
            for profile_url in profile_links[:max_results]:
                try:
                    print(f"📄 Scraping: {profile_url}")
                    
                    # Use joeyism Person class
                    person = Person(profile_url, driver=self.driver, scrape=False)
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
                            'source': 'undetected_linkedin_scraper',
                            'confidence': 0.85
                        })
                        print(f"   ✅ Scraped: {name} - {email}")
                    
                    time.sleep(2)  # Rate limiting
                    
                except Exception as e:
                    print(f"   ⚠️ Failed to scrape profile: {str(e)}")
                    continue
            
            return {'emails': results, 'total_found': len(results)}
            
        except Exception as e:
            return {'error': f'Scraping failed: {str(e)}'}
        finally:
            if self.driver:
                self.driver.quit()

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        return
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    
    print(f"🚀 Starting undetected LinkedIn search for: {query}")
    
    scraper = UndetectedLinkedInScraper()
    results = scraper.search_and_scrape(query, max_results)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()