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
import socket
import dns.resolver
import smtplib
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

        # 🔥 NEW: Domain verification cache (to avoid re-checking same domains)
        self.domain_verification_cache = {}  # domain -> (has_mx, mx_host, is_catch_all)

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
    
    def extract_industry_and_audience(self, query):
        """智能提取行业和目标受众关键词"""
        query_lower = query.lower()

        # 行业分类关键词映射
        industry_keywords = {
            'technology': ['tech', 'software', 'saas', 'it', 'digital', 'cloud', 'ai', 'ml', 'data'],
            'healthcare': ['health', 'medical', 'hospital', 'clinic', 'pharma', 'biotech', 'wellness'],
            'finance': ['finance', 'bank', 'fintech', 'investment', 'insurance', 'accounting'],
            'retail': ['retail', 'store', 'shop', 'merchant', 'ecommerce', 'commerce'],
            'manufacturing': ['manufacturing', 'factory', 'industrial', 'production', 'supply'],
            'food': ['food', 'beverage', 'restaurant', 'culinary', 'nutrition', 'catering'],
            'education': ['education', 'school', 'university', 'training', 'learning', 'academy'],
            'real_estate': ['real estate', 'property', 'housing', 'construction', 'building'],
            'marketing': ['marketing', 'advertising', 'agency', 'branding', 'media'],
            'logistics': ['logistics', 'shipping', 'freight', 'transport', 'delivery', 'warehouse']
        }

        # 目标受众关键词映射
        audience_keywords = {
            'buyer': ['buyer', 'purchasing', 'procurement', 'sourcing'],
            'manager': ['manager', 'director', 'head', 'lead', 'supervisor'],
            'executive': ['ceo', 'cto', 'cfo', 'executive', 'president', 'vp', 'chief'],
            'owner': ['owner', 'founder', 'entrepreneur', 'principal'],
            'coordinator': ['coordinator', 'specialist', 'analyst', 'associate'],
            'farmer': ['farmer', 'agriculture', 'farm', 'grower', 'producer'],
            'retailer': ['retailer', 'merchant', 'vendor', 'dealer'],
            'distributor': ['distributor', 'wholesaler', 'supplier'],
            'developer': ['developer', 'engineer', 'programmer', 'architect'],
            'designer': ['designer', 'creative', 'artist', 'ux', 'ui']
        }

        # 检测行业
        detected_industries = []
        for industry, keywords in industry_keywords.items():
            if any(kw in query_lower for kw in keywords):
                detected_industries.append(industry)

        # 检测目标受众
        detected_audiences = []
        for audience, keywords in audience_keywords.items():
            if any(kw in query_lower for kw in keywords):
                detected_audiences.append(audience)

        return detected_industries, detected_audiences, query

    def generate_professional_search_strategies(self, industry, round_num=1):
        """生成基于2024年最佳实践的专业搜索策略 - 全行业通用"""
        self.logger.info(f"🧠 生成第{round_num}轮专业搜索策略 - {industry}")

        # 🔥 智能提取行业和受众
        industries, audiences, original_query = self.extract_industry_and_audience(industry)

        self.logger.info(f"   🎯 检测到的行业: {industries if industries else '通用'}")
        self.logger.info(f"   👥 检测到的受众: {audiences if audiences else '通用'}")

        # 基于研究的最有效搜索策略
        base_strategies = []

        # 如果有明确的行业+受众组合，生成高度针对性搜索
        if industries and audiences:
            industry_key = industries[0]
            audience_key = audiences[0]

            if round_num == 1:
                # 第一轮：最精准的职位+行业组合
                base_strategies = [
                    f'{audience_key} {industry_key} email',
                    f'{industry_key} {audience_key} contact',
                    f'{audience_key} email {industry_key}',
                    f'{industry_key} {audience_key} director email',
                    f'senior {audience_key} {industry_key} contact'
                ]
            elif round_num == 2:
                # 第二轮：组织层级搜索
                base_strategies = [
                    f'{industry_key} {audience_key} team email',
                    f'{audience_key} department {industry_key} contact',
                    f'{industry_key} {audience_key} lead email',
                    f'{audience_key} {industry_key} head contact',
                    f'{industry_key} {audience_key} manager email'
                ]
            elif round_num == 3:
                # 第三轮：地域+职位搜索
                base_strategies = [
                    f'{audience_key} {industry_key} USA email',
                    f'{industry_key} {audience_key} North America contact',
                    f'{audience_key} {industry_key} regional email',
                    f'{industry_key} {audience_key} national contact',
                    f'{audience_key} {industry_key} local email'
                ]
            else:
                # 其他轮次：多种组合
                base_strategies = [
                    f'{industry_key} {audience_key} professional email',
                    f'{audience_key} {industry_key} company contact',
                    f'{industry_key} {audience_key} business email',
                    f'{audience_key} role {industry_key} contact',
                    f'{industry_key} {audience_key} executive email'
                ]

        # 只有行业，没有明确受众
        elif industries:
            industry_key = industries[0]

            if round_num == 1:
                base_strategies = [
                    f'{industry_key} buyer email',
                    f'{industry_key} manager contact',
                    f'{industry_key} director email',
                    f'{industry_key} CEO contact',
                    f'{industry_key} executive email'
                ]
            elif round_num == 2:
                base_strategies = [
                    f'{industry_key} owner email',
                    f'{industry_key} founder contact',
                    f'{industry_key} partner email',
                    f'{industry_key} president contact',
                    f'{industry_key} VP email'
                ]
            elif round_num == 3:
                base_strategies = [
                    f'{industry_key} sales email',
                    f'{industry_key} marketing contact',
                    f'{industry_key} operations email',
                    f'{industry_key} procurement contact',
                    f'{industry_key} purchasing email'
                ]
            else:
                base_strategies = [
                    f'{industry_key} team email',
                    f'{industry_key} department contact',
                    f'{industry_key} specialist email',
                    f'{industry_key} coordinator contact',
                    f'{industry_key} analyst email'
                ]

        # 只有受众，没有明确行业
        elif audiences:
            audience_key = audiences[0]

            if round_num == 1:
                base_strategies = [
                    f'{audience_key} business email',
                    f'{audience_key} company contact',
                    f'{audience_key} corporate email',
                    f'{audience_key} enterprise contact',
                    f'{audience_key} professional email'
                ]
            elif round_num == 2:
                base_strategies = [
                    f'{audience_key} startup email',
                    f'{audience_key} SMB contact',
                    f'{audience_key} small business email',
                    f'{audience_key} mid-market contact',
                    f'{audience_key} organization email'
                ]
            else:
                base_strategies = [
                    f'{audience_key} consultant email',
                    f'{audience_key} advisor contact',
                    f'{audience_key} specialist email',
                    f'{audience_key} expert contact',
                    f'{audience_key} services email'
                ]

        # 通用搜索（没有检测到行业或受众）
        else:
            if round_num == 1:
                base_strategies = [
                    f'{industry} email contact',
                    f'{industry} CEO email',
                    f'{industry} founder contact',
                    f'{industry} business email',
                    f'{industry} company contact'
                ]
            elif round_num == 2:
                base_strategies = [
                    f'{industry} team email',
                    f'{industry} sales contact',
                    f'{industry} support email',
                    f'{industry} info contact',
                    f'{industry} director email'
                ]
            elif round_num == 3:
                base_strategies = [
                    f'{industry} manager email',
                    f'{industry} consultant contact',
                    f'{industry} specialist email',
                    f'{industry} expert contact',
                    f'{industry} advisor email'
                ]
            elif round_num == 4:
                base_strategies = [
                    f'{industry} startup email',
                    f'{industry} entrepreneur contact',
                    f'{industry} business owner email',
                    f'{industry} partner contact',
                    f'{industry} investor email'
                ]
            elif round_num == 5:
                base_strategies = [
                    f'{industry} marketing email',
                    f'{industry} operations contact',
                    f'{industry} product manager email',
                    f'{industry} customer success contact',
                    f'{industry} growth email'
                ]
            elif round_num % 3 == 0:
                base_strategies = [
                    f'{industry} North America email',
                    f'{industry} Europe contact',
                    f'{industry} Asia Pacific email',
                    f'{industry} global contact',
                    f'{industry} international email'
                ]
            elif round_num % 3 == 1:
                base_strategies = [
                    f'{industry} CTO email',
                    f'{industry} developer contact',
                    f'{industry} engineer email',
                    f'{industry} architect contact',
                    f'{industry} technical lead email'
                ]
            else:
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
                'sample@', 'demo@', 'fake@', 'null@', 'void@', 'placeholder@',
                'youremail@', 'your-email@', 'email@', 'mailto:',
            ]

            if any(pattern in email_lower for pattern in exclusions):
                excluded_count += 1
                continue

            # 🔥 NEW: Check for suspicious patterns (phone numbers in email addresses)
            # Pattern: xxx-xxx-xxxx or similar (indicates likely invalid email)
            if re.search(r'\d{3}[-.]?\d{3}[-.]?\d{4}', email):
                self.logger.debug(f"   🚫 可疑电话号码模式: {email}")
                excluded_count += 1
                continue

            # 🔥 NEW: Check local part length (too long = suspicious)
            local_part = email.split('@')[0]
            if len(local_part) > 40:  # Abnormally long local part
                self.logger.debug(f"   🚫 本地部分过长: {email}")
                excluded_count += 1
                continue

            # 步骤1：验证邮箱格式
            if not self.validate_email_format(email):
                excluded_count += 1
                continue

            # 🔥 NEW 步骤2：过滤通用/部门邮箱，只保留专业决策者邮箱
            is_prof, prof_reason = self.is_professional_email(email)
            if not is_prof:
                self.logger.info(f"   ⛔ 过滤非专业邮箱: {email} (原因: {prof_reason})")
                excluded_count += 1
                continue

            # 步骤3：综合验证邮箱可投递性（DNS MX + SMTP）
            is_deliverable, verification_info = self.verify_email_deliverability(email)
            if not is_deliverable:
                self.logger.warning(f"   ❌ 邮箱验证失败: {email} - {verification_info.get('reason')}")
                excluded_count += 1
                continue

            # 提取邮箱周围的上下文（姓名、职位、部门）
            context = self.extract_context_around_email(html_content, email) if html_content else {}

            # 计算置信度（基于验证状态）
            base_confidence = 0.9 if self.is_personal_email(email) else 0.7
            if verification_info.get('status') == 'catch_all':
                base_confidence += verification_info.get('confidence_penalty', -0.2)
            elif verification_info.get('status') == 'unverifiable':
                base_confidence -= 0.1

            valid_emails.append({
                'email': email,
                'is_personal': self.is_personal_email(email),
                'name': context.get('name'),
                'title': context.get('title'),
                'department': context.get('department'),
                'verification': verification_info,
                'confidence': base_confidence
            })

            domain = email.split('@')[1]
            self.search_stats['unique_domains'].add(domain)

            email_type = "个人" if self.is_personal_email(email) else "通用"
            verification_status = verification_info.get('status', 'unknown')
            self.logger.info(f"   ✅ 发现{email_type}邮箱: {email} [验证: {verification_status}] (来源: {source[:30]})")
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

    def is_professional_email(self, email):
        """
        Check if email is from a professional/decision-maker, not generic department email
        Returns: (is_professional, reason)
        """
        email_lower = email.lower()
        local_part = email_lower.split('@')[0]

        # Generic/department email patterns to REJECT
        generic_patterns = [
            'info', 'support', 'help', 'contact', 'admin', 'webmaster',
            'sales', 'marketing', 'hr', 'media', 'press', 'news',
            'customer', 'service', 'hello', 'team', 'general',
            'inquiry', 'enquiry', 'reception', 'office',
            'noreply', 'no-reply', 'donotreply',
            'abuse', 'postmaster', 'hostmaster',
            'careers', 'jobs', 'recruiting',
            'billing', 'accounts', 'finance',
            'legal', 'compliance', 'privacy',
            'customersupport', 'techsupport', 'itsupport'
        ]

        # Check if local part is exactly a generic pattern
        if local_part in generic_patterns:
            return False, f"generic_exact:{local_part}"

        # Check if local part starts with generic pattern
        for pattern in generic_patterns:
            if local_part.startswith(pattern + '.') or local_part.startswith(pattern + '-') or local_part.startswith(pattern + '_'):
                return False, f"generic_prefix:{pattern}"

        # Academic/EDU emails - be more selective
        domain = email_lower.split('@')[1]
        if domain.endswith('.edu') or domain.endswith('.ac.uk'):
            # Allow individual names like firstname.lastname@, but reject department emails
            if any(gen in local_part for gen in ['president', 'admin', 'it', 'help', 'media', 'office']):
                return False, "edu_department"
            # Require at least a dot or number (indicating personal email)
            if '.' not in local_part and not any(c.isdigit() for c in local_part):
                return False, "edu_no_personal_indicator"

        # Government emails - usually not B2B targets
        if domain.endswith('.gov'):
            return False, "government_email"

        # Must have personal indicators (firstname.lastname pattern is ideal)
        has_dot = '.' in local_part
        has_underscore = '_' in local_part
        has_number = any(c.isdigit() for c in local_part)

        # Ideal: firstname.lastname format
        if has_dot and len(local_part.split('.')) >= 2:
            parts = local_part.split('.')
            if all(len(p) >= 2 for p in parts):  # Each part at least 2 chars
                return True, "firstname_lastname_format"

        # Good: has personal indicators
        if has_dot or has_underscore or has_number:
            return True, "has_personal_indicator"

        # Acceptable: single word but at least 4 chars (could be name)
        if len(local_part) >= 4 and local_part.isalpha():
            return True, "single_name_acceptable"

        # Reject: too short or suspicious
        return False, "no_personal_indicator"

    def verify_mx_records(self, domain):
        """验证域名是否有有效的MX记录"""
        try:
            mx_records = dns.resolver.resolve(domain, 'MX')
            mx_hosts = [str(r.exchange).rstrip('.') for r in mx_records]
            if mx_hosts:
                self.logger.debug(f"   ✅ MX记录存在: {domain} -> {mx_hosts[0]}")
                return True, mx_hosts[0]
            return False, None
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            self.logger.warning(f"   ❌ 无MX记录: {domain}")
            return False, None
        except Exception as e:
            self.logger.debug(f"   ⚠️ MX查询失败: {domain} - {str(e)}")
            return False, None

    def verify_email_smtp(self, email, mx_host):
        """使用SMTP验证邮箱是否存在（无需发送邮件）"""
        try:
            # 设置超时
            smtp = smtplib.SMTP(timeout=15)
            smtp.set_debuglevel(0)  # 禁用调试输出
            smtp.connect(mx_host, 25)

            # 使用更可信的HELO域名
            smtp.helo(socket.getfqdn())

            # 使用更可信的发件人地址
            smtp.mail('postmaster@' + socket.getfqdn())

            code, message = smtp.rcpt(email)
            smtp.quit()

            # SMTP响应码：
            # 250 = 邮箱存在
            # 550 = 邮箱不存在（明确拒绝）
            # 551 = 用户不在此服务器
            # 553 = 邮箱名称不允许
            # 450/451/452 = 暂时无法验证
            if code == 250:
                self.logger.debug(f"   ✅ SMTP验证通过: {email}")
                return True, "valid"
            elif code in [450, 451, 452]:
                self.logger.debug(f"   ⚠️ SMTP暂时无法验证: {email} (code: {code})")
                return True, "unverifiable"
            elif code in [550, 551, 553]:
                self.logger.warning(f"   ❌ SMTP明确拒绝: {email} (code: {code})")
                return False, "invalid"
            else:
                self.logger.debug(f"   ⚠️ SMTP未知响应: {email} (code: {code})")
                return True, "unverifiable"
        except smtplib.SMTPServerDisconnected:
            self.logger.debug(f"   ⚠️ SMTP服务器断开: {email}")
            return True, "unverifiable"
        except smtplib.SMTPConnectError as e:
            self.logger.debug(f"   ⚠️ SMTP连接失败: {email} - {str(e)}")
            return True, "unverifiable"
        except socket.timeout:
            self.logger.debug(f"   ⚠️ SMTP超时: {email}")
            return True, "unverifiable"
        except Exception as e:
            self.logger.debug(f"   ⚠️ SMTP验证异常: {email} - {str(e)}")
            return True, "unverifiable"

    def is_catch_all_domain(self, domain, mx_host):
        """检测域名是否为catch-all（接受所有邮箱地址）"""
        try:
            # 测试一个肯定不存在的随机邮箱
            random_email = f"nonexistent{int(time.time())}@{domain}"
            smtp = smtplib.SMTP(timeout=10)
            smtp.connect(mx_host)
            smtp.helo('verification-bot.com')
            smtp.mail('verify@verification-bot.com')
            code, message = smtp.rcpt(random_email)
            smtp.quit()

            if code == 250:
                self.logger.info(f"   🔍 检测到catch-all域名: {domain}")
                return True
            return False
        except Exception as e:
            self.logger.debug(f"   ⚠️ Catch-all检测失败: {domain} - {str(e)}")
            return False  # 无法确定时，保守处理

    def verify_email_deliverability(self, email):
        """综合验证邮箱可投递性：格式+DNS MX+SMTP（带缓存优化）"""
        # 步骤1：基本格式验证
        if not self.validate_email_format(email):
            self.logger.debug(f"   ❌ 格式无效: {email}")
            return False, {"reason": "invalid_format"}

        domain = email.split('@')[1]

        # 步骤2：检查域名缓存
        if domain in self.domain_verification_cache:
            cache = self.domain_verification_cache[domain]
            has_mx, mx_host, is_catch_all = cache
            self.logger.debug(f"   📦 使用缓存: {domain} (MX: {has_mx}, Catch-all: {is_catch_all})")
        else:
            # DNS MX记录验证
            has_mx, mx_host = self.verify_mx_records(domain)
            if not has_mx:
                self.logger.debug(f"   ❌ 无MX记录: {email}")
                self.domain_verification_cache[domain] = (False, None, False)
                return False, {"reason": "no_mx_record", "domain": domain}

            # 检测catch-all域名
            is_catch_all = self.is_catch_all_domain(domain, mx_host)

            # 缓存域名验证结果
            self.domain_verification_cache[domain] = (has_mx, mx_host, is_catch_all)

        # 步骤3：SMTP验证（如果不是catch-all）
        if not is_catch_all:
            is_valid, status = self.verify_email_smtp(email, mx_host)
            if not is_valid:
                self.logger.debug(f"   ❌ SMTP验证失败: {email}")
                return False, {"reason": "smtp_rejected", "status": status}

            self.logger.info(f"   ✅ 邮箱验证通过: {email} (status: {status})")
            return True, {"status": status, "mx_host": mx_host}
        else:
            # Catch-all域名：接受但标记低置信度
            self.logger.info(f"   ⚠️ Catch-all域名: {email} (低置信度)")
            return True, {"status": "catch_all", "mx_host": mx_host, "confidence_penalty": -0.2}
    
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

                            for email_data in website_emails:
                                total_emails_found += 1  # 🔥 FIX: Count all emails found
                                email_addr = email_data['email']
                                # 🔥 NEW: Skip already-returned emails
                                if email_addr in self.already_returned_emails:
                                    total_cached_skipped += 1  # 🔥 FIX: Track skipped
                                    continue
                                if not any(e['email'] == email_addr for e in round_emails):
                                    round_emails.append({
                                        'email': email_addr,
                                        'name': email_data.get('name'),
                                        'title': email_data.get('title'),
                                        'department': email_data.get('department'),
                                        'is_personal': email_data.get('is_personal', False),
                                        'source': 'website_scraping',
                                        'source_url': site['url'],
                                        'source_title': site.get('title', ''),
                                        'confidence': 0.95 if email_data.get('is_personal') else 0.8,
                                        'round': round_num,
                                        'strategy': strategy,
                                        'discovery_method': 'deep_scraping'
                                    })
                        except Exception as ex:
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
        final_emails = all_emails[:target_count]
        total_time = time.time() - start_time

        # 更新统计
        self.search_stats['emails_found'] = len(final_emails)

        # 🔥 FIX: Save newly returned emails to cache with session_id
        new_email_addresses = [e['email'] for e in final_emails]
        if new_email_addresses:
            self.save_returned_emails_cache(industry, new_email_addresses, session_id)
            self.logger.info(f"   ✅ 已保存 {len(new_email_addresses)} 个新邮箱到缓存")

        self.logger.info(f"\n🎊 超级搜索完成！")
        self.logger.info(f"   📧 最终邮箱: {len(final_emails)}个NEW邮箱 (全部为新发现)")
        self.logger.info(f"   🔄 搜索轮数: {round_num-1}")
        self.logger.info(f"   ⏱️ 总耗时: {total_time:.1f}秒")
        self.logger.info(f"   📊 成功率: {self.search_stats['successful_queries']}/{self.search_stats['total_queries']}")
        self.logger.info(f"   🌐 爬取网站: {self.search_stats['websites_scraped']}个")
        self.logger.info(f"   🏢 发现域名: {len(self.search_stats['unique_domains'])}个")
        self.logger.info(f"   🔄 总发现: {total_emails_found}个 (跳过{total_cached_skipped}个重复)")
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