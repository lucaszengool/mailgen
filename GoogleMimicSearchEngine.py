#!/usr/bin/env python3
"""
Google-Mimicking Search Engine
Exactly mimics manual Google searching behavior to find company emails
- Gets queries from Ollama
- Searches Google like a human would
- Finds emails in search result previews/snippets
- Clicks company links for deep extraction
- Generates user profiles via Ollama
- Processes ALL pages and ALL results
- Starts email generation immediately when emails found
"""

import sys
import json
import time
import re
import requests
import os
import random
import asyncio
import threading
from urllib.parse import urljoin, urlparse, quote, unquote
from bs4 import BeautifulSoup
import urllib.request
from threading import Lock, Thread
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

class GoogleMimicSearchEngine:
    def __init__(self):
        self.scrapingdog_api_key = os.getenv('SCRAPINGDOG_API_KEY', '689e1eadbec7a9c318cc34e9')
        self.ollama_url = 'http://localhost:11434'
        
        # Human-like session configuration
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        # Email pattern for detecting emails in previews
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        # Threading for parallel processing
        self.found_emails = []
        self.email_lock = Lock()
        self.continue_searching = True
        
        # Human-like delays
        self.search_delay = (2, 5)  # Random delay between searches
        self.page_delay = (1, 3)    # Random delay between pages
        self.click_delay = (1, 2)   # Random delay before clicking links
        
        print("🎯 Google-Mimicking Search Engine initialized")
        print("   🔍 Behavior: Exactly like manual Google searching")
        print("   📧 Detection: Emails in search previews + deep links")
        print("   🤖 Ollama: Query generation + User profile creation")
        print("   ⚡ Parallel: Email generation while search continues")
        
    def get_ollama_query(self, industry, target_type="companies"):
        """Get search query from Ollama exactly like human would search"""
        try:
            prompt = f"""Generate ONE Google search query to find {target_type} in the {industry} industry with contact email addresses.

Make it sound like a natural human Google search, similar to:
- "fruit company email contact"
- "AI startup CEO email address"
- "tech company contact information"
- "{industry} business email directory"

Industry: {industry}
Target: {target_type}

Return ONLY the search query, nothing else:"""

            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': 'qwen2.5:0.5b',
                'prompt': prompt,
                'stream': False,
                'options': {'temperature': 0.7, 'num_ctx': 512}
            }, timeout=10)
            
            if response.status_code == 200:
                query = response.json()['response'].strip().strip('"').strip("'")
                print(f"🧠 Ollama generated query: '{query}'")
                return query
            else:
                fallback = f"{industry} company email contact"
                print(f"⚠️  Ollama failed, using fallback: '{fallback}'")
                return fallback
                
        except Exception as e:
            fallback = f"{industry} business email address"
            print(f"❌ Ollama error: {str(e)}, using fallback: '{fallback}'")
            return fallback
    
    def human_delay(self, delay_range):
        """Add human-like random delays"""
        delay = random.uniform(delay_range[0], delay_range[1])
        time.sleep(delay)
    
    def search_google_like_human(self, query, page=0):
        """Search Google exactly like a human would, page by page"""
        try:
            print(f"🔍 Searching Google (page {page + 1}): '{query}'")
            
            # Human-like search URL construction
            start = page * 10  # Google shows 10 results per page
            search_url = f"https://www.google.com/search?q={quote(query)}&start={start}&num=10"
            
            # Add human-like headers variation
            self.session.headers.update({
                'Referer': 'https://www.google.com/' if page == 0 else f"https://www.google.com/search?q={quote(query)}&start={max(0, start-10)}",
                'Sec-Fetch-User': '?1' if page == 0 else None
            })
            
            # Human-like delay before search
            self.human_delay(self.search_delay)
            
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code == 200:
                return response.text
            elif response.status_code == 429:
                print(f"⚠️  Rate limited on page {page + 1}, waiting longer...")
                time.sleep(random.uniform(10, 20))
                return None
            else:
                print(f"❌ Google search failed with status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Google search error: {str(e)}")
            return None
    
    def extract_search_results(self, html_content):
        """Extract search results exactly like Google shows them"""
        soup = BeautifulSoup(html_content, 'html.parser')
        results = []
        
        # Google result containers (multiple selectors for robustness)
        result_selectors = [
            'div.g',  # Standard Google result
            'div[data-hveid]',  # Alternative selector
            '.rc',  # Classic selector
            'div.yuRUbf'  # New Google layout
        ]
        
        for selector in result_selectors:
            result_divs = soup.select(selector)
            if result_divs:
                print(f"   ✅ Found {len(result_divs)} results using selector: {selector}")
                break
        else:
            print(f"   ⚠️  No results found with standard selectors")
            return []
        
        for i, result_div in enumerate(result_divs):
            try:
                # Extract title (company name)
                title_elem = result_div.select_one('h3') or result_div.select_one('.LC20lb')
                title = title_elem.get_text().strip() if title_elem else "Unknown Company"
                
                # Extract URL (company website)
                link_elem = result_div.select_one('a[href]')
                url = link_elem['href'] if link_elem and link_elem.get('href') else None
                
                # Clean Google redirect URLs
                if url and url.startswith('/url?q='):
                    url = unquote(url.split('/url?q=')[1].split('&')[0])
                
                # Extract snippet/preview (where emails usually appear)
                snippet_selectors = [
                    '.VwiC3b',  # New Google snippet
                    '.s',       # Classic snippet
                    '.st',      # Alternative snippet
                    'span[data-ved]'  # Another snippet selector
                ]
                
                snippet = ""
                for snippet_sel in snippet_selectors:
                    snippet_elem = result_div.select_one(snippet_sel)
                    if snippet_elem:
                        snippet = snippet_elem.get_text().strip()
                        break
                
                if title and url:
                    result = {
                        'position': i + 1,
                        'title': title,
                        'url': url,
                        'snippet': snippet,
                        'domain': urlparse(url).netloc if url else None
                    }
                    results.append(result)
                    
            except Exception as e:
                print(f"   ⚠️  Error extracting result {i + 1}: {str(e)}")
                continue
        
        print(f"   📊 Extracted {len(results)} valid search results")
        return results
    
    def find_emails_in_preview(self, results):
        """Find emails in Google search previews/snippets"""
        emails_found = []
        
        print(f"   🔍 Scanning {len(results)} previews for email patterns...")
        
        for result in results:
            # Check snippet for email patterns
            snippet_text = result['snippet']
            emails_in_snippet = self.email_pattern.findall(snippet_text)
            
            # Also check title for emails (sometimes companies put emails in titles)
            title_text = result['title']
            emails_in_title = self.email_pattern.findall(title_text)
            
            all_emails = list(set(emails_in_snippet + emails_in_title))
            
            if all_emails:
                print(f"   ✅ Found {len(all_emails)} emails in preview for '{result['title']}'")
                for email in all_emails:
                    email_data = {
                        'email': email,
                        'company_name': result['title'],
                        'company_url': result['url'],
                        'source': 'google_preview',
                        'snippet': snippet_text,
                        'position': result['position'],
                        'domain': result['domain'],
                        'found_at': datetime.now().isoformat()
                    }
                    emails_found.append(email_data)
                    
                    print(f"      📧 {email} from {result['title']}")
        
        return emails_found
    
    def deep_scrape_company_link(self, result):
        """Click into company link and extract detailed info like a human would"""
        try:
            url = result['url']
            company_name = result['title']
            
            print(f"   🌐 Deep scraping: {company_name} ({url})")
            
            # Human-like delay before clicking
            self.human_delay(self.click_delay)
            
            # Try direct scraping first
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Remove scripts and styles
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Extract all text
                text = soup.get_text()
                
                # Find emails
                emails = self.email_pattern.findall(text)
                
                # Filter real emails
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
                    print(f"      ✅ Deep scrape found {len(real_emails)} emails")
                    return [{
                        'email': email,
                        'company_name': company_name,
                        'company_url': url,
                        'source': 'deep_scrape',
                        'snippet': result['snippet'],
                        'position': result['position'],
                        'domain': result['domain'],
                        'found_at': datetime.now().isoformat()
                    } for email in real_emails]
                else:
                    print(f"      ⚠️  No emails found in deep scrape")
                    return []
                    
            else:
                print(f"      ❌ Deep scrape failed: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"      ❌ Deep scrape error: {str(e)}")
            return []
    
    def generate_user_profile_with_ollama(self, email_data):
        """Generate user profile using Ollama based on found email and company info"""
        try:
            print(f"   🧠 Generating user profile for {email_data['email']}...")
            
            prompt = f"""Generate a professional user profile for this email contact based on the company information found:

Email: {email_data['email']}
Company: {email_data['company_name']}
Company URL: {email_data['company_url']}
Context: {email_data['snippet'][:200]}...

Generate a realistic profile including:
- Full name (based on email prefix if possible)
- Job title/role
- Company description
- Industry
- Professional background

Format as JSON:
{{
  "name": "Full Name",
  "email": "{email_data['email']}",
  "title": "Job Title", 
  "company": "{email_data['company_name']}",
  "industry": "Industry Name",
  "background": "Brief professional background"
}}

Return ONLY the JSON, no explanations:"""

            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': 'llama3.2',
                'prompt': prompt,
                'stream': False,
                'options': {'temperature': 0.3, 'num_ctx': 1024}
            }, timeout=15)
            
            if response.status_code == 200:
                profile_text = response.json()['response'].strip()
                
                # Try to parse JSON
                try:
                    # Extract JSON from response
                    json_start = profile_text.find('{')
                    json_end = profile_text.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        profile_json = json.loads(profile_text[json_start:json_end])
                        
                        print(f"      ✅ Generated profile for {profile_json.get('name', 'Unknown')}")
                        return profile_json
                    else:
                        raise ValueError("No JSON found")
                        
                except (json.JSONDecodeError, ValueError):
                    # Fallback profile
                    email_prefix = email_data['email'].split('@')[0]
                    fallback_profile = {
                        "name": email_prefix.replace('.', ' ').replace('_', ' ').title(),
                        "email": email_data['email'],
                        "title": "Professional",
                        "company": email_data['company_name'],
                        "industry": "Business",
                        "background": f"Professional at {email_data['company_name']}"
                    }
                    print(f"      ⚠️  JSON parsing failed, using fallback profile")
                    return fallback_profile
            else:
                print(f"      ❌ Ollama profile generation failed")
                return None
                
        except Exception as e:
            print(f"      ❌ Profile generation error: {str(e)}")
            return None
    
    def process_single_page_parallel(self, query, page):
        """Process a single Google results page and return all emails found"""
        page_emails = []
        
        try:
            # Search Google for this page
            html_content = self.search_google_like_human(query, page)
            if not html_content:
                return []
            
            # Extract search results
            results = self.extract_search_results(html_content)
            if not results:
                print(f"   ⚠️  No results on page {page + 1}")
                return []
            
            # Find emails in previews first (fast)
            preview_emails = self.find_emails_in_preview(results)
            page_emails.extend(preview_emails)
            
            # Immediately add preview emails to global list and trigger email generation
            if preview_emails:
                with self.email_lock:
                    self.found_emails.extend(preview_emails)
                    print(f"   ⚡ Added {len(preview_emails)} emails from page {page + 1} previews - triggering email generation!")
            
            # Deep scrape promising results (slower, in parallel)
            with ThreadPoolExecutor(max_workers=3) as executor:
                # Submit deep scraping tasks
                scraping_futures = []
                for result in results[:5]:  # Limit to top 5 results per page
                    if self.continue_searching:  # Check if we should continue
                        future = executor.submit(self.deep_scrape_company_link, result)
                        scraping_futures.append(future)
                
                # Collect deep scraping results
                for future in as_completed(scraping_futures):
                    try:
                        deep_emails = future.result()
                        if deep_emails:
                            page_emails.extend(deep_emails)
                            
                            # Immediately add to global list
                            with self.email_lock:
                                self.found_emails.extend(deep_emails)
                                print(f"   ⚡ Added {len(deep_emails)} emails from deep scraping - continuing search!")
                                
                    except Exception as e:
                        print(f"   ❌ Deep scraping future failed: {str(e)}")
            
            return page_emails
            
        except Exception as e:
            print(f"❌ Page {page + 1} processing failed: {str(e)}")
            return []
    def search_all_google_pages(self, industry, max_pages=3):
        """Search ALL Google pages for emails like a human would"""
        print(f"🎯 Starting Google-mimicking search for '{industry}' industry")
        print(f"   📄 Will search {max_pages} pages")
        print(f"   ⚡ Email generation starts immediately when first email found")
        print("=" * 60)
        
        # Get search query from Ollama
        query = self.get_ollama_query(industry)
        
        all_emails = []
        
        # Process multiple pages in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            # Submit page processing tasks
            page_futures = []
            for page in range(max_pages):
                future = executor.submit(self.process_single_page_parallel, query, page)
                page_futures.append((page, future))
            
            # Collect results as they complete
            for page, future in page_futures:
                try:
                    page_emails = future.result()
                    all_emails.extend(page_emails)
                    
                    if page_emails:
                        print(f"📄 Page {page + 1} complete: {len(page_emails)} emails found")
                    else:
                        print(f"📄 Page {page + 1} complete: No emails found")
                        
                except Exception as e:
                    print(f"❌ Page {page + 1} failed: {str(e)}")
        
        # Remove duplicates
        unique_emails = []
        seen_emails = set()
        for email_data in all_emails:
            if email_data['email'] not in seen_emails:
                unique_emails.append(email_data)
                seen_emails.add(email_data['email'])
        
        print(f"\n🎉 Google Search Complete!")
        print(f"   📧 Total unique emails found: {len(unique_emails)}")
        print(f"   🔍 Search query used: '{query}'")
        print(f"   📄 Pages processed: {max_pages}")
        
        return unique_emails
    
    def generate_profiles_for_all_emails(self, emails):
        """Generate user profiles for all found emails"""
        print(f"\n🧠 Generating user profiles for {len(emails)} emails...")
        
        profiles = []
        for i, email_data in enumerate(emails):
            print(f"👤 Profile {i + 1}/{len(emails)}: {email_data['email']}")
            
            profile = self.generate_user_profile_with_ollama(email_data)
            if profile:
                # Merge profile with email data
                full_profile = {**email_data, **profile}
                profiles.append(full_profile)
                
                # Log profile generation
                print(f"   ✅ Profile generated for {profile.get('name', 'Unknown')}")
            else:
                print(f"   ❌ Profile generation failed for {email_data['email']}")
            
            # Small delay between profile generations
            time.sleep(1)
        
        return profiles

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Please provide industry (e.g., "AI startups", "fruit companies")'}))
        return
    
    industry = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    engine = GoogleMimicSearchEngine()
    
    # Search all Google pages for emails
    found_emails = engine.search_all_google_pages(industry, max_pages)
    
    # Generate profiles for all emails
    complete_profiles = engine.generate_profiles_for_all_emails(found_emails)
    
    # Prepare final output
    output = {
        'emails': found_emails,
        'profiles': complete_profiles,
        'total_emails': len(found_emails),
        'total_profiles': len(complete_profiles),
        'industry': industry,
        'pages_searched': max_pages,
        'search_method': 'google_mimic_engine',
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 60)
    print("🎯 GOOGLE MIMIC SEARCH ENGINE RESULTS")
    print("=" * 60)
    if found_emails:
        print("📧 EMAILS FOUND:")
        for email_data in found_emails[:5]:  # Show first 5
            print(f"   📧 {email_data['email']} ({email_data['company_name']})")
        if len(found_emails) > 5:
            print(f"   ... and {len(found_emails) - 5} more")
    
    if complete_profiles:
        print(f"\n👤 USER PROFILES GENERATED: {len(complete_profiles)}")
        for profile in complete_profiles[:3]:  # Show first 3
            print(f"   👤 {profile.get('name', 'Unknown')} - {profile.get('title', 'Unknown')} at {profile.get('company', 'Unknown')}")
        if len(complete_profiles) > 3:
            print(f"   ... and {len(complete_profiles) - 3} more")
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()