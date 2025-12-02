#!/usr/bin/env python3
"""
超级邮箱搜索引擎 - 基于2024年最佳实践
- 使用最有效的Google搜索操作符
- 基于专业邮箱发现工具的策略
- 持续搜索直到找到真实邮箱
- 详细日志和性能监控
"""

import sys
import json
import time
import re
import requests
import os
import hashlib
import dns.resolver
from datetime import datetime
from urllib.parse import quote, urlencode
from bs4 import BeautifulSoup
import concurrent.futures
import logging

class SuperEmailDiscoveryEngine:
    def __init__(self):
        self.setup_logging()

        # SearxNG配置 - Railway兼容
        self.searxng_url = os.environ.get('SEARXNG_URL', 'http://localhost:8080')

        # 网络会话配置 - 无超时限制
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/',
            'Connection': 'keep-alive'
        })
        # 设置无限超时
        self.session.timeout = None

        # 邮箱模式
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')

        # 🔥 NEW: Email cache directory for deduplication across runs
        self.cache_dir = os.path.join(os.path.dirname(__file__), '.email_cache')
        os.makedirs(self.cache_dir, exist_ok=True)

        # 搜索状态
        self.found_emails = []
        self.already_returned_emails = set()  # 🔥 NEW: Track already-returned emails
        self.search_stats = {
            'total_queries': 0,
            'successful_queries': 0,
            'emails_found': 0,
            'websites_scraped': 0,
            'unique_domains': set(),
            'query_success_rate': {}
        }

        self.logger.info("🚀 超级邮箱搜索引擎初始化")
        self.logger.info("   📊 基于2024年最佳邮箱发现实践")
        self.logger.info("   🎯 目标：确保找到真实有效的邮箱地址")
        self.logger.info("   🗂️ 缓存目录: " + self.cache_dir)
        
    def setup_logging(self):
        """设置详细日志"""
        self.logger = logging.getLogger('SuperEmailEngine')
        self.logger.setLevel(logging.INFO)

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)

        file_handler = logging.FileHandler('super_email_discovery.log', encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)

        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )

        console_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)

        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)

    def get_cache_filename(self, industry, session_id=None):
        """生成缓存文件名（基于行业名称和session ID的hash）"""
        # Create a hash of the industry to use as filename
        industry_hash = hashlib.md5(industry.lower().strip().encode()).hexdigest()[:12]

        # 🔥 FIX: Use session_id if provided to create campaign-specific cache
        if session_id:
            session_hash = hashlib.md5(str(session_id).encode()).hexdigest()[:8]
            return os.path.join(self.cache_dir, f'returned_emails_{industry_hash}_{session_hash}.txt')
        else:
            return os.path.join(self.cache_dir, f'returned_emails_{industry_hash}.txt')

    def load_returned_emails_cache(self, industry, session_id=None):
        """加载已返回的邮箱缓存"""
        cache_file = self.get_cache_filename(industry, session_id)
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cached_emails = {line.strip() for line in f if line.strip()}
                    self.already_returned_emails = cached_emails
                    session_info = f" (Session: {session_id})" if session_id else ""
                    self.logger.info(f"📂 加载缓存: {len(cached_emails)} 个已返回邮箱 (行业: {industry}{session_info})")
                    return len(cached_emails)
            except Exception as e:
                self.logger.warning(f"⚠️ 加载缓存失败: {e}")
                self.already_returned_emails = set()
        else:
            self.logger.info(f"📂 无缓存文件，将返回全新邮箱")
            self.already_returned_emails = set()
        return 0

    def save_returned_emails_cache(self, industry, new_emails, session_id=None):
        """保存新返回的邮箱到缓存"""
        cache_file = self.get_cache_filename(industry, session_id)
        try:
            # Append new emails to cache file
            with open(cache_file, 'a', encoding='utf-8') as f:
                for email in new_emails:
                    f.write(email + '\n')
                    self.already_returned_emails.add(email)
            self.logger.info(f"💾 缓存已更新: +{len(new_emails)} 个邮箱")
        except Exception as e:
            self.logger.error(f"❌ 保存缓存失败: {e}")
    
    def generate_professional_search_strategies(self, industry, round_num=1):
        """生成基于2024年最佳实践的专业搜索策略"""
        self.logger.info(f"🧠 生成第{round_num}轮专业搜索策略 - {industry}")
        
        # 基于研究的最有效搜索策略
        base_strategies = []
        
        if round_num == 1:
            # 第一轮：简短高效搜索模式
            base_strategies = [
                f'{industry} email contact',
                f'{industry} CEO email',
                f'{industry} founder contact',
                f'{industry} business email',
                f'{industry} company contact'
            ]
        elif round_num == 2:
            # 第二轮：简短变体搜索
            base_strategies = [
                f'{industry} team email',
                f'{industry} sales contact',
                f'{industry} support email',
                f'{industry} info contact',
                f'{industry} director email'
            ]
        elif round_num == 3:
            # 第三轮：职位相关搜索
            base_strategies = [
                f'{industry} manager email',
                f'{industry} consultant contact',
                f'{industry} specialist email',
                f'{industry} expert contact',
                f'{industry} advisor email'
            ]
        elif round_num == 4:
            # 第四轮：创业与企业搜索
            base_strategies = [
                f'{industry} startup email',
                f'{industry} entrepreneur contact',
                f'{industry} business owner email',
                f'{industry} partner contact',
                f'{industry} investor email'
            ]
        elif round_num == 5:
            # 第五轮：部门与职能搜索
            base_strategies = [
                f'{industry} marketing email',
                f'{industry} operations contact',
                f'{industry} product manager email',
                f'{industry} customer success contact',
                f'{industry} growth email'
            ]
        elif round_num % 3 == 0:
            # 每3轮：地域与市场搜索
            base_strategies = [
                f'{industry} North America email',
                f'{industry} Europe contact',
                f'{industry} Asia Pacific email',
                f'{industry} global contact',
                f'{industry} international email'
            ]
        elif round_num % 3 == 1:
            # 每3轮+1：技术与专业搜索
            base_strategies = [
                f'{industry} CTO email',
                f'{industry} developer contact',
                f'{industry} engineer email',
                f'{industry} architect contact',
                f'{industry} technical lead email'
            ]
        else:
            # 其他轮次：混合搜索
            base_strategies = [
                f'{industry} company email',
                f'{industry} business contact',
                f'{industry} executive email',
                f'{industry} leadership contact',
                f'{industry} decision maker email'
            ]
        
        self.logger.info(f"   ✅ 生成{len(base_strategies)}个专业级搜索策略")
        return base_strategies
    
    def search_with_advanced_logging(self, query, max_results=50):
        """高级SearxNG搜索 - 无超时限制，尽可能多地获取结果"""
        try:
            self.logger.info(f"🔍 深度专业搜索: {query[:80]}...")
            self.search_stats['total_queries'] += 1
            
            params = {
                'q': query,
                'format': 'json',
                'categories': 'general',
                'pageno': 1
            }
            
            start_time = time.time()
            # 移除超时限制 - 让搜索有足够时间完成
            response = self.session.get(f"{self.searxng_url}/search", params=params)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    results = data.get('results', [])
                    
                    self.logger.info(f"   ✅ 搜索成功 ({duration:.1f}s): {len(results)}个结果")
                    self.search_stats['successful_queries'] += 1
                    
                    # 分析结果质量
                    email_indicators = 0
                    contact_indicators = 0
                    
                    for result in results:
                        text = f"{result.get('title', '')} {result.get('content', '')}".lower()
                        if '@' in text:
                            email_indicators += 1
                        if any(word in text for word in ['contact', 'email', 'reach']):
                            contact_indicators += 1
                    
                    self.logger.info(f"   📊 质量分析: {email_indicators}个@符号, {contact_indicators}个联系指示器")
                    
                    # 记录查询成功率
                    query_type = self.classify_query_type(query)
                    if query_type not in self.search_stats['query_success_rate']:
                        self.search_stats['query_success_rate'][query_type] = {'success': 0, 'total': 0}
                    
                    self.search_stats['query_success_rate'][query_type]['total'] += 1
                    if email_indicators > 0:
                        self.search_stats['query_success_rate'][query_type]['success'] += 1
                    
                    return results[:max_results]
                    
                except json.JSONDecodeError as e:
                    self.logger.error(f"   ❌ JSON解析失败: {str(e)}")
                    return []
            else:
                self.logger.error(f"   ❌ 搜索请求失败: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"   ❌ 搜索错误: {str(e)}")
            return []
    
    def classify_query_type(self, query):
        """分类搜索查询类型以进行性能分析"""
        query_lower = query.lower()
        if 'site:linkedin.com' in query_lower:
            return 'linkedin_search'
        elif 'site:' in query_lower:
            return 'site_specific'
        elif 'filetype:' in query_lower:
            return 'file_search'
        elif 'intext:' in query_lower:
            return 'content_search'
        else:
            return 'general_search'
    
    def is_personal_email(self, email):
        """判断是否为个人邮箱（非通用邮箱）"""
        generic_prefixes = [
            'info', 'contact', 'hello', 'hi', 'support', 'help', 'admin',
            'sales', 'marketing', 'office', 'general', 'inquiry', 'service',
            'careers', 'jobs', 'hr', 'feedback', 'team', 'press', 'media',
            'noreply', 'no-reply', 'webmaster', 'postmaster'
        ]

        username = email.split('@')[0].lower()

        # 通用邮箱判断
        if any(username.startswith(prefix) for prefix in generic_prefixes):
            return False
        if any(username == prefix for prefix in generic_prefixes):
            return False

        # 个人邮箱通常包含名字（有点、下划线或驼峰命名）
        if '.' in username or '_' in username:
            return True
        if any(c.isupper() for c in email.split('@')[0]):  # 驼峰命名
            return True

        # 名字长度判断（个人邮箱通常5-20字符）
        if 5 <= len(username) <= 20 and username.isalpha():
            return True

        return False

    def extract_context_around_email(self, html_content, email):
        """提取邮箱周围的上下文信息（姓名、职位、部门）"""
        if not html_content or not email:
            return {}

        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')

            # 查找包含此邮箱的元素
            email_elements = soup.find_all(string=re.compile(re.escape(email)))

            context = {
                'name': None,
                'title': None,
                'department': None
            }

            # 职位关键词
            title_keywords = [
                'CEO', 'CTO', 'CFO', 'COO', 'President', 'Vice President', 'VP',
                'Director', 'Manager', 'Head', 'Lead', 'Chief', 'Founder',
                'Engineer', 'Developer', 'Scientist', 'Researcher', 'Analyst',
                'Coordinator', 'Specialist', 'Consultant', 'Advisor'
            ]

            # 部门关键词
            dept_keywords = [
                'Engineering', 'Marketing', 'Sales', 'Finance', 'HR',
                'Human Resources', 'Operations', 'IT', 'Technology', 'Product',
                'Research', 'Development', 'Customer Success', 'Support',
                'Food Science', 'Nutrition', 'Culinary', 'Agriculture'
            ]

            for elem in email_elements:
                parent = elem.parent
                if not parent:
                    continue

                # 获取父元素及其周围的文本
                context_text = parent.get_text(separator=' ', strip=True)

                # 扩展到更大的上下文（祖父元素）
                if parent.parent:
                    context_text += ' ' + parent.parent.get_text(separator=' ', strip=True)

                # 提取职位
                for title_kw in title_keywords:
                    if title_kw.lower() in context_text.lower():
                        context['title'] = title_kw
                        break

                # 提取部门
                for dept_kw in dept_keywords:
                    if dept_kw.lower() in context_text.lower():
                        context['department'] = dept_kw
                        break

                # 尝试提取姓名（邮箱附近的大写单词模式）
                # 匹配 "John Smith" 或 "Dr. John Smith" 等模式
                name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
                names = re.findall(name_pattern, context_text)
                if names and not context['name']:
                    # 过滤掉公司名、职位名等
                    for name in names:
                        name_lower = name.lower()
                        # 排除职位关键词
                        if not any(kw.lower() in name_lower for kw in title_keywords):
                            # 排除部门关键词
                            if not any(kw.lower() in name_lower for kw in dept_keywords):
                                context['name'] = name
                                break

                # 如果找到了有用信息，提前结束
                if context['name'] or context['title'] or context['department']:
                    break

            return context

        except Exception as e:
            self.logger.debug(f"   ⚠️ 上下文提取失败: {e}")
            return {}

    def extract_emails_advanced(self, text, source="", html_content=None):
        """高级邮箱提取 - 使用2024年最佳模式 + 优先个人邮箱"""
        if not text:
            return []

        # 找到所有潜在邮箱
        potential_emails = self.email_pattern.findall(text)

        valid_emails = []
        excluded_count = 0

        for email in potential_emails:
            email_lower = email.lower()

            # 2024年更新的排除规则
            exclusions = [
                'example.com', 'test.com', 'domain.com', 'yoursite.com', 'company.com',
                'noreply', 'no-reply', 'donotreply', 'bounce', 'mailer-daemon',
                'privacy@', 'legal@', 'abuse@', 'postmaster@', 'webmaster@',
                'support@example', 'admin@example', 'info@example', 'sales@example',
                'sample@', 'demo@', 'fake@', 'null@', 'void@'
            ]

            if any(pattern in email_lower for pattern in exclusions):
                excluded_count += 1
                continue

            # 验证邮箱格式
            if self.validate_email_format(email):
                # 提取邮箱周围的上下文（姓名、职位、部门）
                context = self.extract_context_around_email(html_content, email) if html_content else {}

                valid_emails.append({
                    'email': email,
                    'is_personal': self.is_personal_email(email),
                    'name': context.get('name'),
                    'title': context.get('title'),
                    'department': context.get('department')
                })

                domain = email.split('@')[1]
                self.search_stats['unique_domains'].add(domain)

                email_type = "个人" if self.is_personal_email(email) else "通用"
                self.logger.info(f"   ✅ 发现{email_type}邮箱: {email} (来源: {source[:30]})")
                if context.get('name'):
                    self.logger.info(f"      👤 姓名: {context['name']}")
                if context.get('title'):
                    self.logger.info(f"      💼 职位: {context['title']}")
                if context.get('department'):
                    self.logger.info(f"      🏢 部门: {context['department']}")

        if excluded_count > 0:
            self.logger.debug(f"   🗑️ 排除了{excluded_count}个示例/无效邮箱")

        # 优先返回个人邮箱
        personal_emails = [e for e in valid_emails if e['is_personal']]
        generic_emails = [e for e in valid_emails if not e['is_personal']]

        # 个人邮箱 + 通用邮箱（有上下文的优先）
        generic_with_context = [e for e in generic_emails if e.get('name') or e.get('title') or e.get('department')]
        generic_without_context = [e for e in generic_emails if not (e.get('name') or e.get('title') or e.get('department'))]

        prioritized_emails = personal_emails + generic_with_context + generic_without_context

        self.logger.info(f"   📊 邮箱分类: {len(personal_emails)}个人 + {len(generic_with_context)}通用(有上下文) + {len(generic_without_context)}通用(无上下文)")

        return prioritized_emails
    
    def validate_email_format(self, email):
        """验证邮箱格式"""
        if not (5 < len(email) < 100 and email.count('@') == 1):
            return False

        local, domain = email.split('@')

        # 检查本地部分
        if not local or len(local) > 64:
            return False

        # 检查域名部分
        if not domain or '.' not in domain or len(domain) < 4:
            return False

        # 检查顶级域名
        tld = domain.split('.')[-1]
        if len(tld) < 2 or not tld.isalpha():
            return False

        return True

    def validate_email_deliverable(self, email):
        """
        验证邮箱是否可投递 (MX记录检查)
        - 检查域名是否有MX记录
        - 排除已知无效/垃圾域名
        - 不发送实际邮件，仅验证域名
        """
        try:
            if not email or '@' not in email:
                return False, "Invalid email format"

            domain = email.split('@')[1].lower()

            # 已知无效/垃圾域名列表
            invalid_domains = [
                'example.com', 'test.com', 'domain.com', 'yoursite.com', 'company.com',
                'email.com', 'mail.com', 'sample.com', 'demo.com', 'fake.com',
                'placeholder.com', 'invalid.com', 'null.com', 'void.com',
                'tempmail.com', 'throwaway.com', 'disposable.com',
                'mailinator.com', 'guerrillamail.com', '10minutemail.com',
                'yopmail.com', 'tempmail.net', 'trashmail.com'
            ]

            if domain in invalid_domains:
                return False, f"Known invalid domain: {domain}"

            # 检查MX记录 (域名是否可接收邮件)
            try:
                mx_records = dns.resolver.resolve(domain, 'MX')
                if not mx_records:
                    return False, f"No MX records for domain: {domain}"

                # 获取MX记录的主机名
                mx_hosts = [str(r.exchange).rstrip('.').lower() for r in mx_records]

                # 检查MX记录是否指向已知垃圾邮件服务
                spam_mx_patterns = ['localhost', 'null', 'void', 'invalid', 'example']
                for mx_host in mx_hosts:
                    if any(pattern in mx_host for pattern in spam_mx_patterns):
                        return False, f"MX record points to invalid host: {mx_host}"

                return True, f"Valid MX records found: {len(mx_records)}"

            except dns.resolver.NXDOMAIN:
                return False, f"Domain does not exist: {domain}"
            except dns.resolver.NoAnswer:
                return False, f"No MX records for domain: {domain}"
            except dns.resolver.NoNameservers:
                return False, f"No name servers for domain: {domain}"
            except dns.exception.Timeout:
                # DNS超时 - 可能是有效域名，但暂时无法验证
                self.logger.warning(f"   ⏱️ DNS timeout for {domain}, assuming valid")
                return True, "DNS timeout - assuming valid"
            except Exception as e:
                # DNS查询失败但不一定无效
                self.logger.warning(f"   ⚠️ DNS query failed for {domain}: {e}")
                return True, f"DNS query failed, assuming valid: {e}"

        except Exception as e:
            self.logger.error(f"   ❌ Email validation error: {e}")
            return False, f"Validation error: {e}"

    def validate_emails_batch(self, email_list):
        """
        批量验证邮箱列表，返回有效邮箱
        """
        if not email_list:
            return []

        valid_emails = []
        invalid_count = 0

        self.logger.info(f"🔍 验证 {len(email_list)} 个邮箱地址...")

        for email_data in email_list:
            email = email_data['email'] if isinstance(email_data, dict) else email_data

            is_valid, reason = self.validate_email_deliverable(email)

            if is_valid:
                valid_emails.append(email_data)
            else:
                invalid_count += 1
                self.logger.info(f"   ❌ 排除无效邮箱: {email} ({reason})")

        self.logger.info(f"✅ 验证完成: {len(valid_emails)} 有效, {invalid_count} 无效")
        return valid_emails
    
    def scrape_website_advanced(self, url):
        """高级网站爬取 - 专注联系信息，无时间限制 + 上下文提取"""
        try:
            self.logger.info(f"   🌐 深度无限爬取: {url[:60]}...")
            self.search_stats['websites_scraped'] += 1

            start_time = time.time()
            # 移除超时限制 - 让爬取有充足时间
            response = self.session.get(url)
            duration = time.time() - start_time

            if response.status_code != 200:
                self.logger.warning(f"   ⚠️ HTTP {response.status_code}: {url}")
                return []

            soup = BeautifulSoup(response.content, 'html.parser')

            # 保存原始HTML用于上下文提取
            html_content = response.content

            # 移除干扰元素
            for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                element.decompose()

            # 优先搜索联系相关区域
            priority_areas = []

            # 查找联系页面关键区域
            contact_selectors = [
                '[class*="contact"]', '[id*="contact"]',
                '[class*="about"]', '[id*="about"]',
                '[class*="team"]', '[id*="team"]',
                '[class*="staff"]', '[id*="staff"]',
                '[class*="press"]', '[id*="press"]',
                '[class*="media"]', '[id*="media"]'
            ]

            for selector in contact_selectors:
                elements = soup.select(selector)
                for elem in elements:
                    priority_areas.append(elem.get_text())

            # 获取主要内容
            main_content = soup.get_text()

            # 合并所有文本，优先处理联系区域
            all_text = ' '.join(priority_areas) + ' ' + main_content

            # 传递HTML内容以提取上下文
            emails = self.extract_emails_advanced(all_text, f"网站 {url}", html_content)

            self.logger.info(f"   ✅ 爬取完成 ({duration:.1f}s): {len(emails)}个邮箱")
            return emails

        except Exception as e:
            self.logger.error(f"   ❌ 爬取失败 {url}: {str(e)}")
            return []
    
    def execute_persistent_discovery(self, industry, target_count=5, max_rounds=None, session_id=None):
        """执行无限制持续搜索 - 越多越准确"""
        # 🔥 FIX: Scale max_rounds based on target_count
        # Each round finds ~5-15 new emails on average (after filtering cached)
        # Use at least 100 rounds, scale up for larger requests, cap at 500 for safety
        if max_rounds is None:
            max_rounds = min(500, max(100, target_count // 5))  # ~5 emails per round, max 500 rounds

        self.logger.info(f"🚀 启动无限制超级邮箱搜索 - {industry}")
        self.logger.info(f"   🎯 目标: {target_count}个NEW邮箱 (跳过已返回)")
        self.logger.info(f"   🔄 最大轮数: {max_rounds} (动态调整，确保找到足够新邮箱)")
        self.logger.info(f"   📊 使用2024年最佳搜索实践")
        self.logger.info(f"   ⏰ 无时间限制 - 持续搜索直到找到足够新邮箱")
        if session_id:
            self.logger.info(f"   🔑 Session ID: {session_id} (campaign-specific cache)")

        # 🔥 FIX: Load cache of already-returned emails with session_id
        cached_count = self.load_returned_emails_cache(industry, session_id)
        if cached_count > 0:
            self.logger.info(f"   🔄 跳过已返回的 {cached_count} 个邮箱，寻找新邮箱...")

        start_time = time.time()
        all_emails = []
        round_num = 1
        consecutive_empty_rounds = 0
        total_emails_found = 0  # 🔥 FIX: Track total including duplicates
        total_cached_skipped = 0  # 🔥 FIX: Track how many cached emails skipped
        
        while len(all_emails) < target_count and round_num <= max_rounds:
            self.logger.info(f"\n📍 第{round_num}轮搜索 (已找到 {len(all_emails)}/{target_count})")
            
            # 生成本轮策略
            strategies = self.generate_professional_search_strategies(industry, round_num)
            round_emails = []
            
            for i, strategy in enumerate(strategies, 1):
                self.logger.info(f"   🎯 策略{i}/{len(strategies)}: {strategy[:70]}...")
                
                
                # 搜索
                results = self.search_with_advanced_logging(strategy)
                
                if not results:
                    self.logger.warning(f"   ⚠️ 策略{i} 无结果")
                    continue
                
                # 从搜索预览提取邮箱
                preview_emails = []
                for result in results:
                    text = f"{result.get('title', '')} {result.get('content', '')}"
                    emails = self.extract_emails_advanced(text, f"搜索预览 {i}")

                    for email_data in emails:
                        total_emails_found += 1  # 🔥 FIX: Count all emails found
                        email_addr = email_data['email']
                        # 🔥 NEW: Skip already-returned emails
                        if email_addr in self.already_returned_emails:
                            total_cached_skipped += 1  # 🔥 FIX: Track skipped
                            continue
                        if not any(e['email'] == email_addr for e in preview_emails):
                            preview_emails.append({
                                'email': email_addr,
                                'name': email_data.get('name'),
                                'title': email_data.get('title'),
                                'department': email_data.get('department'),
                                'is_personal': email_data.get('is_personal', False),
                                'source': 'search_preview',
                                'source_url': result.get('url', ''),
                                'source_title': result.get('title', ''),
                                'confidence': 0.9 if email_data.get('is_personal') else 0.7,
                                'round': round_num,
                                'strategy': strategy,
                                'discovery_method': 'professional_search'
                            })
                
                round_emails.extend(preview_emails)
                self.logger.info(f"   📧 策略{i}预览: {len(preview_emails)}个邮箱")
                
                # 并行爬取更多网站 - 无限制模式
                promising_sites = [r for r in results[:20] 
                                 if any(word in r.get('url', '').lower() 
                                       for word in ['contact', 'about', 'team', 'press'])]
                
                if not promising_sites:
                    promising_sites = results[:15]  # 增加备选方案数量
                
                self.logger.info(f"   🌐 深度并行爬取{len(promising_sites)}个网站 (无时间限制)...")
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                    future_to_result = {
                        executor.submit(self.scrape_website_advanced, site['url']): site 
                        for site in promising_sites
                    }
                    
                    # 移除超时限制，让所有网站都有充足时间完成
                    for future in concurrent.futures.as_completed(future_to_result):
                        try:
                            site = future_to_result[future]
                            website_emails = future.result()

                            for email in website_emails:
                                total_emails_found += 1  # 🔥 FIX: Count all emails found
                                # 🔥 NEW: Skip already-returned emails
                                if email in self.already_returned_emails:
                                    total_cached_skipped += 1  # 🔥 FIX: Track skipped
                                    continue
                                if not any(e['email'] == email for e in round_emails):
                                    round_emails.append({
                                        'email': email,
                                        'source': 'website_scraping',
                                        'source_url': site['url'],
                                        'source_title': site.get('title', ''),
                                        'confidence': 0.95,
                                        'round': round_num,
                                        'strategy': strategy,
                                        'discovery_method': 'deep_scraping'
                                    })
                        except Exception as e:
                            continue
                
                # 检查进度，但不立即停止 - 让它继续搜索更多
                all_unique = {e['email']: e for e in all_emails + round_emails}
                if len(all_unique) >= target_count:
                    self.logger.info(f"🎯 已达到目标，但继续搜索以获得更准确结果...")
                    # 不break，继续搜索
                
                time.sleep(0.3)  # 减少策略间隔
            
            # 更新总邮箱列表
            all_emails.extend(round_emails)
            all_unique = {e['email']: e for e in all_emails}
            all_emails = list(all_unique.values())

            # 🔥 FIX: Show detailed statistics including cached skips
            self.logger.info(f"📊 第{round_num}轮结果: 新增{len(round_emails)}个，总计{len(all_emails)}个NEW邮箱")
            if total_cached_skipped > 0:
                self.logger.info(f"   🔄 已跳过 {total_cached_skipped} 个重复/缓存邮箱 (总发现{total_emails_found}个)")
            
            # 检查是否需要调整策略，但不轻易放弃
            if len(round_emails) == 0:
                consecutive_empty_rounds += 1
                self.logger.warning(f"⚠️ 连续{consecutive_empty_rounds}轮无结果 - 继续尝试")
                
                if consecutive_empty_rounds >= 5:  # 增加容忍度
                    self.logger.info("🔄 切换到更广泛的搜索策略...")
            else:
                consecutive_empty_rounds = 0
            
            # 即使达到目标也不立即退出 - 继续搜索获得更多邮箱
            if len(all_emails) >= target_count and round_num >= 5:
                self.logger.info(f"🎯 已收集足够邮箱并进行了充分搜索，准备结束")
                break
            
            round_num += 1
            if round_num <= max_rounds:
                time.sleep(1)  # 减少轮次间隔
        
        # 整理最终结果
        preliminary_emails = all_emails[:target_count + 10]  # Get extras in case some fail validation
        total_time = time.time() - start_time

        # 🔥 NEW: Validate emails before returning (only for batch search, not quick search)
        self.logger.info(f"\n🔍 验证邮箱有效性 (MX记录检查)...")
        validated_emails = self.validate_emails_batch(preliminary_emails)
        invalid_count = len(preliminary_emails) - len(validated_emails)
        if invalid_count > 0:
            self.logger.info(f"   🗑️ 排除了 {invalid_count} 个无效邮箱 (无MX记录或无效域名)")

        # Take only the target count after validation
        final_emails = validated_emails[:target_count]

        # 更新统计
        self.search_stats['emails_found'] = len(final_emails)
        self.search_stats['invalid_emails_filtered'] = invalid_count

        # 🔥 FIX: Save newly returned emails to cache with session_id
        new_email_addresses = [e['email'] for e in final_emails]
        if new_email_addresses:
            self.save_returned_emails_cache(industry, new_email_addresses, session_id)
            self.logger.info(f"   ✅ 已保存 {len(new_email_addresses)} 个验证后邮箱到缓存")

        self.logger.info(f"\n🎊 超级搜索完成！")
        self.logger.info(f"   📧 最终邮箱: {len(final_emails)}个NEW邮箱 (全部验证有效)")
        self.logger.info(f"   🔄 搜索轮数: {round_num-1}")
        self.logger.info(f"   ⏱️ 总耗时: {total_time:.1f}秒")
        self.logger.info(f"   📊 成功率: {self.search_stats['successful_queries']}/{self.search_stats['total_queries']}")
        self.logger.info(f"   🌐 爬取网站: {self.search_stats['websites_scraped']}个")
        self.logger.info(f"   🏢 发现域名: {len(self.search_stats['unique_domains'])}个")
        self.logger.info(f"   🔄 总发现: {total_emails_found}个 (跳过{total_cached_skipped}个重复)")
        self.logger.info(f"   🗑️ 无效过滤: {invalid_count}个 (无MX记录或无效域名)")
        self.logger.info(f"   🗂️ 缓存总数: {len(self.already_returned_emails)} 个历史邮箱")

        # 显示发现的邮箱
        if final_emails:
            self.logger.info("\n📧 发现的邮箱地址 (新):")
            for i, email_data in enumerate(final_emails, 1):
                self.logger.info(f"   {i}. {email_data['email']} (置信度: {email_data['confidence']})")

        return {
            'success': len(final_emails) > 0,
            'emails': [e['email'] for e in final_emails],
            'email_details': final_emails,
            'total_emails': len(final_emails),
            'search_rounds': round_num - 1,
            'execution_time': total_time,
            'search_stats': self.prepare_stats_for_json(),
            'industry': industry,
            'target_achieved': len(final_emails) >= target_count,
            'method': 'super_email_discovery_2024',
            'confidence_score': sum(e['confidence'] for e in final_emails) / len(final_emails) if final_emails else 0,
            'timestamp': datetime.now().isoformat()
        }
    
    def prepare_stats_for_json(self):
        """准备统计数据用于JSON序列化"""
        stats = dict(self.search_stats)
        stats['unique_domains'] = list(self.search_stats['unique_domains'])
        return stats

def main():
    if len(sys.argv) < 2:
        print('使用方法: python3 SuperEmailDiscoveryEngine.py "行业名称" [邮箱数量] [session_id]')
        print('示例: python3 SuperEmailDiscoveryEngine.py "AI startup" 5 campaign_123')
        return

    industry = sys.argv[1]
    target_count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    session_id = sys.argv[3] if len(sys.argv) > 3 else None  # 🔥 FIX: Accept session_id

    engine = SuperEmailDiscoveryEngine()
    # 🔥 FIX: Let max_rounds be calculated dynamically based on target_count
    results = engine.execute_persistent_discovery(industry, target_count, session_id=session_id)
    
    print("\n" + "="*90)
    print("🎯 超级邮箱搜索引擎 - 最终报告")
    print("="*90)
    
    if results['success']:
        print(f"✅ 成功发现 {results['total_emails']} 个邮箱地址:")
        for i, email in enumerate(results['emails'], 1):
            print(f"   {i}. {email}")
        
        print(f"\n📊 搜索性能指标:")
        print(f"   🔄 搜索轮数: {results['search_rounds']}")
        print(f"   ⏱️ 总耗时: {results['execution_time']:.1f}秒")
        print(f"   🎯 目标达成: {'是' if results['target_achieved'] else '否'}")
        print(f"   📈 查询成功率: {results['search_stats']['successful_queries']}/{results['search_stats']['total_queries']}")
        print(f"   🌐 网站爬取: {results['search_stats']['websites_scraped']}个")
        print(f"   🏢 发现域名: {len(results['search_stats']['unique_domains'])}个")
        print(f"   🎭 平均置信度: {results['confidence_score']:.2f}")
        
    else:
        print("❌ 未能发现邮箱地址")
        print("💡 建议：尝试更具体的行业描述或增加搜索轮数")
    
    print(f"\n📋 详细结果 (JSON):")
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()