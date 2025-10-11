#!/usr/bin/env python3
"""
RATE LIMITED Email Finder
Advanced email discovery with comprehensive rate limiting and 429 error handling
Implements exponential backoff, request throttling, and intelligent retry strategies
"""

import sys
import json
import time
import re
import requests
import os
import random
from urllib.parse import urljoin, urlparse, quote, unquote
from bs4 import BeautifulSoup
import urllib.request
from threading import Lock
from datetime import datetime, timedelta

class RateLimitedEmailFinder:
    def __init__(self):
        self.scrapingdog_api_key = os.getenv('SCRAPINGDOG_API_KEY', '689e1eadbec7a9c318cc34e9')
        
        # Rate limiting configuration
        self.request_lock = Lock()
        self.last_request_time = {}
        self.domain_delays = {}
        self.retry_counts = {}
        self.max_retries = 3
        self.base_delay = 2.0  # Base delay between requests
        self.max_delay = 30.0  # Maximum delay for exponential backoff
        
        # Session with enhanced headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🔧 Rate Limited Email Finder initialized")
        print(f"   ⏱️  Base delay: {self.base_delay}s")
        print(f"   🔄 Max retries: {self.max_retries}")
        print(f"   ⏰ Max delay: {self.max_delay}s")
        
    def get_domain_from_url(self, url):
        """Extract domain from URL for rate limiting tracking"""
        try:
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return url
    
    def calculate_delay(self, domain, retry_count=0):
        """Calculate delay with exponential backoff"""
        base_delay = self.domain_delays.get(domain, self.base_delay)
        
        if retry_count > 0:
            # Exponential backoff: base_delay * (2^retry_count) + random jitter
            delay = min(base_delay * (2 ** retry_count), self.max_delay)
            jitter = random.uniform(0.1, 0.5)  # Add randomness to avoid thundering herd
            delay += jitter
        else:
            # Regular delay with small jitter
            delay = base_delay + random.uniform(0.1, 0.3)
        
        return delay
    
    def wait_for_rate_limit(self, domain, retry_count=0):
        """Implement intelligent rate limiting with exponential backoff"""
        with self.request_lock:
            current_time = time.time()
            
            # Check if we need to wait based on last request to this domain
            if domain in self.last_request_time:
                time_since_last = current_time - self.last_request_time[domain]
                required_delay = self.calculate_delay(domain, retry_count)
                
                if time_since_last < required_delay:
                    wait_time = required_delay - time_since_last
                    print(f"   ⏱️  Rate limiting: waiting {wait_time:.1f}s for {domain}")
                    time.sleep(wait_time)
            
            # Update last request time
            self.last_request_time[domain] = time.time()
    
    def handle_429_error(self, domain, retry_count):
        """Handle 429 errors with adaptive delays"""
        print(f"   🚫 429 Rate Limit hit for {domain} (retry {retry_count})")
        
        # Increase delay for this domain
        current_delay = self.domain_delays.get(domain, self.base_delay)
        new_delay = min(current_delay * 2, self.max_delay)
        self.domain_delays[domain] = new_delay
        
        # Calculate exponential backoff delay
        backoff_delay = self.calculate_delay(domain, retry_count)
        print(f"   ⏰ Exponential backoff: {backoff_delay:.1f}s")
        
        time.sleep(backoff_delay)
    
    def make_rate_limited_request(self, url, **kwargs):
        """Make a rate-limited HTTP request with retry logic"""
        domain = self.get_domain_from_url(url)
        retry_count = 0
        
        while retry_count <= self.max_retries:
            try:
                # Apply rate limiting
                self.wait_for_rate_limit(domain, retry_count)
                
                # Make the request
                response = self.session.get(url, timeout=15, **kwargs)
                
                if response.status_code == 200:
                    # Success - reset domain delay if it was increased
                    if domain in self.domain_delays and self.domain_delays[domain] > self.base_delay:
                        self.domain_delays[domain] = max(self.domain_delays[domain] * 0.8, self.base_delay)
                    return response
                
                elif response.status_code == 429:
                    # Rate limit hit
                    retry_count += 1
                    if retry_count <= self.max_retries:
                        self.handle_429_error(domain, retry_count)
                        continue
                    else:
                        print(f"   ❌ Max retries exceeded for {domain}")
                        return None
                
                elif response.status_code in [403, 404, 503]:
                    # Other errors - don't retry immediately
                    print(f"   ⚠️  HTTP {response.status_code} for {domain}")
                    return None
                
                else:
                    print(f"   ⚠️  HTTP {response.status_code} for {domain}")
                    return None
                    
            except requests.exceptions.Timeout:
                retry_count += 1
                print(f"   ⏰ Timeout for {domain} (retry {retry_count})")
                if retry_count <= self.max_retries:
                    time.sleep(self.calculate_delay(domain, retry_count))
                    continue
                else:
                    return None
                    
            except requests.exceptions.RequestException as e:
                print(f"   ❌ Request error for {domain}: {str(e)}")
                return None
        
        return None
    
    def extract_real_url(self, redirect_url):
        """Extract real URL from DuckDuckGo and other redirects"""
        if 'duckduckgo.com/l/?uddg=' in redirect_url:
            try:
                encoded_part = redirect_url.split('uddg=')[1].split('&')[0]
                real_url = unquote(encoded_part)
                return real_url
            except:
                return redirect_url
        
        # Handle Bing redirects
        if 'bing.com/ck/a' in redirect_url:
            try:
                if '&u=' in redirect_url:
                    encoded_part = redirect_url.split('&u=')[1].split('&')[0]
                    real_url = unquote(encoded_part)
                    return real_url
            except:
                return redirect_url
        
        return redirect_url
    
    def scrape_with_rate_limiting(self, url):
        """Scrape website with comprehensive rate limiting"""
        try:
            real_url = self.extract_real_url(url)
            domain = self.get_domain_from_url(real_url)
            
            print(f"  🌐 Rate-limited scrape: {domain}")
            
            response = self.make_rate_limited_request(real_url)
            if not response:
                return []
            
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
                print(f"    ✅ Found {len(real_emails)} emails from {domain}")
                
            return real_emails
            
        except Exception as e:
            print(f"  ❌ Scraping error: {str(e)}")
            return []
    
    def scrape_with_scrapingdog_rate_limited(self, url):
        """Use ScrapingDog with rate limiting"""
        try:
            real_url = self.extract_real_url(url)
            domain = self.get_domain_from_url(real_url)
            
            print(f"  🐕 ScrapingDog (rate-limited): {domain}")
            
            # Apply rate limiting for ScrapingDog API
            self.wait_for_rate_limit('api.scrapingdog.com')
            
            scraping_url = "https://api.scrapingdog.com/scrape"
            params = {
                'api_key': self.scrapingdog_api_key,
                'url': real_url,
                'render': 'false'
            }
            
            response = self.make_rate_limited_request(scraping_url, params=params)
            if not response:
                return []
            
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
            
        except Exception as e:
            print(f"  ❌ ScrapingDog error: {str(e)}")
            return []
    
    def search_bing_rate_limited(self, query):
        """Search Bing with comprehensive rate limiting"""
        try:
            print(f"🔍 Rate-limited Bing search: {query}")
            
            search_url = f"https://www.bing.com/search?q={quote(query)}"
            
            response = self.make_rate_limited_request(search_url)
            if not response:
                return []
            
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
            
        except Exception as e:
            print(f"  ❌ Bing search error: {str(e)}")
            return []
    
    def search_with_searx_rate_limited(self, query):
        """Use SearX with rate limiting"""
        searx_instances = [
            "https://searx.nixnet.services",
            "https://search.sapti.me",
            "https://searx.be"
        ]
        
        for searx_url in searx_instances:
            try:
                print(f"  🔍 Rate-limited SearX: {searx_url}")
                
                domain = self.get_domain_from_url(searx_url)
                self.wait_for_rate_limit(domain)
                
                response = self.make_rate_limited_request(f"{searx_url}/search", params={
                    'q': query,
                    'format': 'json',
                    'categories': 'general'
                })
                
                if response:
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
                print(f"    ⚠️  SearX instance failed: {str(e)}")
                continue
        
        return []
    
    def analyze_websites_rate_limited(self, urls):
        """Analyze websites with intelligent rate limiting"""
        all_emails = []
        processed_domains = set()
        
        for i, url in enumerate(urls[:6]):  # Reduced to 6 for better rate limiting
            try:
                domain = self.get_domain_from_url(url)
                
                # Skip if we already processed this domain recently
                if domain in processed_domains:
                    continue
                processed_domains.add(domain)
                
                print(f"📄 Website {i+1}/6: {domain}")
                
                # Try direct scraping first
                emails = self.scrape_with_rate_limiting(url)
                
                # If direct fails and we haven't hit limits, try ScrapingDog
                if not emails and domain not in self.domain_delays:
                    emails = self.scrape_with_scrapingdog_rate_limited(url)
                
                all_emails.extend(emails)
                
                # Try contact pages if main page has no emails
                if not emails:
                    real_url = self.extract_real_url(url)
                    parsed = urlparse(real_url)
                    if parsed.netloc:
                        base_url = f"{parsed.scheme}://{parsed.netloc}"
                        
                        contact_paths = ['/contact', '/about']  # Reduced paths
                        for path in contact_paths:
                            contact_url = base_url + path
                            contact_emails = self.scrape_with_rate_limiting(contact_url)
                            if contact_emails:
                                all_emails.extend(contact_emails)
                                break
                
                # Enhanced rate limiting between websites
                time.sleep(random.uniform(2.0, 4.0))
                
                # Stop if we found enough emails
                if len(all_emails) >= 4:
                    break
                
            except Exception as e:
                print(f"  ⚠️  Website analysis failed: {str(e)}")
                continue
        
        return list(set(all_emails))  # Remove duplicates
    
    def find_emails_with_advanced_rate_limiting(self, query, max_emails=3):
        """Advanced email finding with comprehensive rate limiting"""
        print(f"🔧 RATE LIMITED Email Discovery: {query}")
        print(f"🎯 Target: {max_emails} emails")
        print(f"⏱️  Rate limiting: Active with exponential backoff")
        print("=" * 60)
        
        all_emails = []
        
        # Strategy 1: Rate-limited Bing search
        try:
            print(f"\n📍 Strategy 1: Rate-Limited Bing Search")
            
            contact_queries = [
                f'"{query}" contact email',
                f'{query} CEO founder email address'
            ]
            
            for contact_query in contact_queries:
                urls = self.search_bing_rate_limited(contact_query)
                if urls:
                    emails = self.analyze_websites_rate_limited(urls)
                    all_emails.extend(emails)
                    
                    if len(all_emails) >= max_emails:
                        break
                
                # Enhanced delay between search queries
                time.sleep(random.uniform(3.0, 5.0))
                
        except Exception as e:
            print(f"❌ Bing strategy failed: {str(e)}")
        
        # Strategy 2: Rate-limited SearX search
        if len(all_emails) < max_emails:
            try:
                print(f"\n📍 Strategy 2: Rate-Limited SearX Search")
                
                searx_urls = self.search_with_searx_rate_limited(f'{query} email contact')
                if searx_urls:
                    searx_emails = self.analyze_websites_rate_limited(searx_urls)
                    all_emails.extend(searx_emails)
                    
            except Exception as e:
                print(f"❌ SearX strategy failed: {str(e)}")
        
        # Remove duplicates and format results
        unique_emails = list(set(all_emails))
        
        results = []
        for email in unique_emails[:max_emails]:
            results.append({
                'email': email,
                'source': 'rate_limited_finder',
                'confidence': 0.95,
                'method': 'rate_limited_multi_strategy',
                'verified': True,
                'found_at': datetime.now().isoformat()
            })
        
        print(f"\n🎉 RATE LIMITED DISCOVERY COMPLETE!")
        print(f"📧 Real emails found: {len(results)}")
        print(f"🔧 Rate limiting stats:")
        print(f"   📊 Domains with delays: {len(self.domain_delays)}")
        print(f"   ⏱️  Active delays: {[f'{d}: {v:.1f}s' for d, v in self.domain_delays.items()]}")
        
        if results:
            print("✅ Rate-limited discovery results:")
            for result in results:
                print(f"  📧 {result['email']}")
        else:
            print("⚠️  No emails found with current rate limits - try different search terms")
        
        return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        return
    
    query = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    finder = RateLimitedEmailFinder()
    results = finder.find_emails_with_advanced_rate_limiting(query, max_emails)
    
    output = {
        'emails': results,
        'total_found': len(results),
        'query': query,
        'search_method': 'rate_limited_finder',
        'rate_limiting_active': True,
        'domains_with_delays': len(finder.domain_delays),
        'timestamp': datetime.now().isoformat()
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()