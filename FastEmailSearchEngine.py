#!/usr/bin/env python3
"""
FAST Email Search Engine
Optimized for speed and reliability
"""

import sys
import json
import time
import re
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import random

class FastEmailSearchEngine:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.session.timeout = 5  # Fast timeouts
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
    def search_with_searxng(self, query):
        """Use SearXNG for searching (if available)"""
        searx_instances = [
            "https://searx.nixnet.services",
            "https://search.sapti.me",
            "https://searx.bar"
        ]
        
        for searx_url in searx_instances:
            try:
                print(f"  🔍 Trying SearXNG: {searx_url}")
                
                response = self.session.get(f"{searx_url}/search", params={
                    'q': query,
                    'format': 'json',
                    'categories': 'general'
                }, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])
                    
                    urls = []
                    for result in results[:10]:  # Top 10 results
                        url = result.get('url', '')
                        if url:
                            urls.append(url)
                    
                    print(f"    ✅ Found {len(urls)} URLs")
                    return urls
                    
            except Exception as e:
                print(f"    ⚠️ SearXNG failed: {str(e)}")
                continue
        
        return []
    
    def extract_emails_fast(self, url):
        """Fast email extraction with timeout"""
        try:
            response = self.session.get(url, timeout=5)
            if response.status_code != 200:
                return []
            
            # Quick text extraction
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            text = soup.get_text()
            
            # Find emails
            emails = self.email_pattern.findall(text)
            
            # Filter out obvious false positives
            real_emails = []
            for email in emails:
                email_lower = email.lower()
                if not any(skip in email_lower for skip in [
                    'example.com', 'test.com', 'domain.com', 'yoursite.com',
                    'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@'
                ]):
                    if len(email) < 100:  # Reasonable email length
                        real_emails.append(email)
            
            return list(set(real_emails))  # Remove duplicates
            
        except Exception as e:
            return []
    
    def search_contact_pages(self, base_url):
        """Search common contact page paths"""
        contact_paths = ['/contact', '/contact-us', '/about', '/team']
        emails = []
        
        parsed = urlparse(base_url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        
        for path in contact_paths:
            try:
                contact_url = base + path
                page_emails = self.extract_emails_fast(contact_url)
                emails.extend(page_emails)
                
                if emails:  # If we found emails, stop searching
                    break
                    
            except:
                continue
        
        return emails
    
    def quick_web_search(self, query):
        """Quick web search using multiple sources"""
        print(f"🔍 Quick web search for: {query}")
        
        all_emails = []
        
        # Strategy 1: SearXNG search
        search_queries = [
            f'"{query}" contact email',
            f'"{query}" CEO email',
            f'"{query}" founder contact'
        ]
        
        for search_query in search_queries:
            try:
                urls = self.search_with_searxng(search_query)
                
                for url in urls[:5]:  # Top 5 URLs only
                    # Extract emails from main page
                    emails = self.extract_emails_fast(url)
                    all_emails.extend(emails)
                    
                    # Try contact pages if no emails found
                    if not emails:
                        contact_emails = self.search_contact_pages(url)
                        all_emails.extend(contact_emails)
                    
                    if len(all_emails) >= 3:  # Stop if we have enough
                        break
                
                if len(all_emails) >= 3:
                    break
                    
            except Exception as e:
                print(f"  ⚠️ Search failed: {str(e)}")
                continue
        
        # Remove duplicates
        unique_emails = list(set(all_emails))
        
        # Format results
        results = []
        for email in unique_emails:
            results.append({
                'email': email,
                'source': 'fast_web_search',
                'confidence': 0.8,
                'method': 'contact_page_extraction'
            })
        
        return results
    
    def search_specific_sites(self, query):
        """Search specific sites known to have contact info"""
        print(f"🏢 Searching specific business sites for: {query}")
        
        # Direct site searches
        site_searches = [
            f"site:crunchbase.com {query}",
            f"site:about.me {query}",
            f"site:angel.co {query}"
        ]
        
        all_emails = []
        
        for search in site_searches:
            try:
                urls = self.search_with_searxng(search)
                
                for url in urls[:3]:  # Top 3 per site
                    emails = self.extract_emails_fast(url)
                    all_emails.extend(emails)
                
                if len(all_emails) >= 2:
                    break
                    
            except:
                continue
        
        # Format results
        results = []
        for email in set(all_emails):
            results.append({
                'email': email,
                'source': 'business_directory',
                'confidence': 0.9,
                'method': 'directory_extraction'
            })
        
        return results
    
    def search_real_emails(self, query, max_results=5):
        """Main fast email search method"""
        print(f"⚡ FAST Email Search for: {query}")
        print("=" * 50)
        
        all_results = []
        
        # Strategy 1: Quick web search
        try:
            web_results = self.quick_web_search(query)
            all_results.extend(web_results)
            print(f"📧 Web search found: {len(web_results)} emails")
        except Exception as e:
            print(f"❌ Web search failed: {str(e)}")
        
        # Strategy 2: Business directory search
        if len(all_results) < max_results:
            try:
                directory_results = self.search_specific_sites(query)
                all_results.extend(directory_results)
                print(f"📧 Directory search found: {len(directory_results)} emails")
            except Exception as e:
                print(f"❌ Directory search failed: {str(e)}")
        
        # Remove duplicates by email address
        seen_emails = set()
        unique_results = []
        for result in all_results:
            email = result['email']
            if email not in seen_emails:
                seen_emails.add(email)
                unique_results.append(result)
        
        # Limit results
        final_results = unique_results[:max_results]
        
        print(f"\n🎉 SEARCH COMPLETE!")
        print(f"📧 Total emails found: {len(final_results)}")
        
        if final_results:
            print("✅ Real emails discovered:")
            for result in final_results:
                print(f"  📧 {result['email']} (from {result['source']})")
        else:
            print("⚠️ No emails found - trying next strategy...")
        
        return final_results

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        return
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    engine = FastEmailSearchEngine()
    results = engine.search_real_emails(query, max_results)
    
    output = {
        'emails': results,
        'total_found': len(results),
        'query': query,
        'search_method': 'fast_email_engine'
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()