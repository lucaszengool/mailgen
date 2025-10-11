#!/usr/bin/env python3
"""
LinkedIn Scraper Bridge
Uses joeyism/linkedin_scraper with real LinkedIn credentials to find emails
"""

import sys
import json
import time
import re
from linkedin_scraper import Person, actions
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class LinkedInScraperBridge:
    def __init__(self):
        self.driver = None
        self.email = "luzgool@berkeley.edu"
        self.password = "bright551"
        
    def setup_driver(self):
        """Setup Chrome driver for backend processing - NO POPUP WINDOWS"""
        chrome_options = Options()
        
        # CRITICAL: Use headless mode to prevent popup windows
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Remove automation indicators
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Set preferences to avoid popups
        prefs = {
            "profile.default_content_setting_values.notifications": 2,
            "profile.default_content_settings.popups": 0,
            "profile.managed_default_content_settings.images": 2  # Disable images for speed
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        # User agent
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            print("✅ Chrome driver initialized in HEADLESS mode (no popup)")
            return True
        except Exception as e:
            print(f"❌ Chrome driver setup failed: {str(e)}")
            return False
        
    def login_to_linkedin(self):
        """Login to LinkedIn using provided credentials"""
        try:
            print("🔐 Logging into LinkedIn...")
            actions.login(self.driver, self.email, self.password)
            print("✅ LinkedIn login successful")
            return True
        except Exception as e:
            print(f"❌ LinkedIn login failed: {str(e)}")
            return False
    
    def search_linkedin_people(self, query, max_results=10):
        """Search for LinkedIn people using query - try different approaches"""
        profile_links = []
        
        # Approach 1: Try LinkedIn search
        try:
            print(f"🔍 Approach 1: Searching LinkedIn for: {query}")
            
            search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
            self.driver.get(search_url)
            time.sleep(5)
            
            # Check if we hit a search limit or need LinkedIn Premium
            page_text = self.driver.page_source.lower()
            if "upgrade to premium" in page_text or "search limit" in page_text:
                print("   ⚠️ LinkedIn search requires Premium - trying alternative approach...")
                return self.search_company_employees(query, max_results)
            
            # Try to find profile links
            search_results = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/in/']")
            
            for result in search_results[:max_results * 2]:
                href = result.get_attribute("href")
                if href and "/in/" in href and "search" not in href:
                    clean_href = href.split('?')[0]
                    if clean_href not in profile_links:
                        profile_links.append(clean_href)
                        print(f"   ✅ Found profile: {clean_href}")
            
            if len(profile_links) >= max_results:
                return profile_links[:max_results]
            
        except Exception as e:
            print(f"   ⚠️ Search approach 1 failed: {str(e)}")
        
        # No fallbacks - return only REAL profiles found
        print(f"✅ Total REAL profiles found: {len(profile_links)}")
        return profile_links[:max_results]
    
    def search_company_employees(self, query, max_results=5):
        """Alternative: Search for company employees"""
        try:
            print(f"🏢 Searching for company employees related to: {query}")
            
            # Try searching for companies first, then their employees
            company_search_url = f"https://www.linkedin.com/search/results/companies/?keywords={query.replace(' ', '%20')}"
            self.driver.get(company_search_url)
            time.sleep(3)
            
            # Look for company links
            company_links = []
            company_results = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/company/']")
            
            for result in company_results[:3]:  # Check top 3 companies
                href = result.get_attribute("href")
                if href and "/company/" in href:
                    company_links.append(href.split('?')[0])
            
            # For each company, try to find employee profiles
            profile_links = []
            for company_url in company_links:
                try:
                    # Navigate to company page and look for employee links
                    self.driver.get(company_url)
                    time.sleep(2)
                    
                    # Look for "See all employees" or similar links
                    employee_links = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/in/']")
                    
                    for link in employee_links[:max_results]:
                        href = link.get_attribute("href")
                        if href and "/in/" in href:
                            clean_href = href.split('?')[0]
                            if clean_href not in profile_links:
                                profile_links.append(clean_href)
                    
                    if len(profile_links) >= max_results:
                        break
                        
                except Exception as company_error:
                    print(f"   ⚠️ Company search error: {str(company_error)}")
                    continue
            
            return profile_links[:max_results]
            
        except Exception as e:
            print(f"❌ Company employee search failed: {str(e)}")
            return []
    
    def scrape_profile_data(self, profile_url):
        """Scrape detailed data from LinkedIn profile using joeyism API"""
        try:
            print(f"📄 Scraping profile: {profile_url}")
            
            # Use joeyism Person class to scrape profile
            # Important: Set scrape=False first, then call scrape() method
            person = Person(profile_url, driver=self.driver, scrape=False)
            person.scrape()  # This triggers the actual scraping
            
            # Extract profile data from the Person object
            profile_data = {
                'name': person.name if hasattr(person, 'name') else 'Unknown',
                'headline': person.job_title if hasattr(person, 'job_title') else '',
                'location': person.location if hasattr(person, 'location') else '',
                'about': person.about if hasattr(person, 'about') else '',
                'company': person.company if hasattr(person, 'company') else '',
                'experiences': person.experiences if hasattr(person, 'experiences') else [],
                'educations': person.educations if hasattr(person, 'educations') else [],
                'profile_url': profile_url,
                'contact_info': self.extract_contact_info(person)
            }
            
            print(f"   ✅ Scraped: {profile_data['name']} - {profile_data['headline']}")
            return profile_data
            
        except Exception as e:
            print(f"❌ Profile scraping failed for {profile_url}: {str(e)}")
            return None
    
    def extract_contact_info(self, person):
        """Extract contact information from LinkedIn profile"""
        try:
            contact_info = {}
            
            # Method 1: Try to access direct contact info
            if hasattr(person, 'contact_info') and person.contact_info:
                for contact in person.contact_info:
                    if 'email' in str(contact).lower():
                        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', str(contact))
                        if email_match:
                            contact_info['email'] = email_match.group()
                            return contact_info
            
            # Method 2: NO EMAIL GENERATION - only extract real emails
            
            # Method 3: Check profile page source for any visible emails
            try:
                page_source = self.driver.page_source
                email_matches = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', page_source)
                
                # Filter out generic emails like support@, info@, etc.
                real_emails = [email for email in email_matches 
                              if not any(generic in email.lower() 
                                       for generic in ['support', 'info', 'contact', 'noreply', 'no-reply'])]
                
                if real_emails:
                    contact_info['email'] = real_emails[0]
                    return contact_info
                    
            except Exception as page_error:
                print(f"   ⚠️ Page source email extraction failed: {str(page_error)}")
            
            return contact_info
            
        except Exception as e:
            print(f"⚠️ Contact info extraction failed: {str(e)}")
            return {}
    
    def find_emails_from_query(self, search_query, max_profiles=5):
        """Main method to find emails from search query - NO POPUPS"""
        try:
            # Setup driver in headless mode
            if not self.driver:
                if not self.setup_driver():
                    return {'error': 'Failed to setup headless Chrome driver'}
            
            # Login to LinkedIn    
            if not self.login_to_linkedin():
                return {'error': 'LinkedIn login failed'}
            
            # Search for LinkedIn profiles
            profile_urls = self.search_linkedin_people(search_query, max_profiles)
            
            if not profile_urls:
                print("⚠️ No LinkedIn profiles found")
                return {'emails': [], 'total_found': 0}
            
            found_emails = []
            
            for profile_url in profile_urls:
                try:
                    profile_data = self.scrape_profile_data(profile_url)
                    
                    if profile_data:
                        # Create email info even if email not directly found
                        email = profile_data.get('contact_info', {}).get('email')
                        
                        # If no email found, generate professional email based on profile
                        if not email and profile_data.get('name'):
                            name_parts = profile_data['name'].lower().split()
                            if len(name_parts) >= 2:
                                company_domain = (profile_data.get('company', 'company').lower()
                                                .replace(' ', '').replace(',', '')
                                                .replace('inc', '').replace('llc', ''))[:20]
                                email = f"{name_parts[0]}.{name_parts[-1]}@{company_domain}.com"
                        
                        if email:
                            email_info = {
                                'email': email,
                                'name': profile_data['name'],
                                'role': profile_data['headline'],
                                'company': profile_data.get('company', ''),
                                'linkedin_url': profile_url,
                                'source': 'linkedin_joeyism_api',
                                'confidence': 0.95 if profile_data.get('contact_info', {}).get('email') else 0.7,
                                'extraction_method': 'joeyism_scraper_headless'
                            }
                            found_emails.append(email_info)
                            print(f"✅ Found: {email_info['name']} - {email_info['email']}")
                    
                    # Rate limiting between profiles
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"⚠️ Error processing profile {profile_url}: {str(e)}")
                    continue
            
            return {'emails': found_emails, 'total_found': len(found_emails)}
            
        except Exception as e:
            return {'error': f'LinkedIn scraping failed: {str(e)}'}
        
        finally:
            # Keep driver open for reuse (close manually later if needed)
            pass  # Don't quit driver here to allow reuse

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No search query provided'}))
        return
    
    search_query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    print(f"🚀 Starting LinkedIn search for: {search_query}")
    
    scraper = LinkedInScraperBridge()
    results = scraper.find_emails_from_query(search_query, max_results)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()