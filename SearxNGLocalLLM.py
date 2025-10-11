#!/usr/bin/env python3
"""
SearxNG + Local Ollama Web Search LLM
基于SearxNG的本地LLM网络搜索系统
- 本地SearxNG搜索引擎 (聚合多个搜索引擎)
- 本地Ollama LLM (支持function calling)
- 智能邮箱发现 (直接让AI搜索网络)
- 完全本地，零外部API依赖
"""

import sys
import json
import time
import re
import requests
import os
from datetime import datetime
import subprocess
import docker
import threading

class SearxNGLocalLLM:
    def __init__(self):
        # 本地Ollama配置
        self.ollama_url = 'http://localhost:11434'
        
        # SearxNG配置
        self.searxng_url = 'http://localhost:8080'  # 默认SearxNG端口
        
        # 邮箱匹配模式
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🔍 SearxNG + Local Ollama 网络搜索LLM 初始化中...")
        print("   🧠 AI引擎: 本地Ollama")
        print("   🌐 搜索引擎: 本地SearxNG (聚合210+搜索引擎)")
        print("   🛠️  功能: Function Calling + Web Search")
        print("   🚫 外部API: 零依赖")
        
        # 检查并启动SearxNG
        self.ensure_searxng_running()
        
    def ensure_searxng_running(self):
        """确保SearxNG在运行"""
        try:
            # 检查SearxNG是否已运行
            response = requests.get(f"{self.searxng_url}/search?q=test&format=json", timeout=5)
            if response.status_code == 200:
                print("   ✅ SearxNG已在运行")
                return True
        except:
            pass
        
        print("   🚀 启动本地SearxNG...")
        return self.start_searxng_docker()
    
    def start_searxng_docker(self):
        """使用Docker启动SearxNG"""
        try:
            # 检查Docker是否可用
            client = docker.from_env()
            
            # 检查是否已有SearxNG容器
            try:
                container = client.containers.get('searxng')
                if container.status != 'running':
                    container.start()
                    print("   ✅ SearxNG容器已启动")
                else:
                    print("   ✅ SearxNG容器已在运行")
                return True
            except docker.errors.NotFound:
                pass
            
            # 创建并启动新的SearxNG容器
            print("   🐳 创建SearxNG Docker容器...")
            container = client.containers.run(
                'searxng/searxng:latest',
                name='searxng',
                ports={'8080/tcp': 8080},
                environment={
                    'SEARXNG_SECRET': 'your-secret-key-here',
                    'SEARXNG_BASE_URL': 'http://localhost:8080'
                },
                detach=True,
                remove=False
            )
            
            # 等待容器启动
            print("   ⏱️  等待SearxNG启动...")
            for i in range(30):
                try:
                    response = requests.get(f"{self.searxng_url}/search?q=test&format=json", timeout=2)
                    if response.status_code == 200:
                        print("   ✅ SearxNG成功启动!")
                        return True
                except:
                    time.sleep(2)
            
            print("   ❌ SearxNG启动超时")
            return False
            
        except Exception as e:
            print(f"   ❌ SearxNG启动失败: {str(e)}")
            print("   💡 请手动启动: docker run -d --name searxng -p 8080:8080 searxng/searxng:latest")
            return False
    
    def web_search_function(self, query, num_results=10):
        """Web搜索function - 供Ollama调用"""
        try:
            print(f"   🔍 SearxNG搜索: {query}")
            
            params = {
                'q': query,
                'format': 'json',
                'categories': 'general',
                'pageno': 1,
                'language': 'en'
            }
            
            response = requests.get(f"{self.searxng_url}/search", params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                # 格式化搜索结果
                formatted_results = []
                for i, result in enumerate(results[:num_results]):
                    formatted_result = {
                        'title': result.get('title', ''),
                        'url': result.get('url', ''),
                        'content': result.get('content', ''),
                        'engine': result.get('engine', ''),
                        'position': i + 1
                    }
                    formatted_results.append(formatted_result)
                
                print(f"      ✅ 找到{len(formatted_results)}个结果")
                return {
                    'success': True,
                    'results': formatted_results,
                    'query': query,
                    'total_results': len(formatted_results)
                }
            else:
                print(f"      ❌ 搜索失败: {response.status_code}")
                return {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except Exception as e:
            print(f"      ❌ 搜索错误: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def extract_emails_function(self, text):
        """邮箱提取function - 供Ollama调用"""
        try:
            emails = self.email_pattern.findall(text)
            
            # 过滤有效邮箱
            valid_emails = []
            for email in emails:
                if self.is_valid_business_email(email):
                    valid_emails.append(email)
            
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
            'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@'
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
                        "description": "Search the web for current information using SearxNG",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The search query"
                                },
                                "num_results": {
                                    "type": "integer",
                                    "description": "Number of results to return (default 10)",
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
            }, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', {})
                
                # 检查是否有工具调用
                tool_calls = message.get('tool_calls', [])
                
                if tool_calls:
                    print(f"   🛠️  LLM请求调用{len(tool_calls)}个工具")
                    
                    # 执行工具调用
                    tool_results = []
                    for tool_call in tool_calls:
                        function_name = tool_call['function']['name']
                        arguments = tool_call['function']['arguments']
                        
                        print(f"      🔧 调用工具: {function_name}")
                        
                        if function_name == 'web_search':
                            result = self.web_search_function(**arguments)
                            tool_results.append({
                                'tool_call_id': tool_call.get('id', ''),
                                'function_name': function_name,
                                'result': result
                            })
                        elif function_name == 'extract_emails':
                            result = self.extract_emails_function(**arguments)
                            tool_results.append({
                                'tool_call_id': tool_call.get('id', ''),
                                'function_name': function_name,
                                'result': result
                            })
                    
                    # 将工具结果发送回LLM
                    if tool_results:
                        print(f"   🧠 将工具结果发送回LLM进行分析...")
                        
                        # 构建工具结果消息
                        messages = [
                            {'role': 'user', 'content': prompt},
                            message,  # LLM的工具调用消息
                        ]
                        
                        # 添加工具结果
                        for tool_result in tool_results:
                            messages.append({
                                'role': 'tool',
                                'content': json.dumps(tool_result['result']),
                                'tool_call_id': tool_result['tool_call_id']
                            })
                        
                        # 再次调用LLM处理工具结果
                        final_response = requests.post(f"{self.ollama_url}/api/chat", json={
                            'model': model,
                            'messages': messages,
                            'stream': False,
                            'options': {
                                'temperature': 0.7,
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
    
    def find_emails_with_web_search_llm(self, industry, max_emails=5):
        """使用具备网络搜索功能的本地LLM发现邮箱"""
        print(f"🤖 启动网络搜索LLM邮箱发现: {industry}")
        print(f"🎯 目标: {max_emails}个邮箱")
        print("=" * 60)
        
        # 构建智能prompt
        prompt = f"""我需要你帮我找到{industry}行业的公司邮箱地址。请按以下步骤操作:

1. 使用web_search工具搜索"{industry} company email contact"来找到相关公司
2. 分析搜索结果，寻找包含邮箱地址的内容
3. 使用extract_emails工具从搜索结果中提取邮箱地址
4. 如果第一次搜索没找到足够邮箱，尝试不同的搜索查询如:
   - "{industry} business contact information"
   - "{industry} company CEO founder email"
   - "{industry} customer service contact email"

请帮我找到至少{max_emails}个有效的{industry}行业公司邮箱，并提供每个邮箱的相关信息(公司名、来源等)。

注意: 请确保找到的是真实的商业邮箱，不要包含example.com等假邮箱。"""

        print(f"🧠 发送智能prompt给本地LLM...")
        
        result = self.call_ollama_with_tools(prompt)
        
        if result['success']:
            print(f"✅ LLM响应成功")
            print(f"   🛠️  工具调用: {len(result['tool_calls'])}次")
            print(f"   📊 工具结果: {len(result['tool_results'])}个")
            
            # 分析工具结果中的邮箱
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
            
            return {
                'success': True,
                'emails': unique_emails[:max_emails],
                'llm_response': result['response'],
                'tool_calls': result['tool_calls'],
                'tool_results': result['tool_results'],
                'total_emails': len(unique_emails)
            }
        else:
            print(f"❌ LLM调用失败: {result['error']}")
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
    llm_system = SearxNGLocalLLM()
    
    # 执行邮箱发现
    results = llm_system.find_emails_with_web_search_llm(industry, max_emails)
    
    # 准备输出
    output = {
        'success': results['success'],
        'emails': results.get('emails', []),
        'total_emails': results.get('total_emails', 0),
        'industry': industry,
        'search_method': 'searxng_local_llm_tools',
        'llm_response': results.get('llm_response', ''),
        'tool_calls': len(results.get('tool_calls', [])),
        'completely_local': True,
        'web_search_enabled': True,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 60)
    print("🔍 SearxNG + Local LLM 网络搜索结果")
    print("=" * 60)
    
    if results['success']:
        print("📧 发现的邮箱:")
        for email in results['emails']:
            print(f"   📧 {email}")
        
        print(f"\n🧠 LLM响应:")
        print(f"   {results.get('llm_response', 'No response')}")
        
        print(f"\n📊 统计:")
        print(f"   📧 邮箱总数: {results['total_emails']}")
        print(f"   🛠️  工具调用: {len(results.get('tool_calls', []))}")
        print(f"   🌐 搜索引擎: SearxNG (本地)")
        print(f"   🧠 AI引擎: Ollama (本地)")
        print(f"   🚫 外部API: 0")
    else:
        print(f"❌ 搜索失败: {results.get('error', 'Unknown error')}")
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()