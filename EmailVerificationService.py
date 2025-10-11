#!/usr/bin/env python3
"""
Email Verification Service
使用SMTP测试邮箱地址的有效性
- 发送测试邮件验证邮箱是否存在
- 只有能成功发送的邮箱才被认为是有效的
- 无超时限制，确保充分验证
"""

import smtplib
import sys
import json
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import concurrent.futures
import threading

class EmailVerificationService:
    def __init__(self):
        # SMTP配置 - 仅用于验证目的
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587
        self.smtp_email = 'luzgool001@gmail.com'
        self.smtp_password = 'bnms xwhf deks zdkt'  # App密码
        
        # 验证统计
        self.verification_stats = {
            'total_tested': 0,
            'valid_emails': 0,
            'invalid_emails': 0,
            'failed_tests': 0
        }
        
        print("📧 Email Verification Service 初始化")
        print(f"   📤 SMTP服务器: {self.smtp_server}")
        print(f"   👤 发送邮箱: {self.smtp_email}")
        print("   🎯 目的: 邮箱地址验证 (仅验证用途)")
        print("   ⏰ 无超时限制: 充分验证每个邮箱")
    
    def create_test_email(self, recipient_email):
        """创建测试邮件内容"""
        msg = MIMEMultipart()
        msg['From'] = self.smtp_email
        msg['To'] = recipient_email
        msg['Subject'] = "Email Address Verification - Test Message"
        
        # 测试邮件正文
        body = """
        Dear Recipient,

        This is an automated email verification test message.
        
        We are verifying that this email address is valid and can receive messages.
        This is purely for verification purposes and no further action is required.
        
        If you received this message, it means your email address is working correctly.
        
        Best regards,
        Email Verification System
        
        ---
        This is an automated verification email. Please do not reply.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        return msg
    
    def verify_single_email(self, email_address):
        """验证单个邮箱地址"""
        try:
            print(f"   📧 验证邮箱: {email_address}")
            
            # 创建测试邮件
            test_email = self.create_test_email(email_address)
            
            # 连接SMTP服务器
            print(f"      🔌 连接SMTP服务器...")
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()  # 启用安全传输
            
            # 登录
            print(f"      🔐 SMTP登录...")
            server.login(self.smtp_email, self.smtp_password)
            
            # 发送测试邮件
            print(f"      📤 发送测试邮件...")
            text = test_email.as_string()
            server.sendmail(self.smtp_email, email_address, text)
            
            # 关闭连接
            server.quit()
            
            print(f"      ✅ {email_address} 验证成功 - 邮箱有效")
            
            return {
                'email': email_address,
                'valid': True,
                'status': 'verified',
                'message': 'Test email sent successfully',
                'verified_at': datetime.now().isoformat()
            }
            
        except smtplib.SMTPRecipientsRefused as e:
            print(f"      ❌ {email_address} 收件人被拒绝 - 邮箱可能不存在")
            return {
                'email': email_address,
                'valid': False,
                'status': 'recipient_refused',
                'message': 'Recipient email address rejected',
                'error': str(e),
                'verified_at': datetime.now().isoformat()
            }
            
        except smtplib.SMTPServerDisconnected as e:
            print(f"      ❌ {email_address} SMTP服务器断开连接")
            return {
                'email': email_address,
                'valid': False,
                'status': 'server_disconnected',
                'message': 'SMTP server disconnected',
                'error': str(e),
                'verified_at': datetime.now().isoformat()
            }
            
        except smtplib.SMTPException as e:
            print(f"      ❌ {email_address} SMTP错误: {str(e)}")
            return {
                'email': email_address,
                'valid': False,
                'status': 'smtp_error',
                'message': 'SMTP error occurred',
                'error': str(e),
                'verified_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"      ❌ {email_address} 验证失败: {str(e)}")
            return {
                'email': email_address,
                'valid': False,
                'status': 'verification_failed',
                'message': 'Email verification failed',
                'error': str(e),
                'verified_at': datetime.now().isoformat()
            }
    
    def verify_email_batch(self, email_list, max_concurrent=3):
        """批量验证邮箱地址"""
        try:
            print(f"📧 开始批量邮箱验证: {len(email_list)}个邮箱")
            print(f"🔄 并发验证数: {max_concurrent}")
            print("=" * 60)
            
            verification_results = []
            
            # 使用线程池进行并发验证（限制并发数避免被SMTP服务器限制）
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_concurrent) as executor:
                # 提交所有验证任务
                future_to_email = {
                    executor.submit(self.verify_single_email, email): email 
                    for email in email_list
                }
                
                # 收集结果（无超时限制）
                for future in concurrent.futures.as_completed(future_to_email):
                    email = future_to_email[future]
                    try:
                        result = future.result()  # 无超时限制
                        verification_results.append(result)
                        
                        # 更新统计
                        self.verification_stats['total_tested'] += 1
                        if result['valid']:
                            self.verification_stats['valid_emails'] += 1
                        else:
                            self.verification_stats['invalid_emails'] += 1
                            
                        # 验证间隔（避免被SMTP服务器限制）
                        time.sleep(1)
                        
                    except Exception as e:
                        print(f"   ❌ {email} 验证任务失败: {str(e)}")
                        self.verification_stats['failed_tests'] += 1
                        verification_results.append({
                            'email': email,
                            'valid': False,
                            'status': 'task_failed',
                            'message': 'Verification task failed',
                            'error': str(e),
                            'verified_at': datetime.now().isoformat()
                        })
            
            # 分离有效和无效邮箱
            valid_emails = [r for r in verification_results if r['valid']]
            invalid_emails = [r for r in verification_results if not r['valid']]
            
            print(f"\\n🎉 邮箱验证完成!")
            print(f"   📧 总测试数: {self.verification_stats['total_tested']}")
            print(f"   ✅ 有效邮箱: {self.verification_stats['valid_emails']}")
            print(f"   ❌ 无效邮箱: {self.verification_stats['invalid_emails']}")
            print(f"   🔧 验证失败: {self.verification_stats['failed_tests']}")
            
            return {
                'success': True,
                'total_tested': len(email_list),
                'valid_emails': valid_emails,
                'invalid_emails': invalid_emails,
                'verification_stats': self.verification_stats,
                'verification_method': 'smtp_test_send',
                'smtp_server': self.smtp_server,
                'verified_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ 批量验证失败: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'total_tested': len(email_list),
                'verification_stats': self.verification_stats
            }
    
    def test_smtp_connection(self):
        """测试SMTP连接"""
        try:
            print("🔌 测试SMTP连接...")
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_email, self.smtp_password)
            server.quit()
            print("✅ SMTP连接测试成功")
            return True
        except Exception as e:
            print(f"❌ SMTP连接测试失败: {str(e)}")
            return False

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '请提供邮箱地址列表 (JSON格式)'}))
        return
    
    try:
        # 解析邮箱列表
        emails_json = sys.argv[1]
        email_list = json.loads(emails_json)
        
        if not isinstance(email_list, list):
            print(json.dumps({'error': '邮箱列表必须是数组格式'}))
            return
        
        # 初始化验证服务
        verifier = EmailVerificationService()
        
        # 测试SMTP连接
        if not verifier.test_smtp_connection():
            print(json.dumps({
                'success': False,
                'error': 'SMTP connection test failed'
            }))
            return
        
        # 执行批量验证
        results = verifier.verify_email_batch(email_list)
        
        # 输出结果
        print("\\n" + "=" * 60)
        print("📧 Email Verification Service 结果报告")
        print("=" * 60)
        
        if results['success']:
            print("✅ 有效邮箱:")
            for email_result in results['valid_emails']:
                print(f"   📧 {email_result['email']} - {email_result['status']}")
            
            print("\\n❌ 无效邮箱:")
            for email_result in results['invalid_emails']:
                print(f"   📧 {email_result['email']} - {email_result['status']}")
            
            print(f"\\n📊 验证统计:")
            stats = results['verification_stats']
            print(f"   📧 总数: {stats['total_tested']}")
            print(f"   ✅ 有效: {stats['valid_emails']}")
            print(f"   ❌ 无效: {stats['invalid_emails']}")
            print(f"   🔧 失败: {stats['failed_tests']}")
        else:
            print(f"❌ 验证失败: {results.get('error', 'Unknown error')}")
        
        # 输出JSON结果（API调用使用）
        print(json.dumps(results, ensure_ascii=False))
        
    except json.JSONDecodeError:
        print(json.dumps({'error': '邮箱列表JSON格式错误'}))
    except Exception as e:
        print(json.dumps({'error': f'验证服务错误: {str(e)}'}))

if __name__ == "__main__":
    main()