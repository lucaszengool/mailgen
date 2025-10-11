#!/usr/bin/env python3
"""
Local Ollama Email Finder
完全本地的AI邮箱发现系统 - 不使用任何外部API
- 基于本地Ollama LLM
- 智能生成搜索策略和查询
- 本地网络爬虫 + AI分析
- 完全自主，不依赖外部服务
"""

import sys
import json
import time
import re
import requests
import os
from datetime import datetime
from urllib.parse import urlparse, quote, urljoin
from bs4 import BeautifulSoup
import concurrent.futures
import random

class LocalOllamaEmailFinder:
    def __init__(self):
        # 本地Ollama配置
        self.ollama_url = 'http://localhost:11434'
        
        # 本地爬虫配置
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        
        # 邮箱匹配模式
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🤖 Local Ollama Email Finder 已初始化")
        print("   🧠 AI引擎: 本地Ollama (完全离线)")
        print("   🔍 搜索引擎: 本地智能爬虫")
        print("   📧 邮箱发现: AI指导的网络搜索")
        print("   🚫 外部API: 零依赖")
        print("   ⚡ 优势: 完全自主，隐私安全")
        
    def ask_ollama(self, prompt, model='qwen2.5:0.5b', temperature=0.7):
        """与本地Ollama交互的通用方法"""
        try:
            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': temperature,
                    'num_ctx': 2048
                }
            }, timeout=30)
            
            if response.status_code == 200:
                return response.json()['response'].strip()
            else:
                print(f"⚠️  Ollama API错误: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Ollama请求失败: {str(e)}")
            return None
    
    def generate_search_strategy(self, industry):
        """让本地Ollama生成智能搜索策略"""
        print(f"🧠 正在为'{industry}'行业生成搜索策略...")
        
        prompt = f"""为{industry}行业生成简短高效的邮箱搜索策略。

要求:
- 搜索词组必须简短(最多3-4个词)
- 不使用复杂操作符(site:, intext:, filetype:等)
- 直接有效的关键词组合

返回JSON格式:
{{
  "search_queries": [
    "{industry} CEO email",
    "{industry} founder contact",
    "{industry} business email",
    "{industry} company contact",
    "{industry} sales email"
  ],
  "website_types": [
    "网站类型1",
    "网站类型2", 
    "网站类型3"
  ],
  "industry_keywords": [
    "关键词1", "关键词2", "关键词3", "关键词4", "关键词5"
  ]
}}

只返回JSON，不要其他文字:"""

        response = self.ask_ollama(prompt, temperature=0.3)
        
        if response:
            try:
                # 提取JSON
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    strategy = json.loads(response[json_start:json_end])
                    
                    print(f"   ✅ 生成了搜索策略:")
                    print(f"      📝 搜索查询: {len(strategy.get('search_queries', []))}个")
                    print(f"      🌐 网站类型: {len(strategy.get('website_types', []))}个")
                    print(f"      🔑 行业关键词: {len(strategy.get('industry_keywords', []))}个")
                    
                    return strategy
            except json.JSONDecodeError:
                pass
        
        # 备用策略
        print("   ⚠️  使用备用搜索策略")
        return {
            "search_queries": [
                f"{industry} company CEO founder email contact",
                f"{industry} business sales email address",
                f"{industry} company contact us email",
                f"{industry} partnership business development email",
                f"{industry} customer support contact email"
            ],
            "website_types": [
                "公司官网",
                "行业目录", 
                "商业平台"
            ],
            "industry_keywords": [
                industry, "business", "company", "contact", "email"
            ]
        }
    
    def search_web_intelligently(self, query, max_results=10):
        """智能网络搜索 - 使用多个搜索引擎"""
        print(f"   🔍 搜索: {query}")
        
        search_engines = [
            {
                'name': 'DuckDuckGo',
                'url': 'https://duckduckgo.com/html/',
                'params': {'q': query}
            },
            {
                'name': 'Bing', 
                'url': 'https://www.bing.com/search',
                'params': {'q': query, 'count': max_results}
            }
        ]
        
        all_urls = []
        
        for engine in search_engines:
            try:
                print(f"      📡 尝试{engine['name']}...")
                
                response = self.session.get(
                    engine['url'], 
                    params=engine['params'], 
                    timeout=10
                )
                
                if response.status_code == 200:
                    urls = self.extract_urls_from_search_results(response.text, engine['name'])
                    all_urls.extend(urls)
                    print(f"         ✅ 找到{len(urls)}个URLs")
                    
                    if len(all_urls) >= max_results:
                        break
                else:
                    print(f"         ❌ {engine['name']} 失败: {response.status_code}")
                
                # 搜索引擎间延迟
                time.sleep(random.uniform(2, 4))
                
            except Exception as e:
                print(f"         ❌ {engine['name']} 错误: {str(e)}")
                continue
        
        # 去重并限制数量
        unique_urls = list(set(all_urls))[:max_results]
        print(f"      📊 总共收集到{len(unique_urls)}个唯一URLs")
        
        return unique_urls
    
    def extract_urls_from_search_results(self, html, engine_name):
        """从搜索结果页面提取URLs"""
        soup = BeautifulSoup(html, 'html.parser')
        urls = []
        
        try:
            if engine_name == 'DuckDuckGo':
                # DuckDuckGo结果选择器
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if href.startswith('http') and 'duckduckgo.com' not in href:
                        urls.append(href)
                        
            elif engine_name == 'Bing':
                # Bing结果选择器
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if href.startswith('http') and 'bing.com' not in href and 'microsoft.com' not in href:
                        urls.append(href)
            
        except Exception as e:
            print(f"         ⚠️  URL提取错误: {str(e)}")
        
        return urls[:15]  # 限制每个搜索引擎的结果数量
    
    def scrape_website_for_emails(self, url):
        """爬取网站寻找邮箱"""
        try:
            print(f"      🌐 爬取: {url[:50]}...")
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 移除无用元素
                for element in soup(["script", "style", "nav", "footer"]):
                    element.decompose()
                
                # 提取文本
                text = soup.get_text()
                
                # 查找邮箱
                emails = self.email_pattern.findall(text)
                
                # 过滤有效邮箱
                valid_emails = []
                for email in emails:
                    if self.is_valid_business_email(email):
                        valid_emails.append(email)
                
                if valid_emails:
                    print(f"         ✅ 找到{len(valid_emails)}个邮箱")
                    
                    # 尝试获取页面标题作为公司名
                    title_elem = soup.find('title')
                    page_title = title_elem.get_text().strip() if title_elem else ''
                    company_name = self.extract_company_name_from_title(page_title, url)
                    
                    return {
                        'url': url,
                        'emails': valid_emails,
                        'company_name': company_name,
                        'page_title': page_title,
                        'content_snippet': text[:300].replace('\n', ' ').strip()
                    }
                else:
                    print(f"         ⚠️  未找到有效邮箱")
                    return None
                    
            else:
                print(f"         ❌ 访问失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"         ❌ 爬取错误: {str(e)}")
            return None
    
    def is_valid_business_email(self, email):
        """验证是否为有效商业邮箱"""
        email_lower = email.lower()
        
        # 排除假邮箱
        invalid_patterns = [
            'example.com', 'test.com', 'domain.com', 'yoursite.com',
            'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
            'support@example', 'admin@example', 'info@example'
        ]
        
        if any(pattern in email_lower for pattern in invalid_patterns):
            return False
        
        # 基本格式验证
        if 5 < len(email) < 100 and email.count('@') == 1:
            domain = email.split('@')[1]
            if '.' in domain and len(domain) > 4:
                return True
        
        return False
    
    def extract_company_name_from_title(self, title, url):
        """从页面标题或URL提取公司名"""
        try:
            if title:
                # 清理标题
                cleaned_title = title.split('|')[0].split('-')[0].strip()
                if len(cleaned_title) > 0 and len(cleaned_title) < 50:
                    return cleaned_title
            
            # 从URL提取
            parsed = urlparse(url)
            domain = parsed.netloc.replace('www.', '')
            company = domain.split('.')[0]
            return company.title()
            
        except:
            return 'Unknown Company'
    
    def analyze_emails_with_ollama(self, email_results):
        """使用本地Ollama分析发现的邮箱并生成profiles"""
        print(f"   🧠 使用Ollama分析{len(email_results)}个邮箱结果...")
        
        analyzed_emails = []
        
        for result in email_results:
            for email in result['emails']:
                try:
                    print(f"      👤 分析邮箱: {email}")
                    
                    prompt = f"""分析这个邮箱并生成专业profile:

邮箱: {email}
公司: {result['company_name']}
网站: {result['url']}
页面标题: {result['page_title']}
内容摘要: {result['content_snippet']}

基于以上信息生成profile，返回JSON:
{{
  "name": "推测的全名",
  "email": "{email}",
  "title": "推测的职位",
  "company": "{result['company_name']}",
  "industry": "推测的行业",
  "background": "简要背景描述",
  "confidence": "信心度(0.1-1.0)"
}}

只返回JSON:"""

                    response = self.ask_ollama(prompt, model='llama3.2', temperature=0.3)
                    
                    if response:
                        try:
                            json_start = response.find('{')
                            json_end = response.rfind('}') + 1
                            if json_start != -1:
                                profile = json.loads(response[json_start:json_end])
                                
                                # 添加额外信息
                                profile.update({
                                    'source_url': result['url'],
                                    'page_title': result['page_title'],
                                    'content_snippet': result['content_snippet'],
                                    'found_at': datetime.now().isoformat(),
                                    'analysis_method': 'local_ollama'
                                })
                                
                                analyzed_emails.append(profile)
                                print(f"         ✅ 生成profile: {profile.get('name', 'Unknown')}")
                                
                        except json.JSONDecodeError:
                            print(f"         ⚠️  Profile生成失败，使用基础信息")
                            # 基础profile
                            email_prefix = email.split('@')[0]
                            basic_profile = {
                                'name': email_prefix.replace('.', ' ').replace('_', ' ').title(),
                                'email': email,
                                'title': 'Professional',
                                'company': result['company_name'],
                                'industry': 'Business',
                                'background': f"Professional at {result['company_name']}",
                                'confidence': 0.5,
                                'source_url': result['url'],
                                'found_at': datetime.now().isoformat(),
                                'analysis_method': 'basic_extraction'
                            }
                            analyzed_emails.append(basic_profile)
                    
                    # 分析间隔
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"         ❌ 邮箱分析失败: {str(e)}")
                    continue
        
        return analyzed_emails
    
    def find_emails_with_local_ai(self, industry, max_emails=5):
        """使用本地AI进行邮箱发现的主方法"""
        print(f"🤖 启动本地AI邮箱发现: {industry}")
        print(f"🎯 目标: {max_emails}个邮箱")
        print("=" * 60)
        
        # 1. 生成搜索策略
        strategy = self.generate_search_strategy(industry)
        
        all_email_results = []
        all_analyzed_profiles = []
        
        # 2. 执行每个搜索查询
        for i, query in enumerate(strategy['search_queries'], 1):
            print(f"\n📍 执行搜索策略 {i}/{len(strategy['search_queries'])}")
            print(f"   🔍 查询: {query}")
            
            try:
                # 搜索网络
                urls = self.search_web_intelligently(query, max_results=8)
                
                if urls:
                    print(f"   📄 找到{len(urls)}个候选网站，开始爬取...")
                    
                    # 并行爬取网站
                    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                        future_to_url = {
                            executor.submit(self.scrape_website_for_emails, url): url 
                            for url in urls[:6]  # 限制并发数量
                        }
                        
                        for future in concurrent.futures.as_completed(future_to_url):
                            try:
                                result = future.result()
                                if result and result['emails']:
                                    all_email_results.append(result)
                                    print(f"      ✅ 从{result['company_name']}找到{len(result['emails'])}个邮箱")
                                    
                                    # 检查是否已达到目标
                                    total_emails = sum(len(r['emails']) for r in all_email_results)
                                    if total_emails >= max_emails:
                                        print(f"   🎯 已达到目标邮箱数量")
                                        break
                                        
                            except Exception as e:
                                print(f"      ❌ 爬取任务失败: {str(e)}")
                
                # 查询间隔
                time.sleep(random.uniform(3, 6))
                
                # 检查是否已有足够邮箱
                total_emails = sum(len(r['emails']) for r in all_email_results)
                if total_emails >= max_emails:
                    break
                    
            except Exception as e:
                print(f"   ❌ 搜索策略{i}失败: {str(e)}")
                continue
        
        # 3. 使用Ollama分析所有发现的邮箱
        if all_email_results:
            print(f"\n🧠 使用本地Ollama分析发现的邮箱...")
            all_analyzed_profiles = self.analyze_emails_with_ollama(all_email_results)
        
        # 4. 整理结果
        unique_emails = []
        seen_emails = set()
        
        for profile in all_analyzed_profiles:
            if profile['email'] not in seen_emails:
                unique_emails.append(profile)
                seen_emails.add(profile['email'])
        
        # 限制到目标数量
        final_results = unique_emails[:max_emails]
        
        print(f"\n🎉 本地AI邮箱发现完成!")
        print(f"   📧 发现的唯一邮箱: {len(final_results)}")
        print(f"   🧠 AI分析的profiles: {len(final_results)}")
        print(f"   🔍 使用的搜索策略: {len(strategy['search_queries'])}")
        print(f"   🌐 爬取的网站: {len(all_email_results)}")
        
        return {
            'emails': final_results,
            'strategy': strategy,
            'total_websites_scraped': len(all_email_results),
            'total_emails_found': len(final_results),
            'search_method': 'local_ollama_ai'
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供行业名称 (例如: "AI startups", "fruit companies")'}))
        return
    
    industry = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    finder = LocalOllamaEmailFinder()
    
    # 执行本地AI邮箱发现
    results = finder.find_emails_with_local_ai(industry, max_emails)
    
    # 准备输出
    output = {
        'emails': results['emails'],
        'strategy_used': results['strategy'],
        'total_emails': results['total_emails_found'],
        'websites_scraped': results['total_websites_scraped'],
        'industry': industry,
        'search_method': 'local_ollama_ai',
        'completely_local': True,
        'no_external_apis': True,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 60)
    print("🤖 本地OLLAMA AI邮箱发现结果")
    print("=" * 60)
    
    if results['emails']:
        print("📧 发现的邮箱和Profiles:")
        for profile in results['emails']:
            print(f"   📧 {profile['email']}")
            print(f"      👤 {profile.get('name', 'Unknown')} - {profile.get('title', 'Unknown')}")
            print(f"      🏢 {profile.get('company', 'Unknown')}")
            print(f"      🌐 来源: {profile.get('source_url', 'Unknown')}")
            print()
    
    print(f"🎯 搜索策略:")
    for i, query in enumerate(results['strategy']['search_queries'], 1):
        print(f"   {i}. {query}")
    
    print(f"\n📊 统计:")
    print(f"   📧 发现邮箱: {results['total_emails_found']}")
    print(f"   🌐 爬取网站: {results['total_websites_scraped']}")
    print(f"   🚫 外部API: 0 (完全本地)")
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()