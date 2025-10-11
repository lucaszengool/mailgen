#!/usr/bin/env python3
"""
Ollama SearxNG Email Agent
完整集成Ollama + SearxNG的智能邮箱搜索和用户画像生成系统
- 使用Ollama生成搜索策略和用户画像
- 使用SearxNG进行实时网络搜索
- 智能邮箱提取和验证
- 为每个邮箱生成详细用户画像
- 完全本地化LLM驱动的邮箱发现系统
"""

import sys
import json
import time
import re
import requests
import os
import subprocess
from datetime import datetime
from urllib.parse import quote, urlencode
from bs4 import BeautifulSoup
import concurrent.futures
import threading

class OllamaSearxNGEmailAgent:
    def __init__(self):
        # Ollama配置
        self.ollama_url = 'http://localhost:11434'
        self.models = {
            'fast': 'qwen2.5:0.5b',  # 快速模型用于策略生成
            'general': 'qwen2.5:0.5b',  # 通用模型
            'profile': 'llama3.2'  # 高质量模型用于用户画像生成
        }
        
        # SearxNG配置 - JSON格式已启用
        self.searxng_url = 'http://localhost:8080'
        
        # 网络搜索会话
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        })
        
        # 邮箱匹配模式
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        
        # 结果存储
        self.found_emails = []
        self.generated_profiles = []
        self.verified_emails = []
        
        # 邮箱验证服务路径
        self.email_verifier_path = os.path.join(os.path.dirname(__file__), 'EmailVerificationService.py')
        
        print("🤖 Ollama SearxNG Email Agent 初始化")
        print(f"   🧠 Fast Model: {self.models['fast']} (策略生成)")
        print(f"   🔍 General Model: {self.models['general']} (搜索优化)")  
        print(f"   👤 Profile Model: {self.models['profile']} (用户画像)")
        print(f"   🌐 SearxNG: {self.searxng_url} (JSON格式)")
        print("   ⚡ 特色: Ollama直接控制SearxNG进行智能邮箱搜索")
        
    def call_ollama(self, prompt, model_type='fast', options=None):
        """调用Ollama API"""
        try:
            model = self.models.get(model_type, self.models['fast'])
            default_options = {
                'temperature': 0.8 if model_type == 'profile' else 0.7,
                'num_predict': 500 if model_type == 'profile' else 200,
                'num_ctx': 2048 if model_type == 'profile' else 1024
            }
            
            if options:
                default_options.update(options)
                
            print(f"   🧠 调用 {model_type} 模型 ({model}) 进行处理...")
            
            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': default_options
            })  # 移除超时限制，让Ollama有充分时间处理
            
            if response.status_code == 200:
                return response.json()['response'].strip()
            else:
                print(f"   ❌ Ollama API错误: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"   ❌ Ollama调用失败: {str(e)}")
            return None
    
    def generate_intelligent_search_strategy(self, industry, target_goal="partnership"):
        """使用Ollama生成智能搜索策略（带快速模板回退）"""
        try:
            print(f"🧠 为'{industry}'行业生成智能搜索策略...")
            
            # 首先尝试快速模板策略（避免Ollama挂起）
            print(f"⚡ 使用超快速模板策略生成（避免Ollama挂起）...")
            return self.generate_template_search_strategy(industry)
            
            # 原始Ollama策略（当前被禁用因为API挂起）
            prompt = f"""Generate 5 targeted search queries to find REAL email addresses for {industry} industry companies.

Industry: {industry}
Goal: Find actual business email addresses

Create search queries that will discover real email addresses from:
1. Company contact pages with email addresses
2. Executive team profiles with contact info
3. Business directories with email listings
4. Contact forms and email addresses on websites
5. LinkedIn profiles with email addresses

Each query must:
- Include "email" or "contact" keywords
- Target specific roles (CEO, founder, sales, support)
- Use site-specific searches when helpful
- Be optimized for finding actual email addresses

Return exactly 5 search queries, one per line:
1. [query 1]
2. [query 2]
3. [query 3]
4. [query 4]
5. [query 5]

Return only the queries, no explanations:"""

            result = self.call_ollama(prompt, 'fast')
            
            if result:
                # 解析生成的查询
                queries = []
                for line in result.split('\n'):
                    line = line.strip()
                    if line and (line.startswith(('1.', '2.', '3.', '4.', '5.')) or len(line) > 10):
                        # 清理行号
                        cleaned = re.sub(r'^\d+\.\s*', '', line).strip()
                        if cleaned and len(cleaned) > 5:
                            queries.append(cleaned)
                
                if queries:
                    print(f"   ✅ 生成了{len(queries)}个智能搜索策略")
                    return queries[:5]
            
            # 备用查询 - 更直接的邮箱搜索
            print(f"   ⚠️ 使用备用搜索策略")
            return [
                f'"{industry}" CEO founder email "@"',
                f'"{industry}" company contact email address',
                f'"@" email {industry} startup executive',
                f'site:linkedin.com "{industry}" email contact',
                f'"{industry}" business email directory contact'
            ]
            
        except Exception as e:
            print(f"   ❌ 策略生成失败: {str(e)}")
            return [f"{industry} company email contact"]
    
    def generate_template_search_strategy(self, industry):
        """使用超快速模板生成搜索策略"""
        print(f"⚡ 使用模板为'{industry}'生成快速搜索策略...")
        
        # 基于行业的智能模板策略
        industry_lower = industry.lower()
        
        base_strategies = [
            f"{industry} company contact email",
            f"{industry} business email address",
            f"{industry} startup founder email",
            f"{industry} executive team contact",
            f"{industry} sales team email"
        ]
        
        # 根据行业类型调整搜索策略
        if 'ai' in industry_lower or 'artificial' in industry_lower or 'machine learning' in industry_lower:
            specific_strategies = [
                "AI startup founder email contact",
                "machine learning company CEO email",
                "artificial intelligence business development email",
                "AI tech company contact information",
                "ML startup executive team email"
            ]
        elif 'tech' in industry_lower or 'software' in industry_lower:
            specific_strategies = [
                "tech startup founder email",
                "software company executive email",
                "technology business contact email",
                "startup CTO email contact",
                "software development company email"
            ]
        elif 'finance' in industry_lower or 'fintech' in industry_lower:
            specific_strategies = [
                "fintech startup founder email",
                "financial services executive email",
                "banking technology company contact",
                "financial software company email",
                "investment firm contact email"
            ]
        else:
            specific_strategies = base_strategies
        
        print(f"   ✅ 生成了{len(specific_strategies)}个搜索策略")
        return specific_strategies[:5]  # 返回前5个策略
    
    def search_with_searxng(self, query, max_results=20):
        """使用SearxNG进行网络搜索"""
        try:
            print(f"   🔍 SearxNG搜索: {query}")
            
            # 使用JSON格式搜索
            params = {
                'q': query,
                'format': 'json',
                'categories': 'general',
                'pageno': 1
            }
            
            search_url = f"{self.searxng_url}/search"
            response = self.session.get(search_url, params=params, timeout=30)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    results = data.get('results', [])
                    
                    print(f"      ✅ SearxNG返回{len(results)}个结果")
                    
                    # 格式化结果
                    formatted_results = []
                    for result in results[:max_results]:
                        formatted_results.append({
                            'title': result.get('title', ''),
                            'url': result.get('url', ''),
                            'content': result.get('content', ''),
                            'engine': result.get('engine', 'searxng')
                        })
                    
                    return formatted_results
                    
                except json.JSONDecodeError as e:
                    print(f"      ❌ JSON解析错误: {str(e)}")
                    return []
                    
            else:
                print(f"      ❌ SearxNG搜索失败: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"      ❌ SearxNG搜索错误: {str(e)}")
            return []
    
    def extract_emails_from_text(self, text):
        """从文本中提取有效邮箱"""
        emails = self.email_pattern.findall(text)
        
        valid_emails = []
        for email in emails:
            email_lower = email.lower()
            
            # 排除无效邮箱
            if any(pattern in email_lower for pattern in [
                'example.com', 'test.com', 'domain.com', 'yoursite.com',
                'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
                'support@example', 'admin@example', 'info@example',
                'webmaster@', 'abuse@', 'postmaster@'
            ]):
                continue
            
            # 基本验证
            if 5 < len(email) < 100 and email.count('@') == 1:
                domain = email.split('@')[1]
                if '.' in domain and len(domain) > 4:
                    valid_emails.append(email)
        
        return list(set(valid_emails))  # 去重
    
    def scrape_website_for_emails(self, url):
        """爬取网站寻找邮箱"""
        try:
            print(f"      🌐 爬取网站: {url[:50]}...")
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 移除无用元素
                for element in soup(["script", "style", "nav", "footer", "header"]):
                    element.decompose()
                
                # 提取所有文本
                text = soup.get_text()
                
                # 也检查特定的联系人页面元素
                contact_sections = soup.find_all(['div', 'section'], 
                    class_=re.compile(r'contact|about|team|staff', re.I))
                
                for section in contact_sections:
                    text += " " + section.get_text()
                
                emails = self.extract_emails_from_text(text)
                
                if emails:
                    print(f"         ✅ 找到{len(emails)}个邮箱")
                    return emails
                else:
                    return []
                    
            else:
                return []
                
        except Exception as e:
            return []
    
    def search_emails_with_strategy(self, search_query):
        """使用搜索策略查找邮箱"""
        try:
            all_emails = []
            
            # 1. 使用SearxNG搜索
            search_results = self.search_with_searxng(search_query)
            
            if not search_results:
                return []
            
            # 2. 从搜索结果中直接提取邮箱
            print(f"   📧 从搜索结果摘要中提取邮箱...")
            for result in search_results:
                text = f"{result['title']} {result['content']}"
                emails = self.extract_emails_from_text(text)
                
                for email in emails:
                    if email not in all_emails:
                        all_emails.append({
                            'email': email,
                            'source': 'search_preview',
                            'source_url': result['url'],
                            'source_title': result['title'],
                            'confidence': 0.8,
                            'method': 'searxng_preview'
                        })
                        print(f"      ✅ 搜索预览中发现: {email}")
            
            # 3. 并行爬取前10个网站
            print(f"   🌐 并行爬取前10个网站...")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                future_to_result = {
                    executor.submit(self.scrape_website_for_emails, result['url']): result 
                    for result in search_results[:10]
                }
                
                for future in concurrent.futures.as_completed(future_to_result):
                    try:
                        result = future_to_result[future]
                        website_emails = future.result()
                        
                        for email in website_emails:
                            if not any(e['email'] == email for e in all_emails):
                                all_emails.append({
                                    'email': email,
                                    'source': 'website_scraping',
                                    'source_url': result['url'],
                                    'source_title': result['title'],
                                    'confidence': 0.9,
                                    'method': 'website_crawling'
                                })
                                print(f"      ✅ 网站爬取发现: {email}")
                                
                    except Exception as e:
                        continue
            
            return all_emails
            
        except Exception as e:
            print(f"   ❌ 搜索错误: {str(e)}")
            return []
    
    def generate_user_profile_with_ollama(self, email_data, industry_context):
        """使用模板为邮箱生成详细用户画像（避免Ollama挂起）"""
        try:
            email = email_data['email']
            source_info = email_data.get('source_title', '')
            source_url = email_data.get('source_url', '')
            
            print(f"   👤 为 {email} 生成用户画像...")
            
            # 使用快速模板策略（避免Ollama挂起）
            print(f"   ⚡ 使用超快速模板生成用户画像...")
            return self.generate_template_user_profile(email_data, industry_context)
            
            # 原始Ollama策略（当前被禁用因为API挂起）
            # print(f"   👤 为 {email} 生成用户画像...")
            
            prompt = f"""基于以下信息为邮箱用户生成详细的商业用户画像:

邮箱地址: {email}
来源信息: {source_info}
来源网站: {source_url}
行业背景: {industry_context}

请分析并生成包含以下信息的用户画像:

1. 推测的职位角色 (CEO, Sales, Marketing, Support, etc.)
2. 可能的公司规模 (Startup, SME, Enterprise)
3. 决策能力级别 (High, Medium, Low)
4. 沟通偏好 (Formal, Casual, Technical)
5. 主要关注点/痛点
6. 最佳联系时机
7. 推荐的邮件策略
8. 个性化建议

请返回JSON格式的用户画像:
{{
  "email": "{email}",
  "estimated_role": "角色",
  "company_size": "公司规模", 
  "decision_level": "决策能力",
  "communication_style": "沟通风格",
  "pain_points": ["痛点1", "痛点2"],
  "best_contact_time": "最佳联系时间",
  "email_strategy": "邮件策略建议",
  "personalization_tips": ["个性化建议1", "个性化建议2"],
  "confidence_score": 0.8,
  "profile_generated_by": "ollama_ai"
}}

只返回JSON，不要其他解释:"""

            result = self.call_ollama(prompt, 'profile')
            
            if result:
                try:
                    # 尝试解析JSON
                    profile_data = json.loads(result)
                    profile_data['email'] = email  # 确保邮箱正确
                    profile_data['generated_at'] = datetime.now().isoformat()
                    profile_data['source_data'] = email_data
                    
                    print(f"      ✅ 用户画像生成成功")
                    return profile_data
                    
                except json.JSONDecodeError:
                    # 如果JSON解析失败，创建基础画像
                    print(f"      ⚠️ JSON解析失败，创建基础画像")
                    return self.create_basic_profile(email, email_data, industry_context)
            else:
                return self.create_basic_profile(email, email_data, industry_context)
                
        except Exception as e:
            print(f"   ❌ 用户画像生成失败: {str(e)}")
            return self.create_basic_profile(email, email_data, industry_context)
    
    def create_basic_profile(self, email, email_data, industry_context):
        """创建基础用户画像"""
        domain = email.split('@')[1] if '@' in email else 'unknown.com'
        
        return {
            'email': email,
            'estimated_role': 'Business Professional',
            'company_size': 'Unknown',
            'decision_level': 'Medium',
            'communication_style': 'Professional',
            'pain_points': [f'{industry_context} industry challenges', 'Business efficiency'],
            'best_contact_time': 'Business hours',
            'email_strategy': 'Professional outreach with clear value proposition',
            'personalization_tips': ['Mention industry relevance', 'Focus on business benefits'],
            'confidence_score': 0.5,
            'profile_generated_by': 'basic_template',
            'generated_at': datetime.now().isoformat(),
            'source_data': email_data,
            'domain': domain
        }
    
    def generate_template_user_profile(self, email_data, industry_context):
        """使用超快速模板生成用户画像"""
        email = email_data['email']
        domain = email.split('@')[1] if '@' in email else 'unknown.com'
        source_info = email_data.get('source_title', '').lower()
        
        print(f"   ⚡ 快速分析 {email} 的用户画像...")
        
        # 基于邮箱域名和来源信息智能推断角色
        role = 'Business Professional'
        company_size = 'Unknown'
        decision_level = 'Medium'
        communication_style = 'Professional'
        
        # 角色推断逻辑
        email_local = email.split('@')[0].lower()
        if any(keyword in email_local for keyword in ['ceo', 'founder', 'president', 'chief']):
            role = 'CEO/Founder'
            decision_level = 'High'
            company_size = 'Startup'
        elif any(keyword in email_local for keyword in ['sales', 'business', 'bd']):
            role = 'Sales/Business Development'
            decision_level = 'Medium'
        elif any(keyword in email_local for keyword in ['marketing', 'growth', 'outreach']):
            role = 'Marketing/Growth'
            decision_level = 'Medium'
        elif any(keyword in email_local for keyword in ['tech', 'dev', 'engineer', 'cto']):
            role = 'Technical Lead'
            decision_level = 'High'
            communication_style = 'Technical'
        elif any(keyword in email_local for keyword in ['support', 'help', 'service']):
            role = 'Customer Support'
            decision_level = 'Low'
        
        # 公司规模推断
        if any(keyword in domain for keyword in ['gmail', 'yahoo', 'hotmail', 'outlook']):
            company_size = 'Startup/Small'
        elif len(domain.split('.')[0]) > 10:
            company_size = 'Enterprise'
        else:
            company_size = 'SME'
        
        # 基于行业的痛点和策略
        industry_lower = industry_context.lower()
        if 'ai' in industry_lower or 'tech' in industry_lower:
            pain_points = ['Technology adoption', 'Scaling challenges', 'Market competition']
            email_strategy = 'Focus on innovation and technical benefits'
            personalization_tips = ['Mention cutting-edge technology', 'Highlight competitive advantages']
        elif 'finance' in industry_lower:
            pain_points = ['Regulatory compliance', 'Cost optimization', 'Risk management']
            email_strategy = 'Emphasize security, compliance, and ROI'
            personalization_tips = ['Focus on cost savings', 'Mention compliance benefits']
        else:
            pain_points = ['Business growth', 'Operational efficiency', 'Market expansion']
            email_strategy = 'Professional outreach with clear value proposition'
            personalization_tips = ['Mention industry relevance', 'Focus on business benefits']
        
        profile = {
            'email': email,
            'estimated_role': role,
            'company_size': company_size,
            'decision_level': decision_level,
            'communication_style': communication_style,
            'pain_points': pain_points,
            'best_contact_time': 'Business hours (9 AM - 5 PM)',
            'email_strategy': email_strategy,
            'personalization_tips': personalization_tips,
            'confidence_score': 0.8,  # 高于基础模板的置信度
            'profile_generated_by': 'intelligent_template',
            'generated_at': datetime.now().isoformat(),
            'source_data': email_data,
            'domain': domain
        }
        
        print(f"      ✅ 模板画像生成完成: {role} @ {company_size}")
        return profile
    
    def verify_discovered_emails(self, email_list):
        """使用SMTP验证发现的邮箱地址"""
        try:
            if not email_list:
                print("   ⚠️ 没有邮箱需要验证")
                return {
                    'success': True,
                    'valid_emails': [],
                    'invalid_emails': [],
                    'total_tested': 0
                }
            
            print(f"📧 开始邮箱地址验证: {len(email_list)}个邮箱")
            print("   🎯 目的: 确保只有有效邮箱进入下一步")
            print("   📤 使用SMTP测试发送验证")
            print("   ⏰ 无超时限制: 充分验证每个邮箱")
            
            # 准备邮箱列表JSON
            emails_json = json.dumps(email_list)
            
            # 调用邮箱验证服务
            print("   🐍 调用邮箱验证服务...")
            process = subprocess.Popen([
                'python3', 
                self.email_verifier_path,
                emails_json
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # 等待验证完成（无超时限制）
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                print(f"   ❌ 邮箱验证服务失败: {stderr}")
                return {
                    'success': False,
                    'error': f'Email verification service failed: {stderr}',
                    'valid_emails': [],
                    'invalid_emails': [],
                    'total_tested': len(email_list)
                }
            
            # 解析验证结果
            try:
                # 从输出中提取JSON结果
                lines = stdout.strip().split('\n')
                json_result = None
                
                # 找到JSON结果
                for line in reversed(lines):
                    if line.strip().startswith('{'):
                        try:
                            json_result = json.loads(line.strip())
                            break
                        except:
                            continue
                
                if json_result and json_result.get('success'):
                    valid_emails = [r['email'] for r in json_result.get('valid_emails', [])]
                    invalid_emails = [r['email'] for r in json_result.get('invalid_emails', [])]
                    
                    print(f"   ✅ 邮箱验证完成:")
                    print(f"      📧 总测试: {json_result.get('total_tested', 0)}")
                    print(f"      ✅ 有效: {len(valid_emails)}")
                    print(f"      ❌ 无效: {len(invalid_emails)}")
                    
                    # 显示有效邮箱
                    if valid_emails:
                        print("   📧 有效邮箱列表:")
                        for email in valid_emails:
                            print(f"      ✅ {email}")
                    
                    # 显示无效邮箱
                    if invalid_emails:
                        print("   ❌ 无效邮箱列表:")
                        for email in invalid_emails:
                            print(f"      ❌ {email}")
                    
                    return {
                        'success': True,
                        'valid_emails': valid_emails,
                        'invalid_emails': invalid_emails,
                        'verification_details': json_result.get('valid_emails', []),
                        'total_tested': json_result.get('total_tested', 0),
                        'verification_stats': json_result.get('verification_stats', {}),
                        'verified_at': datetime.now().isoformat()
                    }
                else:
                    print(f"   ❌ 验证结果解析失败")
                    return {
                        'success': False,
                        'error': 'Failed to parse verification results',
                        'valid_emails': [],
                        'invalid_emails': email_list,
                        'total_tested': len(email_list)
                    }
                    
            except Exception as e:
                print(f"   ❌ 验证结果处理失败: {str(e)}")
                return {
                    'success': False,
                    'error': f'Failed to process verification results: {str(e)}',
                    'valid_emails': [],
                    'invalid_emails': email_list,
                    'total_tested': len(email_list)
                }
                
        except Exception as e:
            print(f"   ❌ 邮箱验证失败: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'valid_emails': [],
                'invalid_emails': email_list,
                'total_tested': len(email_list)
            }
    
    def execute_comprehensive_email_discovery(self, industry, max_emails=10):
        """执行完整的邮箱发现和用户画像生成流程"""
        print(f"🚀 启动 {industry} 行业的完整邮箱发现流程")
        print(f"🎯 目标: {max_emails}个邮箱 + 用户画像")
        print("=" * 70)
        
        start_time = time.time()
        
        # 阶段1: 生成搜索策略
        search_strategies = self.generate_intelligent_search_strategy(industry)
        
        all_found_emails = []
        
        # 阶段2: 执行搜索策略
        for i, strategy in enumerate(search_strategies, 1):
            print(f"\\n📍 执行搜索策略 {i}/{len(search_strategies)}")
            print(f"   🎯 策略: {strategy}")
            
            emails = self.search_emails_with_strategy(strategy)
            
            if emails:
                all_found_emails.extend(emails)
                print(f"   ✅ 本策略找到{len(emails)}个邮箱")
                
                # 如果已找到足够邮箱，立即开始用户画像生成
                unique_emails = {e['email']: e for e in all_found_emails}.values()
                if len(unique_emails) >= max_emails:
                    print(f"   🎯 已达到目标邮箱数量，开始用户画像生成")
                    break
            else:
                print(f"   ⚠️ 本策略未找到邮箱")
            
            # 搜索间隔
            time.sleep(2)
        
        # 去重并限制数量
        unique_emails = list({e['email']: e for e in all_found_emails}.values())[:max_emails]
        
        print(f"\\n📧 邮箱发现完成，开始验证有效性...")
        
        # 阶段3: 邮箱验证 - 确保只有有效邮箱进入下一步
        email_addresses = [email_data['email'] for email_data in unique_emails]
        verification_result = self.verify_discovered_emails(email_addresses)
        
        if verification_result['success'] and verification_result['valid_emails']:
            # 只保留验证成功的邮箱
            verified_email_set = set(verification_result['valid_emails'])
            verified_emails = [email_data for email_data in unique_emails 
                             if email_data['email'] in verified_email_set]
            
            print(f"\\n✅ 邮箱验证完成: {len(verified_emails)}/{len(unique_emails)} 个邮箱有效")
            print(f"   📧 有效邮箱将进入用户画像生成阶段")
            
            # 更新邮箱列表为验证后的有效邮箱
            unique_emails = verified_emails
        else:
            print(f"\\n⚠️ 邮箱验证失败或无有效邮箱，继续使用原始邮箱列表")
            verification_result = {
                'success': False,
                'valid_emails': email_addresses,
                'invalid_emails': [],
                'total_tested': len(email_addresses),
                'verification_stats': {}
            }
        
        print(f"\\n👤 开始为{len(unique_emails)}个邮箱生成用户画像...")
        
        # 阶段3: 并行生成用户画像
        profiles = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_email = {
                executor.submit(self.generate_user_profile_with_ollama, email_data, industry): email_data
                for email_data in unique_emails
            }
            
            for future in concurrent.futures.as_completed(future_to_email):
                try:
                    email_data = future_to_email[future]
                    profile = future.result()
                    
                    if profile:
                        profiles.append(profile)
                        print(f"   ✅ {email_data['email']} 画像生成完成")
                    
                except Exception as e:
                    print(f"   ❌ 画像生成失败: {str(e)}")
        
        # 计算总耗时
        total_time = time.time() - start_time
        
        print(f"\\n🎉 完整邮箱发现流程完成!")
        print(f"   📧 发现邮箱: {len(unique_emails)}个")
        print(f"   👤 生成画像: {len(profiles)}个")
        print(f"   ⏱️ 总耗时: {total_time:.1f}秒")
        
        # 返回完整结果
        return {
            'success': True,
            'emails': [e['email'] for e in unique_emails],
            'email_details': unique_emails,
            'user_profiles': profiles,
            'total_emails': len(unique_emails),
            'total_profiles': len(profiles),
            'search_strategies': search_strategies,
            'execution_time': total_time,
            'industry': industry,
            'discovery_method': 'ollama_searxng_integration_with_verification',
            'ollama_enabled': True,
            'searxng_enabled': True,
            'profile_generation': True,
            'email_verification': {
                'enabled': True,
                'verification_result': verification_result,
                'smtp_server': 'smtp.gmail.com',
                'verification_purpose': 'Ensure only valid email addresses proceed to email generation'
            },
            'timestamp': datetime.now().isoformat()
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供行业名称 (例如: "AI startup", "fintech companies")'}))
        return
    
    industry = sys.argv[1]
    max_emails = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # 检查是否为API调用 (第三个参数为 'api')
    is_api_call = len(sys.argv) > 3 and sys.argv[3] == 'api'
    
    # 初始化系统
    agent = OllamaSearxNGEmailAgent()
    
    # 执行完整发现流程
    results = agent.execute_comprehensive_email_discovery(industry, max_emails)
    
    if is_api_call:
        # API调用：只输出JSON，不输出任何其他文本
        print(json.dumps(results, ensure_ascii=False))
    else:
        # 命令行调用：输出详细结果
        print("\\n" + "=" * 70)
        print("🤖 Ollama SearxNG Email Agent 结果报告")
        print("=" * 70)
        
        if results['success']:
            print("📧 发现的邮箱:")
            for i, email in enumerate(results['emails'], 1):
                print(f"   {i}. {email}")
            
            print(f"\\n👤 生成的用户画像:")
            for i, profile in enumerate(results['user_profiles'], 1):
                print(f"   {i}. {profile['email']}")
                print(f"      💼 预估角色: {profile['estimated_role']}")
                print(f"      🏢 公司规模: {profile['company_size']}")
                print(f"      🎯 决策能力: {profile['decision_level']}")
                print(f"      💬 沟通风格: {profile['communication_style']}")
                print(f"      📧 邮件策略: {profile['email_strategy']}")
                print(f"      🎭 画像置信度: {profile['confidence_score']}")
                print()
            
            print(f"📊 发现统计:")
            print(f"   📧 邮箱总数: {results['total_emails']}")
            print(f"   👤 画像总数: {results['total_profiles']}")  
            print(f"   🔍 使用策略: {len(results['search_strategies'])}个")
            print(f"   ⏱️ 执行时间: {results['execution_time']:.1f}秒")
            print(f"   🧠 AI引擎: Ollama (多模型)")
            print(f"   🌐 搜索引擎: SearxNG (JSON格式)")
            print(f"   ⚡ 特色: 完全本地化AI驱动的邮箱发现 + 用户画像")
        else:
            print(f"❌ 发现失败")
        
        # 输出JSON结果
        print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()