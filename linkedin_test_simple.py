#!/usr/bin/env python3
"""
Simple LinkedIn test to debug authentication
"""

import sys
from linkedin_scraper import actions
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def test_linkedin_login():
    """Test basic LinkedIn login"""
    try:
        print("🔐 Testing LinkedIn login...")
        
        # Setup Chrome driver
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        # Don't run headless for debugging
        # chrome_options.add_argument("--headless")
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print("✅ Chrome driver initialized")
        
        # Test login
        email = "luzgool@berkeley.edu"
        password = "bright551"
        
        actions.login(driver, email, password)
        print("✅ LinkedIn login successful!")
        
        # Get current page info
        print(f"Current URL: {driver.current_url}")
        print(f"Page title: {driver.title}")
        
        driver.quit()
        return True
        
    except Exception as e:
        print(f"❌ Login test failed: {str(e)}")
        if 'driver' in locals():
            driver.quit()
        return False

if __name__ == "__main__":
    success = test_linkedin_login()
    print(f"Login test result: {'SUCCESS' if success else 'FAILED'}")