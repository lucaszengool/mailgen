#!/usr/bin/env python3
"""
Simplified Local Web Search LLM
简化版本的本地网络搜索LLM - 直接使用DuckDuckGo
- 本地Ollama LLM with Function Calling
- 直接搜索DuckDuckGo (无需SearxNG)
- 智能邮箱发现
- 完全本地，零外部API依赖
"""

import sys
import json
import time
import re
import requests
import os
from datetime import datetime
from urllib.parse import quote, urljoin
from bs4 import BeautifulSoup
import random

class SimplifiedLocalWebSearchLLM:
    def __init__(self):
        # 本地Ollama配置
        self.ollama_url = 'http://localhost:11434'
        
        # 搜索配置
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        
        # 邮箱匹配模式
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🔍 Simplified Local Web Search LLM 初始化")
        print("   🧠 AI引擎: 本地Ollama")
        print("   🌐 搜索引擎: DuckDuckGo (直接访问)")
        print("   🛠️  功能: Function Calling + Web Search")
        print("   🚫 外部依赖: 零 (无需SearxNG)")
        
    def web_search_function(self, query, num_results=10):
        """Web搜索function - 直接使用DuckDuckGo"""
        try:
            print(f"   🔍 DuckDuckGo搜索: {query}")
            
            # DuckDuckGo HTML搜索
            search_url = f"https://duckduckgo.com/html/?q={quote(query)}"
            
            response = self.session.get(search_url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 提取搜索结果
                results = []
                result_links = soup.find_all('a', class_='result__a')
                
                for i, link in enumerate(result_links[:num_results]):
                    try:
                        title = link.get_text().strip()
                        url = link.get('href', '')
                        
                        # 获取结果的描述
                        result_div = link.find_parent('div', class_='result')
                        description = ''
                        if result_div:
                            desc_elem = result_div.find('a', class_='result__snippet')
                            if desc_elem:
                                description = desc_elem.get_text().strip()
                        
                        if title and url:
                            results.append({
                                'title': title,
                                'url': url,
                                'content': description,
                                'engine': 'duckduckgo',
                                'position': i + 1
                            })
                            
                    except Exception as e:
                        continue
                
                print(f"      ✅ 找到{len(results)}个结果")
                return {
                    'success': True,
                    'results': results,
                    'query': query,
                    'total_results': len(results)
                }
            else:
                print(f"      ❌ 搜索失败: {response.status_code}")
                return {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except Exception as e:
            print(f"      ❌ 搜索错误: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def scrape_website_function(self, url):
        """网站内容抓取function"""
        try:
            print(f"   🌐 抓取网站: {url[:50]}...")
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 移除无用元素
                for element in soup(["script", "style", "nav", "footer", "header"]):
                    element.decompose()
                
                # 提取文本
                text = soup.get_text()
                
                # 清理文本
                lines = [line.strip() for line in text.splitlines()]
                cleaned_text = ' '.join([line for line in lines if line])
                
                # 限制长度
                if len(cleaned_text) > 2000:
                    cleaned_text = cleaned_text[:2000] + "..."
                
                print(f"      ✅ 抓取成功 ({len(cleaned_text)}字符)")
                return {
                    'success': True,
                    'url': url,
                    'content': cleaned_text,
                    'length': len(cleaned_text)
                }
            else:
                print(f"      ❌ 抓取失败: {response.status_code}")
                return {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except Exception as e:
            print(f"      ❌ 抓取错误: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def extract_emails_function(self, text):
        """邮箱提取function"""
        try:
            emails = self.email_pattern.findall(text)
            
            # 过滤有效邮箱
            valid_emails = []
            for email in emails:
                if self.is_valid_business_email(email):
                    valid_emails.append(email)
            
            print(f"      📧 提取到{len(valid_emails)}个有效邮箱")
            return {
                'success': True,
                'emails': valid_emails,
                'total_found': len(valid_emails)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def is_valid_business_email(self, email):
        """验证商业邮箱"""
        email_lower = email.lower()
        
        invalid_patterns = [
            'example.com', 'test.com', 'domain.com', 'yoursite.com',
            'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
            'support@example', 'admin@example', 'info@example'
        ]
        
        if any(pattern in email_lower for pattern in invalid_patterns):
            return False
        
        if 5 < len(email) < 100 and email.count('@') == 1:
            domain = email.split('@')[1]
            if '.' in domain and len(domain) > 4:
                return True
        
        return False
    
    def call_ollama_with_tools(self, prompt, model='llama3.2'):
        """调用Ollama并提供工具"""
        try:
            # 定义可用工具
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "web_search",
                        "description": "Search the web using DuckDuckGo",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The search query"
                                },
                                "num_results": {
                                    "type": "integer",
                                    "description": "Number of results to return",
                                    "default": 10
                                }
                            },
                            "required": ["query"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "scrape_website",
                        "description": "Scrape content from a specific website URL",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "The URL to scrape"
                                }
                            },
                            "required": ["url"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "extract_emails",
                        "description": "Extract email addresses from text content",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "text": {
                                    "type": "string",
                                    "description": "Text content to extract emails from"
                                }
                            },
                            "required": ["text"]
                        }
                    }
                }
            ]
            
            print(f"🧠 调用Ollama ({model}) with {len(tools)} tools...")
            
            # 调用Ollama
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
            }, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', {})
                
                print(f"   ✅ Ollama响应成功")
                
                # 检查是否有工具调用
                tool_calls = message.get('tool_calls', [])
                
                if tool_calls:
                    print(f"   🛠️  LLM请求调用{len(tool_calls)}个工具")
                    
                    # 执行工具调用
                    tool_results = []
                    for i, tool_call in enumerate(tool_calls):
                        function_name = tool_call['function']['name']
                        arguments = tool_call['function']['arguments']
                        
                        print(f"      🔧 工具 {i+1}: {function_name}")
                        
                        if function_name == 'web_search':
                            result = self.web_search_function(**arguments)
                        elif function_name == 'scrape_website':
                            result = self.scrape_website_function(**arguments)
                        elif function_name == 'extract_emails':
                            result = self.extract_emails_function(**arguments)
                        else:
                            result = {'success': False, 'error': f'Unknown function: {function_name}'}
                        
                        tool_results.append({
                            'tool_call_id': tool_call.get('id', f'call_{i}'),
                            'function_name': function_name,
                            'result': result
                        })
                        
                        # 工具调用间隔
                        time.sleep(2)
                    
                    # 将工具结果发送回LLM进行最终分析
                    if tool_results:
                        print(f"   🧠 发送工具结果给LLM进行最终分析...")
                        
                        # 构建消息历史
                        messages = [
                            {'role': 'user', 'content': prompt},
                            message,  # LLM的工具调用消息
                        ]
                        
                        # 添加工具结果
                        for tool_result in tool_results:
                            messages.append({
                                'role': 'tool',
                                'content': json.dumps(tool_result['result'], ensure_ascii=False),
                                'tool_call_id': tool_result['tool_call_id']
                            })
                        
                        # 再次调用LLM
                        final_response = requests.post(f"{self.ollama_url}/api/chat", json={
                            'model': model,
                            'messages': messages,
                            'stream': False,
                            'options': {
                                'temperature': 0.3,
                                'num_ctx': 4096
                            }
                        }, timeout=120)
                        
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
    
    def find_emails_with_intelligent_search(self, industry, max_emails=5):
        """使用智能搜索发现邮箱"""
        print(f"🤖 启动智能网络搜索邮箱发现: {industry}")
        print(f"🎯 目标: {max_emails}个邮箱")
        print("=" * 60)
        
        # 构建智能prompt
        prompt = f"""我需要你帮我找到{industry}行业的公司邮箱地址。请按以下步骤操作:

1. 首先使用web_search工具搜索"{industry} company contact email"来找到相关公司信息
2. 分析搜索结果，挑选2-3个最有前景的公司网站
3. 使用scrape_website工具访问这些公司网站获取详细内容
4. 使用extract_emails工具从网站内容中提取邮箱地址
5. 如果没有找到足够邮箱，尝试其他搜索策略：
   - "{industry} business contact information"
   - "{industry} company CEO email address"

请帮我找到至少{max_emails}个有效的{industry}行业公司邮箱，并提供每个邮箱的相关信息。

注意: 
- 只返回真实的商业邮箱，排除example.com等假邮箱
- 重点关注公司官网上的联系邮箱
- 尽量获取CEO、销售、商务等关键联系人邮箱"""

        print(f"🧠 发送智能搜索prompt给本地LLM...")
        
        result = self.call_ollama_with_tools(prompt)
        
        if result['success']:
            print(f"✅ LLM智能搜索完成")
            print(f"   🛠️  工具调用次数: {len(result['tool_calls'])}")
            print(f"   📊 工具结果数: {len(result['tool_results'])}")
            
            # 收集所有发现的邮箱
            all_emails = []
            for tool_result in result['tool_results']:
                if tool_result['function_name'] == 'extract_emails':
                    emails = tool_result['result'].get('emails', [])
                    all_emails.extend(emails)
            
            # 去重
            unique_emails = list(set(all_emails))
            
            print(f"\n📧 发现的邮箱:")
            for i, email in enumerate(unique_emails[:max_emails], 1):
                print(f"   {i}. {email}")
            
            print(f"\n🧠 LLM最终分析:")
            print(f"   {result['response']}")
            
            return {
                'success': True,
                'emails': unique_emails[:max_emails],
                'llm_response': result['response'],
                'tool_calls': result['tool_calls'],
                'tool_results': result['tool_results'],
                'total_emails': len(unique_emails)
            }
        else:
            print(f"❌ LLM智能搜索失败: {result['error']}")
            return {
                'success': False,
                'error': result['error'],
                'emails': [],
                'total_emails': 0
            }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供行业名称 (例如: "AI startups", "fruit companies")'}))
        return
    
    industry = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # 初始化系统
    search_llm = SimplifiedLocalWebSearchLLM()
    
    # 执行智能邮箱搜索
    results = search_llm.find_emails_with_intelligent_search(industry, max_emails)
    
    # 准备输出
    output = {
        'success': results['success'],
        'emails': results.get('emails', []),
        'total_emails': results.get('total_emails', 0),
        'industry': industry,
        'search_method': 'simplified_local_web_search_llm',
        'llm_response': results.get('llm_response', ''),
        'tool_calls': len(results.get('tool_calls', [])),
        'completely_local': True,
        'web_search_enabled': True,
        'no_external_apis': True,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 60)
    print("🔍 Simplified Local Web Search LLM 结果")
    print("=" * 60)
    
    if results['success']:
        print("📧 发现的邮箱:")
        for email in results['emails']:
            print(f"   📧 {email}")
        
        print(f"\n📊 统计:")
        print(f"   📧 邮箱总数: {results['total_emails']}")
        print(f"   🛠️  工具调用: {len(results.get('tool_calls', []))}")
        print(f"   🌐 搜索引擎: DuckDuckGo (直接)")
        print(f"   🧠 AI引擎: Ollama (本地)")
        print(f"   🚫 外部API: 0")
        print(f"   📦 外部依赖: 0 (无需SearxNG)")
    else:
        print(f"❌ 搜索失败: {results.get('error', 'Unknown error')}")
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()