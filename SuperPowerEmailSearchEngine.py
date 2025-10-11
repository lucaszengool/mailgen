#!/usr/bin/env python3
"""
SUPER POWER Email Search Engine
Uses multiple strategies to find REAL emails from web sources
"""

import sys
import json
import time
import re
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import random

class SuperPowerEmailSearchEngine:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.found_emails = set()
        
    def search_google_for_contacts(self, query, max_pages=3):
        """Search Google using advanced operators for contact information"""
        print(f"🔍 Searching Google for: {query}")
        
        # Advanced Google search operators for contact discovery
        search_queries = [
            f'"{query}" AND ("contact us" OR "contact@" OR "email" OR "reach us")',
            f'"{query}" AND ("CEO" OR "founder" OR "director") AND "email"',
            f'site:linkedin.com "{query}" AND "email"',
            f'"{query}" AND "contact" filetype:pdf',
            f'"{query}" AND inurl:contact',
            f'"{query}" AND inurl:about AND "email"',
            f'"{query}" AND ("team" OR "staff") AND "@"',
            f'intitle:"{query}" AND "contact"'
        ]
        
        all_urls = set()
        
        for search_query in search_queries:
            try:
                print(f"  📊 Query: {search_query[:50]}...")
                
                # Use DuckDuckGo as it's less likely to block
                search_url = f"https://duckduckgo.com/html/?q={search_query}"
                
                response = self.session.get(search_url, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Extract URLs from search results
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        if href.startswith('http') and 'duckduckgo.com' not in href:
                            all_urls.add(href)
                        elif href.startswith('//'):
                            all_urls.add('https:' + href)
                    
                    print(f"    ✅ Found {len(all_urls)} potential URLs")
                
                time.sleep(random.uniform(1, 3))  # Rate limiting
                
            except Exception as e:
                print(f"    ⚠️ Search failed: {str(e)}")
                continue
        
        return list(all_urls)[:50]  # Limit to top 50 URLs
    
    def extract_emails_from_url(self, url):
        """Extract emails from a specific URL"""
        try:
            print(f"  🌐 Scraping: {url[:60]}...")
            
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return []
            
            # Parse the content
            soup = BeautifulSoup(response.content, 'html.parser')
            text_content = soup.get_text()
            
            # Find all email addresses
            emails = self.email_pattern.findall(text_content)
            
            # Filter out common false positives
            filtered_emails = []
            for email in emails:
                email_lower = email.lower()
                # Skip common false positives
                if not any(skip in email_lower for skip in [
                    'example.com', 'test.com', 'domain.com', 'email.com',
                    'yoursite.com', 'yourcompany.com', 'company.com',
                    'noreply', 'no-reply', 'donotreply', 'support@google',
                    'privacy@', 'legal@', 'abuse@'
                ]):
                    filtered_emails.append(email)
            
            if filtered_emails:
                print(f"    ✅ Found {len(filtered_emails)} emails: {filtered_emails[:3]}...")
                
            return filtered_emails
            
        except Exception as e:
            print(f"    ⚠️ Failed to scrape {url}: {str(e)}")
            return []
    
    def find_contact_pages(self, base_url):
        """Find contact pages on a website"""
        contact_paths = [
            '/contact', '/contact-us', '/contact_us', '/contacts',
            '/about', '/about-us', '/about_us', '/team', '/staff',
            '/leadership', '/management', '/executives', '/founders',
            '/press', '/media', '/investor-relations', '/investors'
        ]
        
        contact_urls = []
        parsed_url = urlparse(base_url)
        base = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        for path in contact_paths:
            contact_url = base + path
            contact_urls.append(contact_url)
            # Also try with .html extension
            contact_urls.append(contact_url + '.html')
        
        return contact_urls
    
    def deep_search_website(self, website_url):
        """Perform deep search on a specific website"""
        print(f"🏢 Deep searching website: {website_url}")
        
        emails = []
        
        # 1. Search main page
        main_emails = self.extract_emails_from_url(website_url)
        emails.extend(main_emails)
        
        # 2. Search contact pages
        contact_urls = self.find_contact_pages(website_url)
        for contact_url in contact_urls:
            contact_emails = self.extract_emails_from_url(contact_url)
            emails.extend(contact_emails)
            time.sleep(1)  # Rate limiting
        
        # 3. Try to find sitemap
        try:
            sitemap_url = urljoin(website_url, '/sitemap.xml')
            sitemap_emails = self.extract_emails_from_url(sitemap_url)
            emails.extend(sitemap_emails)
        except:
            pass
        
        return list(set(emails))  # Remove duplicates
    
    def search_business_directories(self, query):
        """Search business directories for contact information"""
        print(f"📂 Searching business directories for: {query}")
        
        directory_searches = [
            f"site:crunchbase.com \"{query}\" contact",
            f"site:linkedin.com/company \"{query}\"",
            f"site:glassdoor.com \"{query}\" contact",
            f"site:indeed.com \"{query}\" company",
            f"site:yellowpages.com \"{query}\"",
            f"site:yelp.com \"{query}\"",
            f"site:bbb.org \"{query}\"",
            f"site:manta.com \"{query}\""
        ]
        
        all_emails = []
        
        for search in directory_searches:
            try:
                # Use Bing search as alternative
                search_url = f"https://www.bing.com/search?q={search}"
                response = self.session.get(search_url, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Extract URLs from Bing results
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        if 'http' in href and any(site in href for site in ['crunchbase', 'linkedin', 'glassdoor']):
                            # Extract emails from these pages
                            page_emails = self.extract_emails_from_url(href)
                            all_emails.extend(page_emails)
                
                time.sleep(random.uniform(2, 4))
                
            except Exception as e:
                print(f"  ⚠️ Directory search failed: {str(e)}")
                continue
        
        return list(set(all_emails))
    
    def search_professional_networks(self, query):
        """Search professional networks and social platforms"""
        print(f"👥 Searching professional networks for: {query}")
        
        # Professional network searches
        network_queries = [
            f"site:about.me \"{query}\" email",
            f"site:angel.co \"{query}\" contact",
            f"site:twitter.com \"{query}\" email",
            f"site:github.com \"{query}\" email",
            f"site:medium.com \"{query}\" contact"
        ]
        
        all_emails = []
        
        for search in network_queries:
            try:
                # Use different search engines to avoid blocks
                search_engines = [
                    f"https://duckduckgo.com/html/?q={search}",
                    f"https://www.startpage.com/do/search?q={search}"
                ]
                
                for search_url in search_engines:
                    try:
                        response = self.session.get(search_url, timeout=10)
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.content, 'html.parser')
                            
                            # Extract and follow relevant links
                            for link in soup.find_all('a', href=True):
                                href = link['href']
                                if 'http' in href and any(site in href for site in ['about.me', 'angel.co', 'twitter.com']):
                                    page_emails = self.extract_emails_from_url(href)
                                    all_emails.extend(page_emails)
                                    
                        time.sleep(2)
                        break  # If one search engine works, use it
                        
                    except:
                        continue
                        
            except Exception as e:
                print(f"  ⚠️ Network search failed: {str(e)}")
                continue
        
        return list(set(all_emails))
    
    def search_real_emails(self, query, max_attempts=10):
        """Main method to search for real emails using multiple strategies"""
        print(f"🚀 SUPER POWER Email Search for: {query}")
        print(f"🎯 Max attempts: {max_attempts}")
        print("=" * 60)
        
        all_emails = []
        attempt = 1
        
        # Strategy 1: Google Advanced Search
        try:
            print(f"\n📍 Attempt {attempt}: Google Advanced Search")
            google_urls = self.search_google_for_contacts(query)
            
            for url in google_urls[:10]:  # Limit to top 10 URLs
                emails = self.extract_emails_from_url(url)
                all_emails.extend(emails)
                
                if len(all_emails) >= max_attempts:
                    break
                    
            attempt += 1
            
        except Exception as e:
            print(f"❌ Google search failed: {str(e)}")
        
        # Strategy 2: Business Directories
        if attempt <= max_attempts and len(all_emails) < 5:
            try:
                print(f"\n📍 Attempt {attempt}: Business Directories")
                directory_emails = self.search_business_directories(query)
                all_emails.extend(directory_emails)
                attempt += 1
                
            except Exception as e:
                print(f"❌ Directory search failed: {str(e)}")
        
        # Strategy 3: Professional Networks
        if attempt <= max_attempts and len(all_emails) < 5:
            try:
                print(f"\n📍 Attempt {attempt}: Professional Networks")
                network_emails = self.search_professional_networks(query)
                all_emails.extend(network_emails)
                attempt += 1
                
            except Exception as e:
                print(f"❌ Network search failed: {str(e)}")
        
        # Strategy 4: Deep Website Search (if we found company websites)
        if attempt <= max_attempts and len(all_emails) < 5:
            print(f"\n📍 Attempt {attempt}: Deep Website Analysis")
            
            # Look for company websites in the found URLs
            for url in google_urls[:5]:
                if any(indicator in url.lower() for indicator in ['.com', '.org', '.net', '.io']):
                    website_emails = self.deep_search_website(url)
                    all_emails.extend(website_emails)
                    
                    if len(all_emails) >= 5:
                        break
            
            attempt += 1
        
        # Remove duplicates and filter
        unique_emails = list(set(all_emails))
        
        # Final filtering
        final_emails = []
        for email in unique_emails:
            # Additional validation
            if '@' in email and '.' in email.split('@')[1]:
                final_emails.append({
                    'email': email,
                    'source': 'super_power_search',
                    'confidence': 0.9,
                    'method': 'web_scraping'
                })
        
        print(f"\n🎉 SEARCH COMPLETE!")
        print(f"📊 Total attempts: {attempt - 1}")
        print(f"📧 Emails found: {len(final_emails)}")
        
        if final_emails:
            print("✅ Real emails discovered:")
            for email_data in final_emails[:5]:
                print(f"  📧 {email_data['email']}")
        else:
            print("⚠️ No emails found after extensive search")
        
        return final_emails

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        return
    
    query = sys.argv[1]
    max_attempts = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    engine = SuperPowerEmailSearchEngine()
    results = engine.search_real_emails(query, max_attempts)
    
    output = {
        'emails': results,
        'total_found': len(results),
        'query': query,
        'search_method': 'super_power_engine'
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()