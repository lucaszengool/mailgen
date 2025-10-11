#!/usr/bin/env python3
"""
Direct Ollama Web Search Email Finder
直接让Ollama具备联网搜索能力，返回真实邮箱
- 本地Ollama LLM
- 直接网络搜索(DuckDuckGo + Bing)
- Function Calling for web search
- 智能邮箱提取和验证
- 完全自主，实时搜索
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

class DirectOllamaWebSearch:
    def __init__(self):
        # 本地Ollama配置
        self.ollama_url = 'http://localhost:11434'
        
        # 搜索会话配置
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        })
        
        # 邮箱匹配和验证
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🔍 Direct Ollama Web Search Email Finder 初始化")
        print("   🧠 AI引擎: 本地Ollama with Function Calling")
        print("   🌐 搜索引擎: DuckDuckGo + Bing (直接)")
        print("   📧 邮箱发现: 实时搜索 + 智能提取")
        print("   ⚡ 特点: Ollama直接具备联网能力")
        
    def search_duckduckgo(self, query, num_results=15):
        """DuckDuckGo搜索"""
        try:
            print(f"   🦆 DuckDuckGo搜索: {query}")
            
            search_url = f"https://duckduckgo.com/html/?q={quote(query)}"
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                
                # 提取搜索结果
                for i, link in enumerate(soup.find_all('a', class_='result__a')[:num_results]):
                    try:
                        title = link.get_text().strip()
                        url = link.get('href', '')
                        
                        # 获取描述
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
                                'description': description,
                                'engine': 'duckduckgo',
                                'position': i + 1
                            })
                    except:
                        continue
                
                print(f"      ✅ DuckDuckGo: {len(results)}个结果")
                return results
            else:
                print(f"      ❌ DuckDuckGo失败: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"      ❌ DuckDuckGo错误: {str(e)}")
            return []
    
    def search_bing(self, query, num_results=15):
        """Bing搜索"""
        try:
            print(f"   🔍 Bing搜索: {query}")
            
            search_url = f"https://www.bing.com/search?q={quote(query)}&count={num_results}"
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                
                # Bing结果提取
                for i, result in enumerate(soup.find_all('li', class_='b_algo')[:num_results]):
                    try:
                        title_elem = result.find('h2')
                        if not title_elem:
                            continue
                            
                        link_elem = title_elem.find('a')
                        if not link_elem:
                            continue
                            
                        title = title_elem.get_text().strip()
                        url = link_elem.get('href', '')
                        
                        # 获取描述
                        desc_elem = result.find('div', class_='b_caption')
                        description = desc_elem.get_text().strip() if desc_elem else ''
                        
                        if title and url and 'bing.com' not in url and 'microsoft.com' not in url:
                            results.append({
                                'title': title,
                                'url': url,
                                'description': description,
                                'engine': 'bing',
                                'position': i + 1
                            })
                    except:
                        continue
                
                print(f"      ✅ Bing: {len(results)}个结果")
                return results
            else:
                print(f"      ❌ Bing失败: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"      ❌ Bing错误: {str(e)}")
            return []
    
    def scrape_website_for_emails(self, url):
        """抓取网站内容寻找邮箱"""
        try:
            print(f"      🌐 抓取: {url[:50]}...")
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 移除无用元素
                for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
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
                    return {
                        'url': url,
                        'emails': valid_emails,
                        'title': soup.find('title').get_text().strip() if soup.find('title') else '',
                        'content_length': len(text)
                    }
                else:
                    print(f"         ⚠️  未找到有效邮箱")
                    return None
                    
            else:
                print(f"         ❌ 抓取失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"         ❌ 抓取错误: {str(e)}")
            return None
    
    def is_valid_business_email(self, email):
        """验证商业邮箱"""
        email_lower = email.lower()
        
        # 排除明显假邮箱
        invalid_patterns = [
            'example.com', 'test.com', 'domain.com', 'yoursite.com',
            'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
            'support@example', 'admin@example', 'info@example',
            'contact@example', 'sales@example', 'yourname@',
            'name@company', 'email@website', 'user@domain'
        ]
        
        if any(pattern in email_lower for pattern in invalid_patterns):
            return False
        
        # 基本格式验证
        if 5 < len(email) < 100 and email.count('@') == 1:
            domain = email.split('@')[1]
            if '.' in domain and len(domain) > 4:
                return True
        
        return False
    
    def web_search_and_extract_emails(self, query, max_results=20):
        """执行网络搜索并提取邮箱 - 这是Ollama调用的核心function"""
        try:
            print(f"🔍 开始网络搜索: {query}")
            
            all_results = []
            all_emails = []
            
            # 1. DuckDuckGo搜索
            ddg_results = self.search_duckduckgo(query, max_results//2)
            all_results.extend(ddg_results)
            
            # 搜索间隔
            time.sleep(2)
            
            # 2. Bing搜索
            bing_results = self.search_bing(query, max_results//2)
            all_results.extend(bing_results)
            
            print(f"   📊 总搜索结果: {len(all_results)}个")
            
            # 3. 从搜索结果中提取邮箱
            print(f"   📧 从搜索结果描述中提取邮箱...")
            for result in all_results:
                # 从标题和描述中直接提取邮箱
                text_to_check = f"{result['title']} {result['description']}"
                emails_in_text = self.email_pattern.findall(text_to_check)
                
                for email in emails_in_text:
                    if self.is_valid_business_email(email):
                        all_emails.append({
                            'email': email,
                            'source': 'search_result',
                            'source_url': result['url'],
                            'source_title': result['title'],
                            'engine': result['engine']
                        })
            
            # 4. 抓取前10个最有前景的网站
            print(f"   🌐 抓取前10个网站寻找更多邮箱...")
            priority_urls = []
            
            # 优先选择包含contact, about, team等关键词的结果
            priority_keywords = ['contact', 'about', 'team', 'company', 'email']
            for result in all_results:
                url_lower = result['url'].lower()
                title_lower = result['title'].lower()
                if any(keyword in url_lower or keyword in title_lower for keyword in priority_keywords):
                    priority_urls.append(result['url'])
            
            # 如果优先URL不够，添加其他URL
            for result in all_results:
                if result['url'] not in priority_urls:
                    priority_urls.append(result['url'])
                if len(priority_urls) >= 10:
                    break
            
            # 抓取网站
            for url in priority_urls[:10]:
                website_data = self.scrape_website_for_emails(url)
                if website_data and website_data['emails']:
                    for email in website_data['emails']:
                        all_emails.append({
                            'email': email,
                            'source': 'website_scraping',
                            'source_url': url,
                            'source_title': website_data['title'],
                            'engine': 'direct_scraping'
                        })
                
                # 抓取间隔
                time.sleep(1)
            
            # 5. 去重并整理结果
            unique_emails = {}
            for email_data in all_emails:
                email = email_data['email']
                if email not in unique_emails:
                    unique_emails[email] = email_data
            
            final_emails = list(unique_emails.values())
            
            print(f"   ✅ 网络搜索完成，发现{len(final_emails)}个唯一邮箱")
            
            return {
                'success': True,
                'query': query,
                'total_search_results': len(all_results),
                'emails_found': len(final_emails),
                'emails': final_emails,
                'search_engines_used': ['duckduckgo', 'bing'],
                'websites_scraped': len(priority_urls)
            }
            
        except Exception as e:
            print(f"   ❌ 网络搜索失败: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'emails': []
            }
    
    def call_ollama_with_web_search(self, prompt, model='llama3.2'):
        """调用Ollama并提供网络搜索能力"""
        try:
            print(f"🧠 调用Ollama ({model}) with 网络搜索能力...")
            
            # 定义网络搜索工具
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "web_search_emails",
                        "description": "Search the web for company email addresses using multiple search engines",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Search query to find company emails (e.g., 'AI startup company email contact')"
                                },
                                "max_results": {
                                    "type": "integer",
                                    "description": "Maximum search results to process",
                                    "default": 20
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }
            ]
            
            # 第一次调用Ollama
            response = requests.post(f"{self.ollama_url}/api/chat", json={
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'tools': tools,
                'stream': False,
                'options': {
                    'temperature': 0.7,
                    'num_ctx': 4096
                }
            }, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', {})
                
                # 检查是否有工具调用
                tool_calls = message.get('tool_calls', [])
                
                if tool_calls:
                    print(f"   🛠️  Ollama请求进行{len(tool_calls)}次网络搜索")
                    
                    # 执行网络搜索
                    tool_results = []
                    for i, tool_call in enumerate(tool_calls):
                        function_name = tool_call['function']['name']
                        arguments = tool_call['function']['arguments']
                        
                        print(f"      🔧 执行搜索 {i+1}: {function_name}")
                        
                        if function_name == 'web_search_emails':
                            result = self.web_search_and_extract_emails(**arguments)
                            tool_results.append({
                                'tool_call_id': tool_call.get('id', f'call_{i}'),
                                'function_name': function_name,
                                'result': result
                            })
                        
                        # 搜索间隔
                        time.sleep(3)
                    
                    # 将搜索结果发送回Ollama
                    if tool_results:
                        print(f"   🧠 将搜索结果发送回Ollama进行分析...")
                        
                        messages = [
                            {'role': 'user', 'content': prompt},
                            message,
                        ]
                        
                        # 添加工具结果
                        for tool_result in tool_results:
                            messages.append({
                                'role': 'tool',
                                'content': json.dumps(tool_result['result'], ensure_ascii=False),
                                'tool_call_id': tool_result['tool_call_id']
                            })
                        
                        # 最终调用
                        final_response = requests.post(f"{self.ollama_url}/api/chat", json={
                            'model': model,
                            'messages': messages,
                            'stream': False,
                            'options': {
                                'temperature': 0.3,
                                'num_ctx': 4096
                            }
                        }, timeout=60)
                        
                        if final_response.status_code == 200:
                            final_data = final_response.json()
                            final_message = final_data.get('message', {})
                            
                            return {
                                'success': True,
                                'response': final_message.get('content', ''),
                                'tool_calls': tool_calls,
                                'tool_results': tool_results
                            }
                
                # 没有工具调用的普通响应
                return {
                    'success': True,
                    'response': message.get('content', ''),
                    'tool_calls': [],
                    'tool_results': []
                }
            else:
                return {'success': False, 'error': f'Ollama API error: {response.status_code}'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def find_emails_with_ollama_web_search(self, industry, max_emails=5):
        """使用具备网络搜索能力的Ollama发现邮箱"""
        print(f"🤖 启动Ollama网络搜索邮箱发现: {industry}")
        print(f"🎯 目标: {max_emails}个邮箱")
        print("=" * 60)
        
        # 构建智能prompt
        prompt = f"""我需要你帮我找到{industry}行业的真实公司邮箱地址。

请使用web_search_emails工具进行以下搜索:
1. 首先搜索 "{industry} company contact email address"
2. 如果需要更多邮箱，再搜索 "{industry} business CEO founder email"
3. 如果还需要，搜索 "{industry} company customer service contact"

重要要求:
- 只返回真实的商业邮箱地址，不要example.com等假邮箱
- 重点寻找公司联系邮箱、CEO邮箱、销售邮箱
- 尽量找到至少{max_emails}个不同的有效邮箱
- 每个邮箱请提供来源信息

请现在开始搜索并告诉我找到的真实邮箱地址。"""

        print(f"🧠 发送搜索指令给Ollama...")
        
        result = self.call_ollama_with_web_search(prompt)
        
        if result['success']:
            print(f"✅ Ollama网络搜索完成")
            
            # 收集所有找到的邮箱
            all_emails = []
            for tool_result in result['tool_results']:
                if tool_result['function_name'] == 'web_search_emails':
                    emails = tool_result['result'].get('emails', [])
                    all_emails.extend(emails)
            
            # 去重
            unique_emails = {}
            for email_data in all_emails:
                email = email_data['email']
                if email not in unique_emails:
                    unique_emails[email] = email_data
            
            final_emails = list(unique_emails.values())[:max_emails]
            
            print(f"\n📧 Ollama发现的邮箱:")
            for i, email_data in enumerate(final_emails, 1):
                print(f"   {i}. {email_data['email']} (来源: {email_data['source']})")
            
            print(f"\n🧠 Ollama分析:")
            print(f"   {result['response']}")
            
            return {
                'success': True,
                'emails': [e['email'] for e in final_emails],
                'email_details': final_emails,
                'llm_response': result['response'],
                'total_emails': len(final_emails),
                'search_calls': len(result['tool_calls'])
            }
        else:
            print(f"❌ Ollama网络搜索失败: {result['error']}")
            return {
                'success': False,
                'error': result['error'],
                'emails': [],
                'total_emails': 0
            }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供行业名称 (例如: "AI startup", "fruit companies")'}))
        return
    
    industry = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # 初始化直接网络搜索系统
    search_system = DirectOllamaWebSearch()
    
    # 执行邮箱发现
    results = search_system.find_emails_with_ollama_web_search(industry, max_emails)
    
    # 准备输出
    output = {
        'success': results['success'],
        'emails': results.get('emails', []),
        'email_details': results.get('email_details', []),
        'total_emails': results.get('total_emails', 0),
        'industry': industry,
        'search_method': 'direct_ollama_web_search',
        'llm_response': results.get('llm_response', ''),
        'search_calls': results.get('search_calls', 0),
        'ollama_web_enabled': True,
        'real_time_search': True,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 60)
    print("🔍 Direct Ollama Web Search 结果")
    print("=" * 60)
    
    if results['success']:
        print("📧 发现的真实邮箱:")
        for email in results['emails']:
            print(f"   📧 {email}")
        
        print(f"\n📊 搜索统计:")
        print(f"   📧 邮箱总数: {results['total_emails']}")
        print(f"   🔍 搜索调用: {results.get('search_calls', 0)}次")
        print(f"   🧠 AI引擎: Ollama (本地)")
        print(f"   🌐 搜索引擎: DuckDuckGo + Bing")
        print(f"   ⚡ 特色: Ollama直接具备联网能力")
    else:
        print(f"❌ 搜索失败: {results.get('error', 'Unknown error')}")
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()