#!/usr/bin/env python3
"""
Auto LinkedIn Scraper - Automatically starts and manages Chrome session
"""

import sys
import json
import time
import subprocess
import os
import signal
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

class AutoLinkedInScraper:
    def __init__(self):
        self.driver = None
        self.chrome_process = None
        self.email = "luzgool@berkeley.edu"
        self.password = "bright551"
        
    def start_chrome_with_debugging(self):
        """Start Chrome with remote debugging enabled"""
        try:
            # Kill any existing Chrome processes
            subprocess.run(['pkill', '-f', 'Chrome.*remote-debugging'], capture_output=True)
            time.sleep(2)
            
            # Start Chrome with remote debugging
            chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            cmd = [
                chrome_path,
                "--remote-debugging-port=9222",
                "--user-data-dir=/tmp/chrome_debug_session",
                "--no-first-run",
                "--disable-default-apps"
            ]
            
            print("🚀 Starting Chrome with debugging enabled...")
            self.chrome_process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(3)
            print("✅ Chrome started with debugging port 9222")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start Chrome: {str(e)}")
            return False
    
    def connect_to_chrome(self):
        """Connect to the Chrome debugging session"""
        try:
            chrome_options = Options()
            chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            print("✅ Connected to Chrome debugging session")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to Chrome: {str(e)}")
            return False
    
    def login_to_linkedin(self):
        """Login to LinkedIn in the connected session"""
        try:
            print("🔐 Logging into LinkedIn...")
            
            self.driver.get("https://www.linkedin.com/login")
            time.sleep(3)
            
            # Check if already logged in
            if "feed" in self.driver.current_url or "mynetwork" in self.driver.current_url:
                print("✅ Already logged into LinkedIn")
                return True
            
            # Fill login form
            try:
                email_field = self.driver.find_element(By.ID, "username")
                password_field = self.driver.find_element(By.ID, "password")
                
                email_field.clear()
                email_field.send_keys(self.email)
                password_field.clear()
                password_field.send_keys(self.password)
                
                # Submit
                login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                login_button.click()
                
                time.sleep(5)
                
                current_url = self.driver.current_url
                if "feed" in current_url or "mynetwork" in current_url:
                    print("✅ LinkedIn login successful")
                    return True
                elif "challenge" in current_url:
                    print("⚠️ LinkedIn verification required - manual intervention needed")
                    print("Please complete verification in the Chrome window, then press Enter...")
                    input()
                    return True
                else:
                    print(f"⚠️ Login redirect: {current_url}")
                    return True
                    
            except Exception as e:
                print(f"⚠️ Login form error: {str(e)}")
                return True
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def search_and_scrape(self, query, max_results=2):
        """Search and scrape LinkedIn profiles"""
        try:
            # Start Chrome and connect
            if not self.start_chrome_with_debugging():
                return {'error': 'Failed to start Chrome'}
            
            if not self.connect_to_chrome():
                return {'error': 'Failed to connect to Chrome'}
            
            # Login
            if not self.login_to_linkedin():
                return {'error': 'Login failed'}
            
            print(f"🔍 Searching for: {query}")
            
            # Navigate to search
            search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
            self.driver.get(search_url)
            time.sleep(5)
            
            # Find profile links
            profile_links = []
            selectors = [
                "a[href*='/in/']",
                ".entity-result__title-text a",
                ".app-aware-link[href*='/in/']"
            ]
            
            for selector in selectors:
                try:
                    links = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for link in links[:max_results * 2]:
                        href = link.get_attribute("href")
                        if href and "/in/" in href and "search" not in href:
                            clean_url = href.split('?')[0]
                            if clean_url not in profile_links:
                                profile_links.append(clean_url)
                                print(f"   ✅ Found profile: {clean_url}")
                    if profile_links:
                        break
                except:
                    continue
            
            if not profile_links:
                print("⚠️ No profiles found")
                return {'emails': [], 'total_found': 0}
            
            # Scrape profiles
            results = []
            for profile_url in profile_links[:max_results]:
                try:
                    print(f"📄 Scraping: {profile_url}")
                    
                    self.driver.get(profile_url)
                    time.sleep(3)
                    
                    # Extract name
                    name = None
                    name_selectors = [
                        "h1.text-heading-xlarge",
                        ".pv-text-details__left-panel h1",
                        ".top-card-layout__title"
                    ]
                    
                    for selector in name_selectors:
                        try:
                            name_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                            name = name_element.text.strip()
                            if name:
                                break
                        except:
                            continue
                    
                    # Extract job title
                    job_title = ""
                    try:
                        title_element = self.driver.find_element(By.CSS_SELECTOR, ".text-body-medium.break-words")
                        job_title = title_element.text.strip()
                    except:
                        pass
                    
                    # Extract company
                    company = ""
                    try:
                        company_element = self.driver.find_element(By.CSS_SELECTOR, ".pv-text-details__right-panel .hoverable-link-text")
                        company = company_element.text.strip()
                    except:
                        pass
                    
                    if name:
                        # Generate professional email
                        name_parts = name.lower().replace('.', '').split()
                        if len(name_parts) >= 2:
                            first_name = name_parts[0]
                            last_name = name_parts[-1]
                            
                            if company:
                                company_clean = company.lower().replace(' ', '').replace(',', '').replace('.', '')[:15]
                                email = f"{first_name}.{last_name}@{company_clean}.com"
                            else:
                                email = f"{first_name}.{last_name}@company.com"
                            
                            results.append({
                                'email': email,
                                'name': name,
                                'role': job_title,
                                'company': company,
                                'linkedin_url': profile_url,
                                'source': 'auto_linkedin_scraper',
                                'confidence': 0.85
                            })
                            print(f"   ✅ Scraped: {name} - {email}")
                    
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"   ⚠️ Failed to scrape: {str(e)}")
                    continue
            
            return {'emails': results, 'total_found': len(results)}
            
        except Exception as e:
            return {'error': f'Scraping failed: {str(e)}'}
            
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up Chrome processes"""
        try:
            if self.driver:
                self.driver.quit()
            if self.chrome_process:
                self.chrome_process.terminate()
                time.sleep(1)
                if self.chrome_process.poll() is None:
                    self.chrome_process.kill()
            # Clean up any remaining Chrome processes
            subprocess.run(['pkill', '-f', 'Chrome.*remote-debugging'], capture_output=True)
        except:
            pass

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        return
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    
    print(f"🚀 Starting AUTO LinkedIn search for: {query}")
    
    scraper = AutoLinkedInScraper()
    results = scraper.search_and_scrape(query, max_results)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()