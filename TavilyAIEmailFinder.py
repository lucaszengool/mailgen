#!/usr/bin/env python3
"""
Tavily AI Email Finder
使用Tavily Search API的智能邮箱发现系统
- 专为LLM优化的搜索引擎
- 直接用prompt让AI去寻找邮箱
- 比复杂的Google模拟更简单有效
- 实时网络搜索能力
"""

import sys
import json
import time
import re
import requests
import os
from datetime import datetime
from urllib.parse import urlparse
import asyncio
import concurrent.futures

class TavilyAIEmailFinder:
    def __init__(self):
        # Tavily API 配置
        self.tavily_api_key = os.getenv('TAVILY_API_KEY', 'tvly-YOUR_API_KEY')
        self.tavily_api_url = 'https://api.tavily.com/search'
        
        # Ollama配置
        self.ollama_url = 'http://localhost:11434'
        
        # 邮箱匹配模式
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        print("🤖 Tavily AI Email Finder 已初始化")
        print("   🔍 搜索引擎: Tavily Search API (专为LLM优化)")
        print("   🧠 AI引擎: Ollama (智能prompt生成)")
        print("   📧 邮箱发现: 基于AI的实时网络搜索")
        print("   ⚡ 优势: 比复杂Google模拟更简单高效")
        
    def generate_smart_email_search_prompts(self, industry, company_type="companies"):
        """使用Ollama生成智能的邮箱搜索prompts"""
        try:
            prompt = f"""为{industry}行业的{company_type}生成3个高效的邮箱搜索查询。

要求:
1. 每个查询都应该能找到真实的商业邮箱地址
2. 包含行业特定的关键词
3. 针对不同类型的联系人(CEO, 联系人, 销售等)
4. 查询应该像专业的搜索专家会使用的那样

行业: {industry}
目标: {company_type}

请返回3个搜索查询，每行一个，格式如下:
1. [查询1]
2. [查询2] 
3. [查询3]

只返回查询本身，不要解释:"""

            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': 'qwen2.5:0.5b',
                'prompt': prompt,
                'stream': False,
                'options': {'temperature': 0.7, 'num_ctx': 1024}
            }, timeout=10)
            
            if response.status_code == 200:
                result = response.json()['response'].strip()
                
                # 提取查询
                queries = []
                for line in result.split('\n'):
                    line = line.strip()
                    if line and (line.startswith('1.') or line.startswith('2.') or line.startswith('3.')):
                        query = line.split('.', 1)[1].strip()
                        if query:
                            queries.append(query)
                
                if queries:
                    print(f"🧠 Ollama生成了{len(queries)}个智能搜索查询:")
                    for i, query in enumerate(queries, 1):
                        print(f"   {i}. {query}")
                    return queries
                else:
                    # 备用查询
                    fallback_queries = [
                        f"{industry} company email contact information",
                        f"{industry} business CEO founder email address", 
                        f"{industry} company contact us email directory"
                    ]
                    print(f"⚠️  使用备用查询")
                    return fallback_queries
            else:
                raise Exception(f"Ollama API error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Ollama查询生成失败: {str(e)}")
            # 备用查询
            fallback_queries = [
                f"{industry} company email contact information",
                f"{industry} business CEO founder email address", 
                f"{industry} company contact us email directory"
            ]
            print(f"⚠️  使用备用查询")
            return fallback_queries
    
    def search_with_tavily_ai(self, query, max_results=10):
        """使用Tavily Search API进行AI优化的搜索"""
        try:
            print(f"🔍 Tavily AI搜索: {query}")
            
            # Tavily API请求
            payload = {
                "api_key": self.tavily_api_key,
                "query": query,
                "search_depth": "advanced",  # 深度搜索
                "include_answer": True,      # 包含AI生成的答案
                "include_raw_content": True, # 包含原始内容
                "max_results": max_results,
                "include_images": False,
                "include_domains": [],
                "exclude_domains": []
            }
            
            response = requests.post(self.tavily_api_url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                results = data.get('results', [])
                answer = data.get('answer', '')
                
                print(f"   ✅ Tavily返回了{len(results)}个结果")
                if answer:
                    print(f"   🧠 AI答案: {answer[:100]}...")
                
                return {
                    'results': results,
                    'answer': answer,
                    'query': query
                }
            else:
                print(f"   ❌ Tavily API错误: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"   ❌ Tavily搜索失败: {str(e)}")
            return None
    
    def extract_emails_from_tavily_results(self, tavily_data, query_context):
        """从Tavily搜索结果中提取邮箱"""
        if not tavily_data:
            return []
        
        found_emails = []
        results = tavily_data.get('results', [])
        answer = tavily_data.get('answer', '')
        
        print(f"   📧 分析{len(results)}个Tavily结果中的邮箱...")
        
        # 1. 从AI生成的答案中提取邮箱
        if answer:
            answer_emails = self.email_pattern.findall(answer)
            for email in answer_emails:
                if self.is_valid_business_email(email):
                    email_data = {
                        'email': email,
                        'source': 'tavily_ai_answer',
                        'company_name': 'From AI Answer',
                        'url': 'AI Generated',
                        'content_snippet': answer[:200],
                        'confidence': 0.95,
                        'search_query': tavily_data.get('query', ''),
                        'found_at': datetime.now().isoformat()
                    }
                    found_emails.append(email_data)
                    print(f"      ✅ AI答案中找到: {email}")
        
        # 2. 从搜索结果中提取邮箱
        for i, result in enumerate(results):
            try:
                title = result.get('title', '')
                content = result.get('content', '') 
                url = result.get('url', '')
                
                # 合并标题和内容进行搜索
                full_text = f"{title} {content}"
                emails = self.email_pattern.findall(full_text)
                
                for email in emails:
                    if self.is_valid_business_email(email):
                        # 尝试从URL或标题推断公司名
                        company_name = self.extract_company_name(url, title)
                        
                        email_data = {
                            'email': email,
                            'source': 'tavily_search_result',
                            'company_name': company_name,
                            'url': url,
                            'content_snippet': content[:200],
                            'confidence': 0.85,
                            'search_query': tavily_data.get('query', ''),
                            'result_position': i + 1,
                            'found_at': datetime.now().isoformat()
                        }
                        found_emails.append(email_data)
                        print(f"      ✅ 搜索结果中找到: {email} (来自 {company_name})")
                        
            except Exception as e:
                print(f"      ⚠️  处理结果{i+1}时出错: {str(e)}")
                continue
        
        return found_emails
    
    def is_valid_business_email(self, email):
        """验证是否为有效的商业邮箱"""
        email_lower = email.lower()
        
        # 排除明显的假邮箱
        invalid_patterns = [
            'example.com', 'test.com', 'domain.com', 'yoursite.com',
            'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
            'support@example', 'admin@example', 'info@example',
            'contact@example', 'sales@example', 'user@domain',
            'name@company', 'email@website', 'your@email'
        ]
        
        if any(pattern in email_lower for pattern in invalid_patterns):
            return False
        
        # 基本邮箱格式验证
        if 5 < len(email) < 100 and email.count('@') == 1:
            domain = email.split('@')[1]
            if '.' in domain and len(domain) > 4:
                return True
        
        return False
    
    def extract_company_name(self, url, title):
        """从URL或标题中提取公司名"""
        try:
            # 从URL中提取域名作为公司名
            if url:
                parsed = urlparse(url)
                domain = parsed.netloc
                if domain:
                    # 移除常见前缀
                    domain = domain.replace('www.', '').replace('blog.', '')
                    # 获取主域名
                    company = domain.split('.')[0]
                    return company.title()
            
            # 从标题中提取（简单方法）
            if title:
                # 移除常见词汇后取前几个词
                cleaned_title = title.replace(' - ', ' ').replace(' | ', ' ')
                words = cleaned_title.split()[:3]
                return ' '.join(words)
            
            return 'Unknown Company'
            
        except:
            return 'Unknown Company'
    
    def generate_user_profile_with_ollama(self, email_data):
        """使用Ollama为发现的邮箱生成用户profile"""
        try:
            print(f"   🧠 为{email_data['email']}生成用户profile...")
            
            prompt = f"""基于以下邮箱信息生成一个专业的用户profile:

邮箱: {email_data['email']}
公司: {email_data['company_name']}
网站: {email_data['url']}
内容摘要: {email_data['content_snippet']}
搜索查询: {email_data['search_query']}

生成一个真实的profile，包括:
- 全名 (根据邮箱前缀推测)
- 职位/角色
- 公司描述
- 行业
- 专业背景

返回JSON格式:
{{
  "name": "全名",
  "email": "{email_data['email']}",
  "title": "职位", 
  "company": "{email_data['company_name']}",
  "industry": "行业名称",
  "background": "简要专业背景"
}}

只返回JSON，不要其他解释:"""

            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': 'llama3.2',
                'prompt': prompt,
                'stream': False,
                'options': {'temperature': 0.3, 'num_ctx': 1024}
            }, timeout=15)
            
            if response.status_code == 200:
                profile_text = response.json()['response'].strip()
                
                try:
                    # 提取JSON
                    json_start = profile_text.find('{')
                    json_end = profile_text.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        profile_json = json.loads(profile_text[json_start:json_end])
                        print(f"      ✅ 生成profile: {profile_json.get('name', 'Unknown')}")
                        return profile_json
                    else:
                        raise ValueError("No JSON found")
                        
                except (json.JSONDecodeError, ValueError):
                    # 备用profile
                    email_prefix = email_data['email'].split('@')[0]
                    fallback_profile = {
                        "name": email_prefix.replace('.', ' ').replace('_', ' ').title(),
                        "email": email_data['email'],
                        "title": "Professional",
                        "company": email_data['company_name'],
                        "industry": "Business",
                        "background": f"Professional at {email_data['company_name']}"
                    }
                    print(f"      ⚠️  使用备用profile")
                    return fallback_profile
            else:
                return None
                
        except Exception as e:
            print(f"      ❌ Profile生成错误: {str(e)}")
            return None
    
    def find_emails_with_ai_search(self, industry, max_emails=5):
        """使用AI搜索发现邮箱的主要方法"""
        print(f"🤖 启动AI邮箱发现: {industry}行业")
        print(f"🎯 目标: {max_emails}个邮箱")
        print("=" * 60)
        
        all_emails = []
        all_profiles = []
        
        # 1. 生成智能搜索查询
        search_queries = self.generate_smart_email_search_prompts(industry)
        
        # 2. 使用每个查询进行Tavily搜索
        for i, query in enumerate(search_queries, 1):
            print(f"\n📍 搜索策略 {i}/{len(search_queries)}")
            
            try:
                # Tavily AI搜索
                tavily_data = self.search_with_tavily_ai(query, max_results=10)
                
                if tavily_data:
                    # 提取邮箱
                    emails = self.extract_emails_from_tavily_results(tavily_data, query)
                    
                    if emails:
                        all_emails.extend(emails)
                        print(f"   ✅ 发现{len(emails)}个邮箱")
                        
                        # 为每个邮箱生成profile
                        for email_data in emails:
                            profile = self.generate_user_profile_with_ollama(email_data)
                            if profile:
                                complete_profile = {**email_data, **profile}
                                all_profiles.append(complete_profile)
                        
                        # 如果已找到足够邮箱就停止
                        if len(all_emails) >= max_emails:
                            print(f"   🎯 已达到目标邮箱数量")
                            break
                    else:
                        print(f"   ⚠️  此查询未发现邮箱")
                else:
                    print(f"   ❌ Tavily搜索失败")
                
                # 查询间隔
                time.sleep(2)
                
            except Exception as e:
                print(f"   ❌ 搜索策略{i}失败: {str(e)}")
                continue
        
        # 去重
        unique_emails = []
        seen_emails = set()
        for email_data in all_emails:
            if email_data['email'] not in seen_emails:
                unique_emails.append(email_data)
                seen_emails.add(email_data['email'])
        
        unique_profiles = []
        seen_profile_emails = set()
        for profile in all_profiles:
            if profile['email'] not in seen_profile_emails:
                unique_profiles.append(profile)
                seen_profile_emails.add(profile['email'])
        
        print(f"\n🎉 AI邮箱发现完成!")
        print(f"   📧 发现的唯一邮箱: {len(unique_emails)}")
        print(f"   👤 生成的用户profiles: {len(unique_profiles)}")
        print(f"   🔍 使用的搜索查询: {len(search_queries)}")
        
        return {
            'emails': unique_emails,
            'profiles': unique_profiles,
            'search_queries': search_queries,
            'total_emails': len(unique_emails),
            'total_profiles': len(unique_profiles)
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供行业名称 (例如: "AI startups", "fruit companies")'}))
        return
    
    industry = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    finder = TavilyAIEmailFinder()
    
    # 执行AI邮箱发现
    results = finder.find_emails_with_ai_search(industry, max_emails)
    
    # 准备最终输出
    output = {
        'emails': results['emails'],
        'profiles': results['profiles'],
        'search_queries': results['search_queries'],
        'total_emails': results['total_emails'],
        'total_profiles': results['total_profiles'],
        'industry': industry,
        'search_method': 'tavily_ai_search',
        'ai_powered': True,
        'timestamp': datetime.now().isoformat()
    }
    
    print("\n" + "=" * 60)
    print("🤖 TAVILY AI 邮箱发现结果")
    print("=" * 60)
    
    if results['emails']:
        print("📧 发现的邮箱:")
        for email_data in results['emails'][:5]:
            print(f"   📧 {email_data['email']} ({email_data['company_name']})")
        if len(results['emails']) > 5:
            print(f"   ... 还有{len(results['emails']) - 5}个邮箱")
    
    if results['profiles']:
        print(f"\n👤 生成的用户PROFILES: {len(results['profiles'])}")
        for profile in results['profiles'][:3]:
            print(f"   👤 {profile.get('name', 'Unknown')} - {profile.get('title', 'Unknown')} @ {profile.get('company', 'Unknown')}")
        if len(results['profiles']) > 3:
            print(f"   ... 还有{len(results['profiles']) - 3}个profiles")
    
    print(f"\n🎯 使用的搜索查询:")
    for i, query in enumerate(results['search_queries'], 1):
        print(f"   {i}. {query}")
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()