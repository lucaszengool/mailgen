#!/usr/bin/env python3
"""
优化的Ollama + SearxNG邮箱搜索系统
- 持续搜索直到找到邮箱
- 增强的搜索策略生成
- 详细的日志系统
- 智能查询优化
- 多轮搜索机制
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
import logging

class OptimizedOllamaEmailFinder:
    def __init__(self):
        # 设置详细日志
        self.setup_detailed_logging()
        
        # Ollama配置
        self.ollama_url = 'http://localhost:11434'
        self.models = {
            'fast': 'qwen2.5:0.5b',
            'general': 'qwen2.5:0.5b',
            'profile': 'llama3.2'
        }
        
        # SearxNG配置
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
        
        # 搜索状态跟踪
        self.found_emails = []
        self.search_attempts = 0
        self.max_search_rounds = 10  # 最多搜索轮数
        self.target_email_count = 5
        self.search_stats = {
            'total_queries': 0,
            'successful_queries': 0,
            'emails_found': 0,
            'websites_scraped': 0,
            'unique_domains': set()
        }
        
        self.logger.info("🚀 优化的Ollama邮箱搜索器初始化")
        self.logger.info(f"   🧠 Fast Model: {self.models['fast']}")
        self.logger.info(f"   🌐 SearxNG: {self.searxng_url}")
        self.logger.info(f"   🎯 目标邮箱数: {self.target_email_count}")
        self.logger.info(f"   🔄 最多搜索轮数: {self.max_search_rounds}")
        
    def setup_detailed_logging(self):
        """设置详细的日志系统"""
        # 创建日志记录器
        self.logger = logging.getLogger('EmailFinder')
        self.logger.setLevel(logging.INFO)
        
        # 创建控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # 创建文件处理器
        file_handler = logging.FileHandler('email_finder.log', encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        
        # 创建格式化器
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        
        console_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)
        
        # 添加处理器
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
    
    def call_ollama(self, prompt, model_type='fast', options=None):
        """调用Ollama API - 增加详细日志"""
        try:
            model = self.models.get(model_type, self.models['fast'])
            default_options = {
                'temperature': 0.8,
                'num_predict': 300,
                'num_ctx': 2048
            }
            
            if options:
                default_options.update(options)
                
            self.logger.debug(f"调用Ollama模型: {model}")
            self.logger.debug(f"Prompt长度: {len(prompt)}字符")
            
            start_time = time.time()
            response = requests.post(f"{self.ollama_url}/api/generate", json={
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': default_options
            }, timeout=60)
            
            duration = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()['response'].strip()
                self.logger.info(f"✅ Ollama响应成功 ({duration:.1f}s) - 结果长度: {len(result)}")
                return result
            else:
                self.logger.error(f"❌ Ollama API错误: {response.status_code}")
                return None
                
        except Exception as e:
            self.logger.error(f"❌ Ollama调用失败: {str(e)}")
            return None
    
    def generate_enhanced_search_strategies(self, industry, round_number=1):
        """生成增强的搜索策略 - 基于轮数调整策略"""
        self.logger.info(f"🧠 生成第{round_number}轮搜索策略 - 行业: {industry}")
        
        # 根据搜索轮数调整策略
        if round_number == 1:
            # 第一轮：简短高效搜索
            strategies = [
                f'{industry} CEO email',
                f'{industry} founder contact',
                f'{industry} business email',
                f'{industry} company contact',
                f'{industry} team email'
            ]
        elif round_number == 2:
            # 第二轮：职位相关搜索
            strategies = [
                f'{industry} sales email',
                f'{industry} marketing contact',
                f'{industry} CTO email',
                f'{industry} director contact',
                f'{industry} manager email'
            ]
        elif round_number == 3:
            # 第三轮：专业角色搜索
            strategies = [
                f'{industry} specialist email',
                f'{industry} consultant contact',
                f'{industry} expert email',
                f'{industry} advisor contact',
                f'{industry} support email'
            ]
        else:
            # 后续轮数：扩展搜索
            strategies = [
                f'{industry} startup email',
                f'{industry} executive contact',
                f'{industry} owner email',
                f'{industry} info contact',
                f'{industry} partnership email'
            ]
        
        # 使用Ollama优化搜索策略
        try:
            prompt = f"""生成5个简短的{industry}行业邮箱搜索查询：

要求：
1. 每个查询最多3-4个词
2. 不使用复杂操作符(site:, intext:等)
3. 直接有效的关键词组合
4. 包含"email"或"contact"

返回格式（只返回查询，不要解释）：
1. [查询1]
2. [查询2]
3. [查询3]
4. [查询4]
5. [查询5]"""

            result = self.call_ollama(prompt, 'fast')
            
            if result:
                optimized_strategies = []
                for line in result.split('\n'):
                    line = line.strip()
                    if line and re.match(r'^\d+\.', line):
                        cleaned = re.sub(r'^\d+\.\s*', '', line).strip()
                        if len(cleaned) > 10:
                            optimized_strategies.append(cleaned)
                
                if len(optimized_strategies) >= 3:
                    self.logger.info(f"✅ Ollama优化了{len(optimized_strategies)}个搜索策略")
                    return optimized_strategies[:5]
        
        except Exception as e:
            self.logger.warning(f"⚠️ Ollama策略优化失败，使用默认策略: {str(e)}")
        
        self.logger.info(f"✅ 使用默认策略: {len(strategies)}个")
        return strategies
    
    def search_with_enhanced_logging(self, query, max_results=25):
        """增强的SearxNG搜索 - 详细日志"""
        try:
            self.logger.info(f"🔍 SearxNG搜索: {query}")
            self.search_stats['total_queries'] += 1
            
            params = {
                'q': query,
                'format': 'json',
                'categories': 'general',
                'pageno': 1
            }
            
            search_url = f"{self.searxng_url}/search"
            start_time = time.time()
            
            response = self.session.get(search_url, params=params, timeout=30)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    results = data.get('results', [])
                    
                    self.logger.info(f"✅ SearxNG成功 ({duration:.1f}s): {len(results)}个结果")
                    self.search_stats['successful_queries'] += 1
                    
                    # 分析结果质量
                    email_preview_count = 0
                    for result in results:
                        text = f"{result.get('title', '')} {result.get('content', '')}"
                        if '@' in text:
                            email_preview_count += 1
                    
                    self.logger.info(f"📊 结果分析: {email_preview_count}/{len(results)} 个结果包含@符号")
                    
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
                    self.logger.error(f"❌ JSON解析错误: {str(e)}")
                    return []
                    
            else:
                self.logger.error(f"❌ SearxNG请求失败: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"❌ SearxNG搜索错误: {str(e)}")
            return []
    
    def extract_emails_with_detailed_logging(self, text, source_info=""):
        """增强的邮箱提取 - 详细日志"""
        emails = self.email_pattern.findall(text)
        
        if emails:
            self.logger.debug(f"🔍 在'{source_info[:30]}...'中发现{len(emails)}个邮箱模式")
        
        valid_emails = []
        for email in emails:
            email_lower = email.lower()
            
            # 排除规则
            exclusions = [
                'example.com', 'test.com', 'domain.com', 'yoursite.com',
                'noreply', 'no-reply', 'donotreply', 'privacy@', 'legal@',
                'support@example', 'admin@example', 'info@example',
                'webmaster@', 'abuse@', 'postmaster@', 'sample@'
            ]
            
            if any(pattern in email_lower for pattern in exclusions):
                self.logger.debug(f"❌ 排除示例邮箱: {email}")
                continue
            
            # 基本验证
            if 5 < len(email) < 100 and email.count('@') == 1:
                domain = email.split('@')[1]
                if '.' in domain and len(domain) > 4:
                    valid_emails.append(email)
                    self.logger.info(f"✅ 发现有效邮箱: {email}")
                    self.search_stats['unique_domains'].add(domain)
        
        return list(set(valid_emails))
    
    def scrape_website_with_logging(self, url):
        """增强的网站爬取 - 详细日志"""
        try:
            self.logger.info(f"🌐 爬取网站: {url[:60]}...")
            self.search_stats['websites_scraped'] += 1
            
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 移除无用元素
                for element in soup(["script", "style", "nav", "footer", "header"]):
                    element.decompose()
                
                # 提取文本
                text = soup.get_text()
                
                # 特别关注联系页面
                contact_sections = soup.find_all(['div', 'section'], 
                    class_=re.compile(r'contact|about|team|staff', re.I))
                
                contact_text = ""
                for section in contact_sections:
                    contact_text += " " + section.get_text()
                
                all_text = text + " " + contact_text
                
                emails = self.extract_emails_with_detailed_logging(all_text, f"网站 {url}")
                
                self.logger.info(f"✅ 网站爬取完成 ({duration:.1f}s): 发现{len(emails)}个邮箱")
                return emails
                
            else:
                self.logger.warning(f"⚠️ 网站返回状态码: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"❌ 网站爬取失败 {url}: {str(e)}")
            return []
    
    def execute_persistent_email_search(self, industry, target_count=5):
        """执行持续搜索直到找到邮箱"""
        self.logger.info(f"🚀 开始持续搜索 - 行业: {industry}, 目标: {target_count}个邮箱")
        self.target_email_count = target_count
        
        start_time = time.time()
        all_found_emails = []
        round_number = 1
        
        while len(all_found_emails) < target_count and round_number <= self.max_search_rounds:
            self.logger.info(f"\n📍 第{round_number}轮搜索 - 已找到{len(all_found_emails)}个邮箱")
            
            # 生成本轮搜索策略
            strategies = self.generate_enhanced_search_strategies(industry, round_number)
            
            round_emails = []
            
            # 执行本轮所有策略
            for i, strategy in enumerate(strategies, 1):
                self.logger.info(f"   🎯 策略{i}/{len(strategies)}: {strategy}")
                
                # SearxNG搜索
                search_results = self.search_with_enhanced_logging(strategy)
                
                if not search_results:
                    self.logger.warning(f"   ⚠️ 策略{i}无搜索结果")
                    continue
                
                # 从搜索预览提取邮箱
                preview_emails = []
                for result in search_results:
                    text = f"{result['title']} {result['content']}"
                    emails = self.extract_emails_with_detailed_logging(text, f"搜索预览-{result.get('title', '')[:20]}")
                    
                    for email in emails:
                        if not any(e['email'] == email for e in preview_emails):
                            preview_emails.append({
                                'email': email,
                                'source': 'search_preview',
                                'source_url': result['url'],
                                'source_title': result['title'],
                                'confidence': 0.8,
                                'round': round_number,
                                'strategy': strategy
                            })
                
                self.logger.info(f"   📧 搜索预览发现: {len(preview_emails)}个邮箱")
                round_emails.extend(preview_emails)
                
                # 并行爬取网站
                self.logger.info(f"   🌐 并行爬取前8个网站...")
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                    future_to_result = {
                        executor.submit(self.scrape_website_with_logging, result['url']): result 
                        for result in search_results[:8]
                    }
                    
                    for future in concurrent.futures.as_completed(future_to_result, timeout=30):
                        try:
                            result = future_to_result[future]
                            website_emails = future.result()
                            
                            for email in website_emails:
                                if not any(e['email'] == email for e in round_emails):
                                    round_emails.append({
                                        'email': email,
                                        'source': 'website_scraping',
                                        'source_url': result['url'],
                                        'source_title': result['title'],
                                        'confidence': 0.9,
                                        'round': round_number,
                                        'strategy': strategy
                                    })
                                    
                        except Exception as e:
                            continue
                
                self.logger.info(f"   ✅ 策略{i}完成: 本策略总计{len([e for e in round_emails if e['strategy'] == strategy])}个邮箱")
                
                # 如果已达到目标，立即停止
                all_unique = {e['email']: e for e in all_found_emails + round_emails}
                if len(all_unique) >= target_count:
                    self.logger.info(f"🎯 已达到目标邮箱数量！")
                    break
                
                # 策略间隔
                time.sleep(1)
            
            # 合并本轮结果
            all_found_emails.extend(round_emails)
            
            # 去重
            unique_emails = {e['email']: e for e in all_found_emails}
            all_found_emails = list(unique_emails.values())
            
            self.logger.info(f"📊 第{round_number}轮完成: 本轮新增{len(round_emails)}个，总计{len(all_found_emails)}个唯一邮箱")
            
            # 更新统计
            self.search_stats['emails_found'] = len(all_found_emails)
            
            # 如果已达到目标，退出循环
            if len(all_found_emails) >= target_count:
                self.logger.info(f"🎉 达成目标！找到{len(all_found_emails)}个邮箱")
                break
                
            # 如果本轮没有找到任何邮箱，调整策略
            if len(round_emails) == 0:
                self.logger.warning(f"⚠️ 第{round_number}轮未找到邮箱，调整搜索策略...")
                
                # 可以在这里添加更激进的搜索策略
                if round_number >= 3:
                    self.logger.info("🔄 切换到更宽泛的搜索策略...")
            
            round_number += 1
            
            # 轮次间隔
            if round_number <= self.max_search_rounds:
                self.logger.info(f"⏸️ 轮次间隔3秒...")
                time.sleep(3)
        
        # 最终结果
        final_emails = all_found_emails[:target_count]
        total_time = time.time() - start_time
        
        self.logger.info(f"\n🎊 持续搜索完成！")
        self.logger.info(f"   📧 最终邮箱数: {len(final_emails)}")
        self.logger.info(f"   🔄 搜索轮数: {round_number-1}")
        self.logger.info(f"   ⏱️ 总耗时: {total_time:.1f}秒")
        self.logger.info(f"   📊 搜索统计:")
        self.logger.info(f"      - 总查询数: {self.search_stats['total_queries']}")
        self.logger.info(f"      - 成功查询: {self.search_stats['successful_queries']}")
        self.logger.info(f"      - 爬取网站数: {self.search_stats['websites_scraped']}")
        self.logger.info(f"      - 发现域名数: {len(self.search_stats['unique_domains'])}")
        
        # 转换统计数据为JSON可序列化格式
        stats_dict = dict(self.search_stats)
        stats_dict['unique_domains'] = list(self.search_stats['unique_domains'])
        
        return {
            'success': len(final_emails) > 0,
            'emails': [e['email'] for e in final_emails],
            'email_details': final_emails,
            'total_emails': len(final_emails),
            'search_rounds': round_number - 1,
            'execution_time': total_time,
            'search_stats': stats_dict,
            'industry': industry,
            'target_achieved': len(final_emails) >= target_count,
            'method': 'persistent_ollama_searxng',
            'timestamp': datetime.now().isoformat()
        }

def main():
    if len(sys.argv) < 2:
        print('请提供行业名称，例如: python3 OptimizedOllamaEmailFinder.py "AI/Machine Learning" 5')
        return
    
    industry = sys.argv[1]
    target_count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    finder = OptimizedOllamaEmailFinder()
    results = finder.execute_persistent_email_search(industry, target_count)
    
    print("\n" + "="*80)
    print("🎯 优化邮箱搜索器 - 最终结果")
    print("="*80)
    
    if results['success']:
        print(f"✅ 成功找到 {results['total_emails']} 个邮箱:")
        for i, email in enumerate(results['emails'], 1):
            print(f"   {i}. {email}")
        
        print(f"\n📊 搜索性能:")
        print(f"   🔄 搜索轮数: {results['search_rounds']}")
        print(f"   ⏱️ 总耗时: {results['execution_time']:.1f}秒")
        print(f"   🎯 目标达成: {'是' if results['target_achieved'] else '否'}")
        print(f"   📈 成功率: {results['search_stats']['successful_queries']}/{results['search_stats']['total_queries']} 查询")
        print(f"   🌐 爬取网站: {results['search_stats']['websites_scraped']} 个")
        
    else:
        print("❌ 未能找到邮箱")
    
    # 输出详细JSON结果
    print(f"\n📋 详细结果 (JSON):")
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()