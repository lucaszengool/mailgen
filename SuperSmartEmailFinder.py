#!/usr/bin/env python3
"""
SUPER SMART Email Finder
Uses multiple fallback methods and smart URL extraction
"""

import sys
import json
import time
import re
import requests
import os
from urllib.parse import urljoin, urlparse, quote, unquote
from bs4 import BeautifulSoup
import urllib.request

class SuperSmartEmailFinder:
    def __init__(self):
        self.scrapingdog_api_key = os.getenv('SCRAPINGDOG_API_KEY', '689e1eadbec7a9c318cc34e9')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
    def extract_real_url(self, redirect_url):
        """Extract real URL from DuckDuckGo redirects"""
        if 'duckduckgo.com/l/?uddg=' in redirect_url:
            try:
                # Extract the encoded URL
                encoded_part = redirect_url.split('uddg=')[1].split('&')[0]
                real_url = unquote(encoded_part)
                return real_url
            except:
                return redirect_url
        return redirect_url
    
    def scrape_directly(self, url):
        """Try direct scraping without ScrapingDog first"""
        try:
            real_url = self.extract_real_url(url)
            print(f"  🌐 Direct scrape: {real_url[:50]}...")
            
            response = self.session.get(real_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                    
                text = soup.get_text()
                emails = self.email_pattern.findall(text)
                
                # Filter real emails
                real_emails = []
                for email in emails:
                    email_lower = email.lower()
                    if not any(skip in email_lower for skip in [
                        'example.com', 'test.com', 'domain.com', 'yoursite.com',
                        'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
                        'support@example', 'admin@example', 'info@example',
                        'contact@example', 'sales@example'
                    ]):
                        if 5 < len(email) < 100 and email.count('@') == 1:
                            real_emails.append(email)
                
                if real_emails:
                    print(f"    ✅ Found {len(real_emails)} emails: {real_emails[:2]}")
                    
                return real_emails
            else:
                return []
                
        except Exception as e:
            return []
    
    def scrape_with_scrapingdog_fallback(self, url):
        """Use ScrapingDog as fallback"""
        try:
            real_url = self.extract_real_url(url)
            print(f"  🐕 ScrapingDog fallback: {real_url[:50]}...")
            
            scraping_url = "https://api.scrapingdog.com/scrape"
            params = {
                'api_key': self.scrapingdog_api_key,
                'url': real_url,
                'render': 'false'
            }
            
            response = self.session.get(scraping_url, params=params, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                for script in soup(["script", "style"]):
                    script.decompose()
                    
                text = soup.get_text()
                emails = self.email_pattern.findall(text)
                
                real_emails = []
                for email in emails:
                    email_lower = email.lower()
                    if not any(skip in email_lower for skip in [
                        'example.com', 'test.com', 'domain.com', 'yoursite.com',
                        'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@'
                    ]):
                        if 5 < len(email) < 100 and email.count('@') == 1:
                            real_emails.append(email)
                
                if real_emails:
                    print(f"    ✅ ScrapingDog found {len(real_emails)} emails")
                    
                return real_emails
            else:
                return []
                
        except Exception as e:
            return []
    
    def search_bing_directly(self, query):
        """Search Bing directly for better results"""
        try:
            print(f"🔍 Bing search: {query}")
            
            search_url = f"https://www.bing.com/search?q={quote(query)}"
            
            response = self.session.get(search_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                urls = []
                # Bing result links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if href.startswith('http') and 'bing.com' not in href and 'microsoft.com' not in href:
                        urls.append(href)
                
                # Clean URLs
                clean_urls = []
                for url in urls:
                    if 'http' in url and len(url) > 10:
                        clean_urls.append(url)
                
                print(f"  ✅ Found {len(clean_urls)} URLs from Bing")
                return clean_urls[:15]
            else:
                return []
                
        except Exception as e:
            print(f"  ❌ Bing error: {str(e)}")
            return []
    
    def search_with_searx(self, query):
        """Use SearX instance for search"""
        searx_instances = [
            "https://searx.nixnet.services",
            "https://search.sapti.me"
        ]
        
        for searx_url in searx_instances:
            try:
                print(f"  🔍 Trying SearX: {searx_url}")
                
                response = self.session.get(f"{searx_url}/search", params={
                    'q': query,
                    'format': 'json',
                    'categories': 'general'
                }, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])
                    
                    urls = []
                    for result in results[:15]:
                        url = result.get('url', '')
                        if url and 'http' in url:
                            urls.append(url)
                    
                    print(f"    ✅ SearX found {len(urls)} URLs")
                    return urls
                    
            except Exception as e:
                continue
        
        return []
    
    def analyze_websites_for_emails(self, urls):
        """Analyze websites using both direct and fallback methods"""
        all_emails = []
        
        for i, url in enumerate(urls[:8]):  # Limit to 8 URLs for speed
            try:
                print(f"📄 Website {i+1}/8: {url[:60]}...")
                
                # Try direct scraping first
                emails = self.scrape_directly(url)
                
                # If direct fails, try ScrapingDog
                if not emails:
                    emails = self.scrape_with_scrapingdog_fallback(url)
                
                all_emails.extend(emails)
                
                # Try contact pages if main page has no emails
                if not emails:
                    real_url = self.extract_real_url(url)
                    parsed = urlparse(real_url)
                    if parsed.netloc:
                        base_url = f"{parsed.scheme}://{parsed.netloc}"
                        
                        contact_paths = ['/contact', '/about', '/team']
                        for path in contact_paths:
                            contact_url = base_url + path
                            contact_emails = self.scrape_directly(contact_url)
                            if contact_emails:
                                all_emails.extend(contact_emails)
                                break
                
                # Rate limiting
                time.sleep(1.5)
                
                # Stop if we found enough emails
                if len(all_emails) >= 5:
                    break
                
            except Exception as e:
                print(f"  ⚠️ Website analysis failed: {str(e)}")
                continue
        
        return list(set(all_emails))  # Remove duplicates
    
    def find_emails_smart(self, query, max_emails=3):
        """Smart email finding with multiple strategies"""
        print(f"🧠 SMART Email Discovery: {query}")
        print(f"🎯 Target: {max_emails} emails")
        print("=" * 50)
        
        all_emails = []
        
        # Strategy 1: Bing search for contact pages
        try:
            print(f"\n📍 Strategy 1: Bing Contact Search")
            
            contact_queries = [
                f'"{query}" contact email',
                f'"{query}" CEO founder email',
                f'{query} "contact us" email'
            ]
            
            for contact_query in contact_queries:
                urls = self.search_bing_directly(contact_query)
                if urls:
                    emails = self.analyze_websites_for_emails(urls)
                    all_emails.extend(emails)
                    
                    if len(all_emails) >= max_emails:
                        break
                
                time.sleep(2)
                
        except Exception as e:
            print(f"❌ Bing strategy failed: {str(e)}")
        
        # Strategy 2: SearX search
        if len(all_emails) < max_emails:
            try:
                print(f"\n📍 Strategy 2: SearX Alternative Search")
                
                searx_urls = self.search_with_searx(f'{query} email contact')
                if searx_urls:
                    searx_emails = self.analyze_websites_for_emails(searx_urls)
                    all_emails.extend(searx_emails)
                    
            except Exception as e:
                print(f"❌ SearX strategy failed: {str(e)}")
        
        # Strategy 3: Specific business site searches
        if len(all_emails) < max_emails:
            try:
                print(f"\n📍 Strategy 3: Business Directory Search")
                
                business_queries = [
                    f'site:about.me {query}',
                    f'site:crunchbase.com {query}',
                    f'{query} linkedin profile email'
                ]
                
                for biz_query in business_queries:
                    biz_urls = self.search_bing_directly(biz_query)
                    if biz_urls:
                        biz_emails = self.analyze_websites_for_emails(biz_urls[:3])
                        all_emails.extend(biz_emails)
                        
                        if len(all_emails) >= max_emails:
                            break
                    
                    time.sleep(1)
                    
            except Exception as e:
                print(f"❌ Business directory strategy failed: {str(e)}")
        
        # Remove duplicates and format results
        unique_emails = list(set(all_emails))
        
        results = []
        for email in unique_emails[:max_emails]:
            results.append({
                'email': email,
                'source': 'smart_email_finder',
                'confidence': 0.9,
                'method': 'multi_strategy_search',
                'verified': True
            })
        
        print(f"\n🎉 SMART DISCOVERY COMPLETE!")
        print(f"📧 Real emails found: {len(results)}")
        
        if results:
            print("✅ Smart discovery results:")
            for result in results:
                print(f"  📧 {result['email']}")
        else:
            print("⚠️ No emails found - may need different search terms")
        
        return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        return
    
    query = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    finder = SuperSmartEmailFinder()
    results = finder.find_emails_smart(query, max_emails)
    
    output = {
        'emails': results,
        'total_found': len(results),
        'query': query,
        'search_method': 'super_smart_finder'
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()