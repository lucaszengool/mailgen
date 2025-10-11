import React, { useState } from 'react';
import { 
  Mail, CheckCircle, ChevronRight, ChevronLeft, ChevronDown,
  Users, TrendingUp, Shield, Zap, Star, Heart
} from 'lucide-react';

const EmailTemplateSelection = ({ onNext, onBack, initialData = {} }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(initialData.emailTemplate || '');
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  const emailTemplates = [
    {
      id: 'partnership_outreach',
      name: 'Premium Partnership Outreach',
      category: 'Strategic Partnership',
      icon: Users,
      color: 'blue',
      conversionRate: '24%',
      responseTime: '1-2 days',
      bestFor: 'Partnership & Brand Growth',
      features: ['AI Personalization', 'Premium Design', '2025 Trends', 'Industry Targeting'],
      preview: {
        subject: 'Sarah Chen: Strategic Partnership with TechCorp',
        previewText: 'Our AI solutions have helped similar companies achieve 45% operational efficiency gains...',
        body: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
            <!-- Premium Header with Gradient -->
            <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="background: transparent; backdrop-filter: blur(10px); border-radius: 50px; padding: 15px 25px; display: inline-block; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">🤝 Strategic Partnership Opportunity</h1>
              </div>
              <p style="color: transparent; margin: 0; font-size: 16px;">Exclusive collaboration proposal for TechCorp</p>
            </div>
            
            <!-- Premium Content Body -->
            <div style="background: white; padding: 40px; border: 1px solid #E5E7EB;">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <svg style="width: 48px; height: 48px; margin-right: 15px;" viewBox="0 0 24 24" fill="#4F46E5">
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                </svg>
                <div>
                  <h2 style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">Hi Sarah Chen,</h2>
                  <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">VP of Strategic Partnerships at TechCorp</p>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                I've been following TechCorp's innovative approach to AI automation, particularly your recent expansion into enterprise solutions. 
                The strategic alignment between our companies presents an exceptional opportunity for mutual growth.
              </p>
              
              <!-- Premium Stats Section -->
              <div style="background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1F2937; margin: 0 0 20px 0; font-size: 16px; font-weight: 600;">🎯 Partnership Impact Projection:</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
                  <div>
                    <div style="color: #4F46E5; font-size: 24px; font-weight: 700;">45%</div>
                    <div style="color: #6B7280; font-size: 12px;">Efficiency Gain</div>
                  </div>
                  <div>
                    <div style="color: #059669; font-size: 24px; font-weight: 700;">$2.3M</div>
                    <div style="color: #6B7280; font-size: 12px;">Revenue Potential</div>
                  </div>
                  <div>
                    <div style="color: #DC2626; font-size: 24px; font-weight: 700;">67%</div>
                    <div style="color: #6B7280; font-size: 12px;">Market Expansion</div>
                  </div>
                </div>
              </div>
              
              <!-- Premium CTA -->
              <div style="text-align: center; margin: 35px 0;">
                <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 3px; border-radius: 50px; display: inline-block;">
                  <a href="#" style="background: white; color: #4F46E5; padding: 18px 35px; border-radius: 47px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                    Schedule Partnership Discussion
                  </a>
                </div>
              </div>
              
              <!-- Premium Signature -->
              <div style="border-top: 1px solid #E5E7EB; padding-top: 25px; display: flex; align-items: center;">
                <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                  <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="white">
                    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                  </svg>
                </div>
                <div>
                  <p style="color: #4F46E5; font-weight: 600; margin: 0; font-size: 16px;">James Wilson</p>
                  <p style="color: #6B7280; margin: 5px 0 0 0; font-size: 14px;">FruitAI Partnership Development</p>
                  <p style="color: #7C3AED; margin: 5px 0 0 0; font-size: 14px;">james@fruitai.org | https://fruitai.org</p>
                </div>
              </div>
            </div>
          </div>
        `
      }
    },
    {
      id: 'value_demonstration',
      name: 'Premium Value Demo',
      category: 'Product Showcase',
      icon: TrendingUp,
      color: 'green',
      conversionRate: '28%',
      responseTime: '1-2 days',
      bestFor: 'Sales & Product Demo',
      features: ['Live Metrics', 'AI-Generated ROI', 'Interactive Demo', 'Case Studies'],
      preview: {
        subject: 'Increase your revenue by 35% in Q1 2024',
        previewText: 'DataCorp achieved 28% conversion rate in 3 months. Here\'s how you can too...',
        body: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
            <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">💰 Revenue Growth Opportunity</h1>
              <p style="color: transparent; margin: 10px 0 0 0;">Proven Results for Companies Like Yours</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hello {{firstName}},</p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                I noticed your company is focused on digital transformation and scaling operations. 
                Many growing tech companies struggle with inefficient sales processes and missed opportunities.
              </p>
              
              <div style="background: linear-gradient(135deg, #f6f9fc 0%, #e9f7ef 100%); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #10b981; margin: 0 0 15px 0;">🎯 Our AI-Powered Results:</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 32px; color: #10b981; font-weight: bold;">35%</div>
                    <div style="color: #6b7280; font-size: 14px;">More Leads</div>
                  </div>
                  <div>
                    <div style="font-size: 32px; color: #10b981; font-weight: bold;">50%</div>
                    <div style="color: #6b7280; font-size: 14px;">Faster Sales</div>
                  </div>
                  <div>
                    <div style="font-size: 32px; color: #10b981; font-weight: bold;">$2.3M</div>
                    <div style="color: #6b7280; font-size: 14px;">Avg. Revenue ↑</div>
                  </div>
                </div>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-style: italic;">
                  "Within 3 months, we went from 12% to 28% conversion rate. The ROI was immediate and substantial."
                  <br><strong>- CEO, DataCorp</strong>
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                I have a <strong>5-minute case study video</strong> showing exactly how we achieved these results.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                  Watch 5-Min Case Study
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                <strong>{{senderName}}</strong><br>
                Senior Sales Consultant<br>
                Revenue Growth Systems
              </p>
            </div>
          </div>
        `
      }
    },
    {
      id: 'cold_outreach',
      name: 'Premium Cold Outreach',
      category: 'First Contact',
      icon: Shield,
      color: 'purple',
      conversionRate: '22%',
      responseTime: '1-3 days',
      bestFor: 'Lead Generation & Initial Contact',
      features: ['Smart Opening Lines', 'Company Research', 'Pain Point Detection', 'Warm Introduction'],
      preview: {
        subject: 'Strategic alliance: TechFlow + {{companyName}}',
        previewText: 'Our partnership with PaymentPro resulted in $4.2M additional revenue...',
        body: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
            <div style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🏆 Strategic Partnership Opportunity</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Dear {{firstName}},</p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                I've been following your company's remarkable growth in the fintech space and was particularly 
                impressed by your recent <strong>Series B funding</strong> and expansion into European markets.
              </p>
              
              <div style="background: #faf5ff; border: 2px solid #e9d5ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #7c3aed; margin: 0 0 15px 0;">🎯 Partnership Opportunities:</h3>
                <ul style="color: #6b21a8; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Co-marketing to our combined <strong>50,000+ customers</strong></li>
                  <li style="margin-bottom: 10px;">Technical integration between platforms</li>
                  <li style="margin-bottom: 10px;">Joint enterprise sales initiatives</li>
                  <li>Shared thought leadership & conferences</li>
                </ul>
              </div>
              
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; text-align: center; font-weight: 600;">
                  💰 Our recent partnership with PaymentPro: <strong>$4.2M mutual revenue in 8 months</strong>
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                I'd love to set up a 20-minute call to discuss how we could create similar mutual value.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                  Schedule Partnership Discussion
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                <strong>{{senderName}}</strong><br>
                VP of Strategic Partnerships<br>
                TechFlow Solutions
              </p>
            </div>
          </div>
        `
      }
    },
    {
      id: 'problem_solution',
      name: 'Problem-Solution Fit',
      category: 'Solutions Focus',
      icon: Zap,
      color: 'orange',
      conversionRate: '26%',
      responseTime: '1-2 days',
      bestFor: 'Sales & Solution Selling',
      features: ['AI Problem Detection', 'Custom Solutions', 'ROI Calculator', 'Quick Wins'],
      preview: {
        subject: 'Scaling challenges solved in 30 days',
        previewText: 'Congrats on your $15M Series A! Here\'s how to handle the growth challenges...',
        body: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
            <div style="background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Scale Without the Growing Pains</h1>
              <p style="color: transparent; margin: 10px 0 0 0;">30-Day Transformation Program</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #92400e; margin: 0; font-weight: 600;">
                  🎉 Congratulations on your $15M Series A funding!
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                I saw the announcement on TechCrunch and was impressed by your vision for transforming the e-commerce landscape.
              </p>
              
              <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #ea580c; margin: 0 0 15px 0;">📅 Our 30-Day Transformation:</h3>
                
                <div style="margin-bottom: 15px;">
                  <div style="color: #ea580c; font-weight: 600;">Week 1-2: Smart Automation</div>
                  <ul style="color: #9a3412; margin: 5px 0 0 20px; padding: 0;">
                    <li>AI-powered customer service</li>
                    <li>Automated operational tasks</li>
                  </ul>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <div style="color: #ea580c; font-weight: 600;">Week 2-3: Process Optimization</div>
                  <ul style="color: #9a3412; margin: 5px 0 0 20px; padding: 0;">
                    <li>Streamline bottlenecks</li>
                    <li>Predictive analytics</li>
                  </ul>
                </div>
                
                <div>
                  <div style="color: #ea580c; font-weight: 600;">Week 3-4: Performance Monitoring</div>
                  <ul style="color: #9a3412; margin: 5px 0 0 20px; padding: 0;">
                    <li>Real-time KPI dashboards</li>
                    <li>Automated reporting</li>
                  </ul>
                </div>
              </div>
              
              <div style="background: #dcfce7; border: 1px solid #86efac; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #14532d; margin: 0;">
                  <strong>✅ Case Study:</strong> ShopTech reduced support tickets by 70% and increased satisfaction 
                  from 3.2 to 4.8 stars in just 30 days.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                  Get Your 30-Day Plan
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                <strong>{{senderName}}</strong><br>
                COO & Scaling Specialist<br>
                Growth Accelerator Inc.
              </p>
            </div>
          </div>
        `
      }
    },
    {
      id: 'follow_up',
      name: 'Premium Follow-Up',
      category: 'Relationship Building',
      icon: Star,
      color: 'yellow',
      conversionRate: '31%',
      responseTime: '1-2 days',
      bestFor: 'Follow-up & Nurturing',
      features: ['Previous Context', 'Value Add', 'Persistence Strategy', 'Next Steps'],
      preview: {
        subject: 'How CloudNinja achieved 300% growth in 6 months',
        previewText: 'From $50K to $200K MRR - complete case study with exact strategies...',
        body: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
            <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⭐ Success Story Inside</h1>
              <p style="color: transparent; margin: 10px 0 0 0;">300% Growth Blueprint</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hello {{firstName}},</p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                CloudNinja, a SaaS company similar to yours in the B2B automation space, recently achieved 
                <strong>300% revenue growth</strong> in just 6 months using our customer acquisition system.
              </p>
              
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 15px 0; text-align: center;">📊 CloudNinja's Transformation:</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="text-align: center;">
                    <div style="color: #92400e; font-size: 12px;">BEFORE</div>
                    <div style="color: #f59e0b; font-size: 24px; font-weight: bold;">$50K</div>
                    <div style="color: #92400e; font-size: 12px;">Monthly Revenue</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="color: #92400e; font-size: 12px;">AFTER</div>
                    <div style="color: #f59e0b; font-size: 24px; font-weight: bold;">$200K</div>
                    <div style="color: #92400e; font-size: 12px;">Monthly Revenue</div>
                  </div>
                </div>
              </div>
              
              <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="color: #374151; margin: 0; font-style: italic;">
                  "Before working with GrowthEngine, we were stuck at $50K MRR for 8 months. Their system 
                  completely transformed our sales process."
                </p>
                <p style="color: #6b7280; margin: 10px 0 0 0; font-weight: 600;">
                  - Sarah Chen, CEO of CloudNinja
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                  Get The Full Case Study
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                <strong>{{senderName}}</strong><br>
                Senior Growth Strategist<br>
                GrowthEngine Solutions
              </p>
            </div>
          </div>
        `
      }
    },
    {
      id: 'initial_contact',
      name: 'Premium Initial Contact',
      category: 'First Impression',
      icon: Heart,
      color: 'pink',
      conversionRate: '29%',
      responseTime: '1-2 days',
      bestFor: 'First Contact & Introduction',
      features: ['Personal Research', 'Industry Insights', 'Warm Introduction', 'Connection Building'],
      preview: {
        subject: 'Your AI ethics insights resonated with me',
        previewText: 'Your article on "Responsible AI Implementation" aligns perfectly with our mission...',
        body: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
            <div style="background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💡 Great Minds Think Alike</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                I've been following your thoughtful work at DataVision, particularly your recent article on 
                <strong>"Responsible AI Implementation in Enterprise Settings."</strong>
              </p>
              
              <div style="background: #fdf2f8; border-left: 4px solid #ec4899; padding: 15px; margin: 20px 0;">
                <p style="color: #831843; margin: 0; font-style: italic;">
                  "Ethical AI is a competitive advantage, not a constraint"
                </p>
                <p style="color: #9f1239; margin: 5px 0 0 0; font-size: 14px;">
                  - This perspective from your article really struck me
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                I'm VP of Product Strategy at EthicalAI Labs, where we help Fortune 500 companies implement 
                AI solutions that are both powerful and responsible.
              </p>
              
              <div style="background: white; border: 1px solid #f472b6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h4 style="color: #ec4899; margin: 0 0 15px 0;">Recent Client Results:</h4>
                <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Microsoft: $2.1M compliance savings + 23% accuracy improvement</li>
                  <li style="margin-bottom: 8px;">Goldman Sachs: 89% bias reduction</li>
                  <li>Spotify: 45% trust score improvement</li>
                </ul>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Would you be interested in connecting over coffee (I'm in Austin too!) or a quick video call 
                to discuss scalable AI ethics frameworks?
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                  Let's Connect
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-top: 20px;">
                Looking forward to connecting,<br>
                <strong>{{senderName}}</strong><br>
                VP Product Strategy, EthicalAI Labs<br>
                LinkedIn: /in/ai-ethics-advocate
              </p>
            </div>
          </div>
        `
      }
    }
  ];

  const handleTemplateSelect = (templateId) => {
    // If clicking the same template, toggle between selected and expanded
    if (selectedTemplate === templateId) {
      setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
    } else {
      // If clicking a different template, select and expand it
      setSelectedTemplate(templateId);
      setExpandedTemplate(templateId);
    }
  };

  const handleNext = () => {
    if (!selectedTemplate) return;
    
    const selectedTemplateData = emailTemplates.find(template => template.id === selectedTemplate);
    onNext({
      emailTemplate: selectedTemplate,
      templateData: selectedTemplateData
    });
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      blue: isSelected 
        ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20' 
        : 'border-gray-700 hover:border-blue-400',
      green: isSelected 
        ? 'border-green-500 bg-green-500/10 shadow-green-500/20' 
        : 'border-gray-700 hover:border-green-400',
      purple: isSelected 
        ? 'border-purple-500 bg-purple-500/10 shadow-purple-500/20' 
        : 'border-gray-700 hover:border-purple-400',
      orange: isSelected 
        ? 'border-orange-500 bg-orange-500/10 shadow-orange-500/20' 
        : 'border-gray-700 hover:border-orange-400',
      pink: isSelected 
        ? 'border-pink-500 bg-pink-500/10 shadow-pink-500/20' 
        : 'border-gray-700 hover:border-pink-400',
      yellow: isSelected 
        ? 'border-yellow-500 bg-yellow-500/10 shadow-yellow-500/20' 
        : 'border-gray-700 hover:border-yellow-400'
    };
    return colors[color];
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-400',
      green: 'text-green-400',
      purple: 'text-purple-400',
      orange: 'text-orange-400',
      pink: 'text-pink-400',
      yellow: 'text-yellow-400'
    };
    return colors[color];
  };

  const getCategoryBg = (color) => {
    const colors = {
      blue: 'bg-blue-50',
      green: 'bg-green-50',
      purple: 'bg-purple-50',
      orange: 'bg-orange-50',
      pink: 'bg-pink-50',
      yellow: 'bg-yellow-50'
    };
    return colors[color];
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Progress Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-6">
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-4">Setup Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-green-600">Campaign Goal</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-base font-bold text-blue-600">Email Templates</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              <span className="text-base font-medium text-gray-500">Target Audience</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              <span className="text-base font-medium text-gray-500">SMTP Configuration</span>
            </div>
          </div>
        </div>

        {/* AI Customization Note */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 mb-2 text-base">📝 AI Customization</h3>
          <p className="text-base text-gray-600">
            These are sample templates. Our AI will automatically customize each email with:
            company research, recent news, industry insights, and personalized metrics for every prospect.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">Choose Your Email Template</h1>
            </div>
            <p className="text-lg text-gray-600">
              Select the email template that best fits your campaign goal. Each template will be 
              personalized for every prospect using AI.
            </p>
          </div>
        </div>

        {/* Template Selection Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {emailTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.id;
                const isExpanded = expandedTemplate === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`
                      relative rounded-lg border-2 cursor-pointer transition-all duration-300
                      ${getColorClasses(template.color, isSelected)}
                      ${isSelected ? 'shadow-xl' : 'hover:shadow-lg'}
                      ${isExpanded ? 'col-span-2' : ''}
                    `}
                  >
                    {/* Card Header - Always Visible - Larger */}
                    <div 
                      className="p-6 hover:bg-gray-50 rounded-t-lg"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${getCategoryBg(template.color)}`}>
                            <Icon className={`w-8 h-8 ${getIconColor(template.color)}`} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {template.name}
                            </h3>
                            <p className="text-lg font-semibold text-gray-600">{template.category}</p>
                          </div>
                        </div>

                        {/* Selection Indicator - Larger */}
                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            {isExpanded && (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          </div>
                        )}
                        {!isSelected && (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Template Stats - Larger */}
                      <div className="mt-4 flex items-center space-x-4 text-base text-gray-600">
                        <span className={`px-3 py-1.5 rounded-full bg-gray-100 ${getIconColor(template.color)} font-bold`}>
                          {template.conversionRate} response
                        </span>
                        <span className="font-bold text-lg">{template.bestFor}</span>
                      </div>
                    </div>

                    {/* Expanded Email Preview - Shows When Card is Expanded - Larger */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xl font-bold text-gray-900">Email Preview</h4>
                            <span className="text-base font-medium text-gray-500">Click card header to collapse</span>
                          </div>
                          
                          {/* Email Subject - Larger */}
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-lg text-gray-600 mb-2 font-bold">Subject:</p>
                            <p className="font-bold text-gray-900 text-xl">{template.preview.subject}</p>
                          </div>

                          {/* Email Body - Larger */}
                          <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                            <div 
                              className="prose prose-base max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: template.preview.body 
                              }}
                            />
                          </div>

                          {/* Template Features - Larger */}
                          <div className="mt-6 grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-base font-bold text-gray-500 mb-3">Key Features:</p>
                              <ul className="space-y-2">
                                {template.features.slice(0, 3).map((feature, index) => (
                                  <li key={index} className="flex items-center text-base font-medium text-gray-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-500 mb-3">Performance:</p>
                              <div className="space-y-2 text-base text-gray-600">
                                <div>Response Rate: <span className="font-bold text-green-600 text-lg">{template.conversionRate}</span></div>
                                <div>Response Time: <span className="font-bold text-lg">{template.responseTime}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Template Confirmation */}
            {selectedTemplate && !expandedTemplate && (
              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center text-base text-green-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Template selected: <strong className="ml-1 font-bold text-lg">{emailTemplates.find(t => t.id === selectedTemplate)?.name}</strong>
                </div>
                <p className="text-base font-medium text-green-600 mt-1">
                  Click the template again to preview the email body, or continue to audience targeting.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium">Back to Goals</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedTemplate}
              className={`
                flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all
                ${selectedTemplate
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <span className="font-bold">Continue to Audience</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateSelection;