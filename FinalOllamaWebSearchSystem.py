#!/usr/bin/env python3
"""
Final Ollama Web Search System
最终版本：让Ollama直接具备联网搜索能力并返回真实邮箱
- 本地Ollama LLM (qwen2.5:0.5b快速模型)
- 直接网络搜索能力 (DuckDuckGo + 网站爬取)
- 智能邮箱发现和验证
- 立即返回找到的邮箱
- 完全自主运行
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
import concurrent.futures

class FinalOllamaWebSearchSystem:
    def __init__(self):
        # 本地Ollama配置
        self.ollama_url = 'http://localhost:11434'
        
        # 网络搜索配置
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        
        # 邮箱匹配和验证
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🤖 Final Ollama Web Search System 初始化")
        print("   🧠 AI引擎: 本地Ollama (qwen2.5:0.5b)")
        print("   🌐 搜索能力: 直接网络搜索")
        print("   📧 邮箱发现: 实时智能提取")
        print("   ⚡ 特点: Ollama具备完整联网能力")
        
    def generate_search_queries_with_ollama(self, industry):
        """使用Ollama生成智能搜索查询"""
        try:
            print(f"🧠 Ollama生成'{industry}'行业的搜索策略...")
            
            prompt = f"""为{industry}行业生成5个不同的网络搜索查询来找到公司邮箱地址。

要求:
1. 每个查询都应该能找到真实的商业邮箱
2. 针对不同类型的联系人(CEO, 销售, 客服等)
3. 包含具体的行业关键词
4. 适合在搜索引擎中使用

行业: {industry}

请返回5个搜索查询，每行一个:
1. 
2. 
3. 
4. 
5. 

只返回查询，不要解释:"""

            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': 'qwen2.5:0.5b',
                'prompt': prompt,
                'stream': False,
                'options': {'temperature': 0.7, 'num_ctx': 1024}
            }, timeout=30)
            
            if response.status_code == 200:
                result = response.json()['response'].strip()
                
                # 提取查询
                queries = []
                for line in result.split('\n'):
                    line = line.strip()
                    if line and (line.startswith(('1.', '2.', '3.', '4.', '5.')) or len(line) > 10):
                        # 清理行号
                        cleaned = re.sub(r'^\d+\.\s*', '', line).strip()
                        if cleaned and len(cleaned) > 5:
                            queries.append(cleaned)
                
                if queries:
                    print(f"   ✅ Ollama生成了{len(queries)}个搜索查询")
                    return queries[:5]
            
            # 备用查询
            print(f"   ⚠️  使用备用搜索查询")
            return [
                f"{industry} company contact email address",
                f"{industry} business CEO founder email",
                f"{industry} company customer service email",
                f"{industry} startup contact information",
                f"{industry} company sales email directory"
            ]
            
        except Exception as e:
            print(f"   ❌ Ollama查询生成失败: {str(e)}")
            return [f"{industry} company email contact"]
    
    def search_web_for_emails(self, query):
        """执行网络搜索并直接提取邮箱"""
        try:
            print(f"   🔍 网络搜索: {query}")
            
            # DuckDuckGo搜索
            search_url = f"https://duckduckgo.com/html/?q={quote(query)}"
            response = self.session.get(search_url, timeout=15)
            
            all_emails = []
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 从搜索结果中直接提取邮箱
                page_text = soup.get_text()
                preview_emails = self.extract_valid_emails(page_text)
                
                if preview_emails:
                    print(f"      📧 搜索预览中找到{len(preview_emails)}个邮箱")
                    for email in preview_emails:
                        all_emails.append({
                            'email': email,
                            'source': 'search_preview',
                            'query': query
                        })
                
                # 提取搜索结果链接
                result_links = []
                for link in soup.find_all('a', class_='result__a')[:8]:
                    try:
                        url = link.get('href', '')
                        title = link.get_text().strip()
                        if url and 'duckduckgo.com' not in url:
                            result_links.append({'url': url, 'title': title})
                    except:
                        continue
                
                # 并行爬取网站
                if result_links:
                    print(f"      🌐 爬取{len(result_links)}个网站...")
                    
                    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                        future_to_url = {
                            executor.submit(self.scrape_website_for_emails, link['url']): link 
                            for link in result_links
                        }
                        
                        for future in concurrent.futures.as_completed(future_to_url):
                            try:
                                link = future_to_url[future]
                                emails = future.result()
                                
                                if emails:
                                    print(f"         ✅ {link['title'][:30]}... 找到{len(emails)}个邮箱")
                                    for email in emails:
                                        all_emails.append({
                                            'email': email,
                                            'source': 'website_scraping',
                                            'source_url': link['url'],
                                            'source_title': link['title'],
                                            'query': query
                                        })
                                        
                            except Exception as e:
                                continue
            
            # 去重
            unique_emails = {}
            for email_data in all_emails:
                email = email_data['email']
                if email not in unique_emails:
                    unique_emails[email] = email_data
            
            return list(unique_emails.values())
            
        except Exception as e:
            print(f"      ❌ 搜索错误: {str(e)}")
            return []
    
    def scrape_website_for_emails(self, url):
        """爬取单个网站寻找邮箱"""
        try:
            response = self.session.get(url, timeout=8)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 移除无用元素
                for element in soup(["script", "style", "nav", "footer"]):
                    element.decompose()
                
                text = soup.get_text()
                emails = self.extract_valid_emails(text)
                
                return emails
            else:
                return []
                
        except Exception as e:
            return []
    
    def extract_valid_emails(self, text):
        """从文本中提取有效的商业邮箱"""
        emails = self.email_pattern.findall(text)
        
        valid_emails = []
        for email in emails:
            email_lower = email.lower()
            
            # 排除假邮箱
            if any(pattern in email_lower for pattern in [
                'example.com', 'test.com', 'domain.com', 'yoursite.com',
                'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
                'support@example', 'admin@example', 'info@example'
            ]):
                continue
            
            # 基本验证
            if 5 < len(email) < 100 and email.count('@') == 1:
                domain = email.split('@')[1]
                if '.' in domain and len(domain) > 4:
                    valid_emails.append(email)
        
        return valid_emails
    
    def analyze_found_emails_with_ollama(self, emails_data):
        """使用Ollama分析找到的邮箱并生成总结"""
        try:
            if not emails_data:
                return "未找到任何邮箱"
            
            print(f"   🧠 Ollama分析{len(emails_data)}个邮箱...")
            
            # 准备邮箱信息
            email_info = []
            for data in emails_data:
                email_info.append(f"- {data['email']} (来源: {data['source']})")
            
            prompt = f"""分析以下发现的邮箱地址，提供专业总结:

发现的邮箱:
{chr(10).join(email_info)}

请提供:
1. 邮箱总数
2. 主要来源类型
3. 推测的联系人类型(CEO, 销售, 客服等)
4. 建议的联系优先级

简洁回答，重点突出实用信息:"""

            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': 'qwen2.5:0.5b',
                'prompt': prompt,
                'stream': False,
                'options': {'temperature': 0.3, 'num_ctx': 1024}
            }, timeout=20)
            
            if response.status_code == 200:
                analysis = response.json()['response'].strip()
                print(f"   ✅ Ollama分析完成")
                return analysis
            else:
                return "Ollama分析失败"
                
        except Exception as e:
            print(f"   ❌ Ollama分析错误: {str(e)}")
            return f"找到{len(emails_data)}个邮箱，分析功能暂时不可用"
    
    def find_emails_with_ollama_web_search(self, industry, max_emails=5):
        """使用Ollama网络搜索功能发现邮箱"""
        print(f"🤖 启动Ollama网络搜索邮箱发现: {industry}")
        print(f"🎯 目标: {max_emails}个邮箱")
        print("=" * 60)
        
        # 1. 使用Ollama生成搜索策略
        search_queries = self.generate_search_queries_with_ollama(industry)
        
        all_emails = []
        
        # 2. 执行每个搜索查询
        for i, query in enumerate(search_queries, 1):
            print(f"\n📍 搜索策略 {i}/{len(search_queries)}")
            
            emails = self.search_web_for_emails(query)
            
            if emails:
                all_emails.extend(emails)
                print(f"   ✅ 本次搜索找到{len(emails)}个邮箱")
                
                # 立即返回找到的邮箱（根据用户要求）
                unique_emails = {}
                for email_data in all_emails:
                    email = email_data['email']
                    if email not in unique_emails:
                        unique_emails[email] = email_data
                
                if len(unique_emails) >= max_emails:
                    print(f"   🎯 已达到目标邮箱数量，立即返回结果")
                    break
            else:
                print(f"   ⚠️  本次搜索未找到邮箱")
            
            # 搜索间隔
            time.sleep(2)
        
        # 3. 去重并限制数量
        unique_emails = {}
        for email_data in all_emails:
            email = email_data['email']
            if email not in unique_emails:
                unique_emails[email] = email_data
        
        final_emails = list(unique_emails.values())[:max_emails]
        
        # 4. 使用Ollama分析结果
        analysis = self.analyze_found_emails_with_ollama(final_emails)
        
        print(f"\n🎉 搜索完成!")
        print(f"   📧 找到邮箱: {len(final_emails)}个")
        
        return {
            'success': True,
            'emails': [e['email'] for e in final_emails],
            'email_details': final_emails,
            'analysis': analysis,
            'search_queries': search_queries,
            'total_emails': len(final_emails)
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供行业名称 (例如: "AI startup", "fruit companies")'}))
        return
    
    industry = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # 初始化系统
    search_system = FinalOllamaWebSearchSystem()
    
    # 执行搜索
    results = search_system.find_emails_with_ollama_web_search(industry, max_emails)
    
    # 准备输出
    output = {
        'success': results['success'],
        'emails': results.get('emails', []),
        'email_details': results.get('email_details', []),
        'total_emails': results.get('total_emails', 0),
        'analysis': results.get('analysis', ''),
        'search_queries': results.get('search_queries', []),
        'industry': industry,
        'search_method': 'final_ollama_web_search',
        'ollama_enabled': True,
        'web_search_enabled': True,
        'real_time_discovery': True,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 60)
    print("🤖 Final Ollama Web Search System 结果")
    print("=" * 60)
    
    if results['success']:
        print("📧 发现的真实邮箱:")
        for email in results['emails']:
            print(f"   📧 {email}")
        
        print(f"\n🧠 Ollama智能分析:")
        print(f"   {results['analysis']}")
        
        print(f"\n📊 搜索统计:")
        print(f"   📧 邮箱总数: {results['total_emails']}")
        print(f"   🔍 搜索查询: {len(results['search_queries'])}个")
        print(f"   🧠 AI引擎: Ollama (本地)")
        print(f"   🌐 搜索引擎: DuckDuckGo + 网站爬取")
        print(f"   ⚡ 特色: Ollama直接具备联网搜索能力")
    else:
        print(f"❌ 搜索失败")
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()