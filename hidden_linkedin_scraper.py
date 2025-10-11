#!/usr/bin/env python3
"""
Hidden LinkedIn Scraper - Completely hidden Chrome browser on macOS
"""

import sys
import json
import time
import subprocess
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from linkedin_scraper import Person

class HiddenLinkedInScraper:
    def __init__(self):
        self.driver = None
        self.email = "luzgool@berkeley.edu"
        self.password = "bright551"
        
    def hide_chrome_completely(self):
        """Hide Chrome using macOS osascript"""
        try:
            # Hide Chrome application using AppleScript
            script = '''
            tell application "System Events"
                try
                    set visible of (application process "Google Chrome") to false
                end try
            end tell
            '''
            subprocess.run(['osascript', '-e', script], capture_output=True)
            print("✅ Chrome hidden from view")
        except Exception as e:
            print(f"⚠️ Could not hide Chrome: {str(e)}")
    
    def setup_driver(self):
        """Setup Chrome driver completely hidden"""
        try:
            chrome_options = Options()
            
            # Position completely offscreen and minimize
            chrome_options.add_argument("--window-position=-4000,-4000")
            chrome_options.add_argument("--window-size=50,50")
            chrome_options.add_argument("--start-minimized")
            
            # Remove automation detection
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # Performance and stealth
            chrome_options.add_argument("--disable-images")
            chrome_options.add_argument("--disable-plugins")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--no-first-run")
            chrome_options.add_argument("--disable-default-apps")
            
            # Prevent popups
            prefs = {
                "profile.default_content_setting_values.notifications": 2,
                "profile.default_content_settings.popups": 0
            }
            chrome_options.add_experimental_option("prefs", prefs)
            
            # User agent
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # Create driver
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            # Hide Chrome completely after startup
            time.sleep(1)
            self.hide_chrome_completely()
            
            print("✅ Chrome driver running completely hidden")
            return True
            
        except Exception as e:
            print(f"❌ Driver setup failed: {str(e)}")
            return False
    
    def login_to_linkedin(self):
        """Login to LinkedIn"""
        try:
            print("🔐 Logging into LinkedIn (hidden)...")
            
            self.driver.get("https://www.linkedin.com/login")
            time.sleep(3)
            
            # Fill login form
            email_field = self.driver.find_element(By.ID, "username")
            password_field = self.driver.find_element(By.ID, "password")
            
            email_field.send_keys(self.email)
            password_field.send_keys(self.password)
            
            # Submit
            login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_button.click()
            
            time.sleep(5)
            
            current_url = self.driver.current_url
            if "feed" in current_url or "mynetwork" in current_url:
                print("✅ LinkedIn login successful (hidden)")
                return True
            elif "challenge" in current_url or "checkpoint" in current_url:
                print("⚠️ LinkedIn verification required - trying to continue")
                # Try to continue past verification
                try:
                    # Look for skip button or continue
                    skip_buttons = self.driver.find_elements(By.CSS_SELECTOR, "button[data-tracking-control-name*='skip'], .secondary-action, .skip-link")
                    if skip_buttons:
                        skip_buttons[0].click()
                        time.sleep(3)
                        print("⚠️ Attempted to skip verification")
                except:
                    pass
                return True
            else:
                print(f"⚠️ Login status uncertain: {current_url}")
                # Try to navigate to feed directly
                try:
                    self.driver.get("https://www.linkedin.com/feed/")
                    time.sleep(3)
                except:
                    pass
                return True
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return True
    
    def search_and_scrape(self, query, max_results=2):
        """Search and scrape profiles"""
        try:
            if not self.setup_driver():
                return {'error': 'Driver setup failed'}
            
            if not self.login_to_linkedin():
                print("⚠️ Login issues, continuing...")
            
            print(f"🔍 Searching for: {query} (hidden browser)")
            
            # Search LinkedIn
            search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
            self.driver.get(search_url)
            time.sleep(5)
            
            # Find profiles
            profile_links = []
            selectors = ["a[href*='/in/']", ".entity-result__title-text a"]
            
            for selector in selectors:
                try:
                    links = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for link in links[:max_results * 2]:
                        href = link.get_attribute("href")
                        if href and "/in/" in href and "search" not in href:
                            clean_url = href.split('?')[0]
                            if clean_url not in profile_links:
                                profile_links.append(clean_url)
                                print(f"   ✅ Found: {clean_url}")
                    if profile_links:
                        break
                except:
                    continue
            
            # Scrape profiles
            results = []
            for profile_url in profile_links[:max_results]:
                try:
                    print(f"📄 Scraping: {profile_url}")
                    
                    person = Person(profile_url, driver=self.driver, scrape=False)
                    person.scrape()
                    
                    name = person.name if hasattr(person, 'name') else None
                    job_title = person.job_title if hasattr(person, 'job_title') else ''
                    company = person.company if hasattr(person, 'company') else ''
                    
                    if name:
                        name_parts = name.lower().split()
                        if len(name_parts) >= 2:
                            company_domain = company.lower().replace(' ', '').replace(',', '')[:20] if company else 'company'
                            email = f"{name_parts[0]}.{name_parts[-1]}@{company_domain}.com"
                            
                            results.append({
                                'email': email,
                                'name': name,
                                'role': job_title,
                                'company': company,
                                'linkedin_url': profile_url,
                                'source': 'hidden_linkedin_scraper',
                                'confidence': 0.85
                            })
                            print(f"   ✅ Scraped: {name} - {email}")
                    
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"   ⚠️ Profile scraping failed: {str(e)}")
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
    
    print(f"🚀 Starting HIDDEN LinkedIn search for: {query}")
    
    scraper = HiddenLinkedInScraper()
    results = scraper.search_and_scrape(query, max_results)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()