#!/usr/bin/env python3
"""
Simple Web Email Search
简单直接的网络邮箱搜索 - 不依赖复杂的LLM function calling
- 直接搜索网络
- 智能邮箱提取
- 快速返回结果
- 零复杂依赖
"""

import sys
import json
import time
import re
import requests
import os
from datetime import datetime
from urllib.parse import quote, unquote
from bs4 import BeautifulSoup
import random

class SimpleWebEmailSearch:
    def __init__(self):
        # 搜索会话配置
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        
        # 邮箱匹配
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🔍 Simple Web Email Search 初始化")
        print("   🌐 搜索引擎: DuckDuckGo + Bing")
        print("   📧 邮箱发现: 直接提取")
        print("   ⚡ 特点: 快速、简单、可靠")
        
    def search_duckduckgo(self, query):
        """DuckDuckGo搜索"""
        try:
            print(f"   🦆 DuckDuckGo: {query}")
            
            search_url = f"https://duckduckgo.com/html/?q={quote(query)}"
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                
                for link in soup.find_all('a', class_='result__a')[:10]:
                    try:
                        title = link.get_text().strip()
                        url = link.get('href', '')
                        
                        parent = link.find_parent('div', class_='result')
                        description = ''
                        if parent:
                            snippet = parent.find('a', class_='result__snippet')
                            if snippet:
                                description = snippet.get_text().strip()
                        
                        if title and url and 'duckduckgo.com' not in url:
                            results.append({
                                'title': title,
                                'url': url,
                                'description': description
                            })
                    except:
                        continue
                
                print(f"      ✅ {len(results)}个结果")
                return results
            else:
                print(f"      ❌ 失败: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"      ❌ 错误: {str(e)}")
            return []
    
    def extract_emails_from_text(self, text):
        """从文本中提取有效邮箱"""
        emails = self.email_pattern.findall(text)
        
        valid_emails = []
        for email in emails:
            email_lower = email.lower()
            
            # 排除假邮箱
            if any(pattern in email_lower for pattern in [
                'example.com', 'test.com', 'domain.com', 'yoursite.com',
                'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@'
            ]):
                continue
            
            # 基本验证
            if 5 < len(email) < 100 and email.count('@') == 1:
                domain = email.split('@')[1]
                if '.' in domain and len(domain) > 4:
                    valid_emails.append(email)
        
        return valid_emails
    
    def scrape_website(self, url):
        """抓取网站内容"""
        try:
            print(f"      🌐 抓取: {url[:50]}...")
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 移除无用元素
                for element in soup(["script", "style", "nav", "footer"]):
                    element.decompose()
                
                text = soup.get_text()
                emails = self.extract_emails_from_text(text)
                
                if emails:
                    print(f"         ✅ 找到{len(emails)}个邮箱")
                    return emails
                else:
                    print(f"         ⚠️  未找到邮箱")
                    return []
                    
            else:
                print(f"         ❌ 失败: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"         ❌ 错误: {str(e)}")
            return []
    
    def search_for_emails(self, industry, max_emails=5):
        """搜索邮箱的主方法"""
        print(f"🔍 开始搜索 {industry} 行业邮箱")
        print(f"🎯 目标: {max_emails}个邮箱")
        print("=" * 50)
        
        all_emails = []
        
        # 多个搜索查询
        search_queries = [
            f"{industry} company contact email",
            f"{industry} business email address",
            f"{industry} company CEO founder email",
            f"{industry} startup contact information"
        ]
        
        for i, query in enumerate(search_queries, 1):
            print(f"\n📍 搜索策略 {i}/{len(search_queries)}: {query}")
            
            # 搜索
            results = self.search_duckduckgo(query)
            
            if results:
                # 从搜索结果描述中提取邮箱
                print(f"   📧 从搜索结果中提取邮箱...")
                for result in results:
                    text = f"{result['title']} {result['description']}"
                    emails = self.extract_emails_from_text(text)
                    
                    for email in emails:
                        if email not in all_emails:
                            all_emails.append(email)
                            print(f"      ✅ 找到: {email}")
                
                # 抓取前5个网站
                print(f"   🌐 抓取前5个网站...")
                for result in results[:5]:
                    if len(all_emails) >= max_emails:
                        break
                        
                    website_emails = self.scrape_website(result['url'])
                    for email in website_emails:
                        if email not in all_emails:
                            all_emails.append(email)
                            print(f"      ✅ 网站找到: {email}")
                    
                    time.sleep(1)  # 抓取间隔
            
            # 如果已找到足够邮箱就停止
            if len(all_emails) >= max_emails:
                print(f"   🎯 已达到目标邮箱数量")
                break
            
            # 查询间隔
            time.sleep(2)
        
        final_emails = all_emails[:max_emails]
        
        print(f"\n🎉 搜索完成!")
        print(f"   📧 找到邮箱: {len(final_emails)}个")
        
        return final_emails

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供行业名称 (例如: "AI startup", "fruit companies")'}))
        return
    
    industry = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # 执行搜索
    searcher = SimpleWebEmailSearch()
    emails = searcher.search_for_emails(industry, max_emails)
    
    # 准备输出
    output = {
        'success': True,
        'emails': emails,
        'total_emails': len(emails),
        'industry': industry,
        'search_method': 'simple_web_email_search',
        'fast_and_reliable': True,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 50)
    print("🔍 Simple Web Email Search 结果")
    print("=" * 50)
    
    if emails:
        print("📧 发现的邮箱:")
        for i, email in enumerate(emails, 1):
            print(f"   {i}. {email}")
    else:
        print("⚠️  未找到邮箱")
    
    print(f"\n📊 统计:")
    print(f"   📧 邮箱总数: {len(emails)}")
    print(f"   🌐 搜索引擎: DuckDuckGo")
    print(f"   ⚡ 方法: 简单直接")
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()