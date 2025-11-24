#!/usr/bin/env python3
"""
测试邮箱验证系统
"""

import sys
sys.path.insert(0, '/Users/James/Desktop/agent')

from SuperEmailDiscoveryEngine import SuperEmailDiscoveryEngine

# 创建引擎实例
engine = SuperEmailDiscoveryEngine()

# 测试邮箱列表
test_emails = [
    "test@example.com",  # 应该失败（示例域名）
    "info@gmail.com",  # 应该通过（Gmail有MX记录）
    "nonexistent12345@gmail.com",  # 可能失败（Gmail不是catch-all）
    "Emami-Naeini408-617-4525sc-controls@scsolutions.com",  # 你遇到的问题邮箱
    "support@google.com",  # 应该通过
]

print("="*80)
print("🔍 邮箱验证测试")
print("="*80)

for email in test_emails:
    print(f"\n测试: {email}")
    is_valid, info = engine.verify_email_deliverability(email)
    print(f"结果: {'✅ 有效' if is_valid else '❌ 无效'}")
    print(f"详情: {info}")
    print("-"*80)
