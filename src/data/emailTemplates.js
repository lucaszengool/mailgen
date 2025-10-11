/**
 * Predefined Email Templates with Different Layouts and Components
 * Each template includes structure, components, and Ollama generation prompts
 */

export const EMAIL_TEMPLATES = {
  // Template 1: Professional Partnership - Clean & Minimal
  professional_partnership: {
    id: 'professional_partnership',
    name: 'Professional Partnership',
    description: 'Clean, minimal design perfect for B2B partnership outreach',
    preview: 'A professional approach with company branding and clear value proposition',
    structure: {
      paragraphs: 3,
      components: ['logo', 'cta_button', 'testimonial']
    },
    ollamaPrompt: `Generate a professional B2B partnership email with exactly 3 paragraphs:

    Paragraph 1: Introduction and why you're reaching out to {company}
    Paragraph 2: Value proposition and mutual benefits of partnership
    Paragraph 3: Next steps and call to action

    Keep it professional, concise, and focused on business value. Do not include any components or HTML - just the paragraph content.`,

    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: white;">

        <!-- Logo Component -->
        <div id="component-logo" style="text-align: center; padding: 30px 20px; background: #f8f9fa; border-bottom: 2px solid #e9ecef;">
          <img src="https://via.placeholder.com/180x60/28a745/ffffff?text=COMPANY+LOGO" alt="Company Logo" style="max-width: 180px;">
          <p style="margin: 10px 0 0; color: #6c757d; font-size: 14px;">Building Strategic Partnerships</p>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin: 0 0 30px; font-size: 24px;">Hello {name}!</h2>

          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
              [GENERATED CONTENT 1: Introduction and why reaching out to {company}]
            </p>
          </div>

          <!-- CTA Button Component -->
          <div id="component-cta-button" style="text-align: center; margin: 35px 0;">
            <a href="https://calendly.com/partnership"
               style="display: inline-block; background: #28a745; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Schedule Partnership Discussion
            </a>
            <p style="margin: 12px 0 0; color: #6c757d; font-size: 14px;">15-minute introductory call</p>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
              [GENERATED CONTENT 2: Value proposition and mutual benefits]
            </p>
          </div>

          <!-- Testimonial Component -->
          <div id="component-testimonial" style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 0 6px 6px 0;">
            <blockquote style="margin: 0; font-style: italic; color: #495057; font-size: 15px; line-height: 1.5;">
              "This partnership exceeded our expectations. We saw immediate results in market expansion and lead quality."
            </blockquote>
            <cite style="display: block; text-align: right; margin-top: 12px; color: #6c757d; font-size: 14px; font-weight: 600;">
              — Sarah Chen, CEO at GrowthTech
            </cite>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 25px 0 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
              [GENERATED CONTENT 3: Next steps and call to action]
            </p>
          </div>
        </div>

        <div style="padding: 25px 30px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Partnership Development Team</strong>
          </p>
        </div>
      </div>
    `,
    components: [
      {
        id: 'component-logo',
        type: 'logo',
        position: { x: 0, y: 0 },
        properties: {
          logoUrl: 'https://via.placeholder.com/180x60/28a745/ffffff?text=COMPANY+LOGO',
          altText: 'Company Logo',
          tagline: 'Building Strategic Partnerships',
          backgroundColor: '#f8f9fa'
        }
      },
      {
        id: 'component-cta-button',
        type: 'cta_button',
        position: { x: 0, y: 200 },
        properties: {
          text: 'Schedule Partnership Discussion',
          url: 'https://calendly.com/partnership',
          backgroundColor: '#28a745',
          textColor: 'white',
          description: '15-minute introductory call'
        }
      },
      {
        id: 'component-testimonial',
        type: 'testimonial',
        position: { x: 0, y: 400 },
        properties: {
          quote: 'This partnership exceeded our expectations. We saw immediate results in market expansion and lead quality.',
          author: 'Sarah Chen, CEO at GrowthTech',
          backgroundColor: '#f8f9fa',
          borderColor: '#28a745'
        }
      }
    ]
  },

  // Template 2: Modern Tech - Bold & Colorful
  modern_tech: {
    id: 'modern_tech',
    name: 'Modern Tech',
    description: 'Bold, colorful design perfect for tech companies and startups',
    preview: 'Eye-catching gradients with modern components for tech-savvy audiences',
    structure: {
      paragraphs: 2,
      components: ['header_banner', 'feature_grid', 'cta_button', 'social_proof']
    },
    ollamaPrompt: `Generate a modern tech-focused email with exactly 2 paragraphs:

    Paragraph 1: Hook about innovation and technology trends relevant to {company}
    Paragraph 2: How our solution/partnership can accelerate their tech goals

    Use modern, energetic language. Focus on innovation, scalability, and cutting-edge solutions. Do not include any components or HTML.`,

    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: white;">

        <!-- Header Banner Component -->
        <div id="component-header-banner" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700;">Innovation Awaits</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Accelerating Tech Excellence for {company}</p>
        </div>

        <div style="padding: 40px 30px;">
          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 30px;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 1: Innovation hook and tech trends for {company}]
            </p>
          </div>

          <!-- Feature Grid Component -->
          <div id="component-feature-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 35px 0; padding: 25px; background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; color: white;">
            <div style="text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
              <h3 style="margin: 0 0 8px; font-size: 16px;">Lightning Fast</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Instant deployment</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;">🚀</div>
              <h3 style="margin: 0 0 8px; font-size: 16px;">Scalable Growth</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Unlimited potential</p>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 2: How our solution accelerates their tech goals]
            </p>
          </div>

          <!-- CTA Button Component -->
          <div id="component-cta-button" style="text-align: center; margin: 35px 0;">
            <a href="https://demo.ourplatform.com"
               style="display: inline-block; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; padding: 16px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
              Explore the Platform
            </a>
            <p style="margin: 15px 0 0; color: #666; font-size: 14px;">Live demo • No signup required</p>
          </div>
        </div>

        <!-- Social Proof Component -->
        <div id="component-social-proof" style="background: #1a1a2e; color: white; padding: 30px; text-align: center;">
          <p style="margin: 0 0 20px; font-size: 16px;">Trusted by 500+ tech companies</p>
          <div style="display: flex; justify-content: center; align-items: center; gap: 30px; opacity: 0.7;">
            <span style="font-size: 14px; font-weight: 500;">TechCorp</span>
            <span style="font-size: 14px; font-weight: 500;">InnovateAI</span>
            <span style="font-size: 14px; font-weight: 500;">ScaleUp</span>
          </div>
        </div>
      </div>
    `,
    components: [
      {
        id: 'component-header-banner',
        type: 'header_banner',
        position: { x: 0, y: 0 },
        properties: {
          title: 'Innovation Awaits',
          subtitle: 'Accelerating Tech Excellence for {company}',
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      },
      {
        id: 'component-feature-grid',
        type: 'feature_grid',
        position: { x: 0, y: 150 },
        properties: {
          features: [
            { icon: '⚡', title: 'Lightning Fast', description: 'Instant deployment' },
            { icon: '🚀', title: 'Scalable Growth', description: 'Unlimited potential' }
          ],
          backgroundColor: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)'
        }
      },
      {
        id: 'component-cta-button',
        type: 'cta_button',
        position: { x: 0, y: 350 },
        properties: {
          text: 'Explore the Platform',
          url: 'https://demo.ourplatform.com',
          backgroundColor: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          description: 'Live demo • No signup required'
        }
      },
      {
        id: 'component-social-proof',
        type: 'social_proof',
        position: { x: 0, y: 500 },
        properties: {
          title: 'Trusted by 500+ tech companies',
          companies: ['TechCorp', 'InnovateAI', 'ScaleUp'],
          backgroundColor: '#1a1a2e'
        }
      }
    ]
  },

  // Template 3: Executive Outreach - Sophisticated & Elegant
  executive_outreach: {
    id: 'executive_outreach',
    name: 'Executive Outreach',
    description: 'Sophisticated design for C-level executive communications',
    preview: 'Elegant, premium look with executive-focused messaging and components',
    structure: {
      paragraphs: 4,
      components: ['executive_header', 'stats_showcase', 'testimonial']
    },
    ollamaPrompt: `Generate an executive-level email with exactly 4 paragraphs:

    Paragraph 1: Executive summary of opportunity relevant to {company}
    Paragraph 2: Strategic implications and market positioning
    Paragraph 3: Competitive advantages and ROI potential
    Paragraph 4: Executive-level next steps and meeting request

    Use sophisticated, strategic language appropriate for C-level executives. Focus on business outcomes, ROI, and strategic value.`,

    html: `
      <div style="font-family: 'Georgia', serif; max-width: 650px; margin: 0 auto; background: white; border: 1px solid #e5e5e5;">

        <!-- Executive Header Component -->
        <div id="component-executive-header" style="background: #2c3e50; color: white; padding: 35px 40px; border-bottom: 3px solid #34495e;">
          <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 400; letter-spacing: 0.5px;">Strategic Partnership Opportunity</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">Exclusively for {company} Leadership</p>
        </div>

        <div style="padding: 45px 40px;">
          <p style="margin: 0 0 25px; font-size: 18px; color: #2c3e50;">Dear {name},</p>

          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 1: Executive summary of opportunity for {company}]
            </p>
          </div>

          <!-- Stats Showcase Component -->
          <div id="component-stats-showcase" style="background: #ecf0f1; padding: 30px; margin: 35px 0; border-left: 4px solid #3498db;">
            <h3 style="margin: 0 0 20px; color: #2c3e50; font-size: 20px;">Strategic Impact Metrics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #3498db; margin-bottom: 5px;">340%</div>
                <div style="font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">ROI Increase</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #e74c3c; margin-bottom: 5px;">18 Mo</div>
                <div style="font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">Avg. Payback</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #27ae60; margin-bottom: 5px;">95%</div>
                <div style="font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">Success Rate</div>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 2: Strategic implications and market positioning]
            </p>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 3: Competitive advantages and ROI potential]
            </p>
          </div>

          <!-- Testimonial Component -->
          <div id="component-testimonial" style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 25px; margin: 35px 0; border-radius: 4px;">
            <blockquote style="margin: 0 0 15px; font-style: italic; color: #495057; font-size: 16px; line-height: 1.6;">
              "This strategic partnership transformed our market position. The executive team was impressed with both the strategic vision and execution capabilities."
            </blockquote>
            <div style="display: flex; align-items: center;">
              <img src="https://via.placeholder.com/50x50/2c3e50/ffffff?text=CEO" alt="Executive" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px;">
              <div>
                <cite style="font-weight: 600; color: #2c3e50; font-style: normal; display: block;">Michael Rodriguez</cite>
                <span style="color: #7f8c8d; font-size: 14px;">CEO & Chairman, Enterprise Solutions Inc.</span>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 4 -->
          <div id="generated-paragraph-4" style="margin: 25px 0 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 4: Executive-level next steps and meeting request]
            </p>
          </div>
        </div>

        <div style="padding: 30px 40px; background: #f8f9fa; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #495057;">
            Respectfully,<br>
            <strong style="color: #2c3e50;">Executive Partnership Team</strong><br>
            <span style="font-size: 14px; color: #7f8c8d;">strategic-partnerships@company.com</span>
          </p>
        </div>
      </div>
    `,
    components: [
      {
        id: 'component-executive-header',
        type: 'executive_header',
        position: { x: 0, y: 0 },
        properties: {
          title: 'Strategic Partnership Opportunity',
          subtitle: 'Exclusively for {company} Leadership',
          backgroundColor: '#2c3e50'
        }
      },
      {
        id: 'component-stats-showcase',
        type: 'stats_showcase',
        position: { x: 0, y: 200 },
        properties: {
          title: 'Strategic Impact Metrics',
          stats: [
            { value: '340%', label: 'ROI Increase', color: '#3498db' },
            { value: '18 Mo', label: 'Avg. Payback', color: '#e74c3c' },
            { value: '95%', label: 'Success Rate', color: '#27ae60' }
          ]
        }
      },
      {
        id: 'component-testimonial',
        type: 'testimonial',
        position: { x: 0, y: 450 },
        properties: {
          quote: 'This strategic partnership transformed our market position. The executive team was impressed with both the strategic vision and execution capabilities.',
          author: 'Michael Rodriguez',
          authorTitle: 'CEO & Chairman, Enterprise Solutions Inc.',
          authorImage: 'https://via.placeholder.com/50x50/2c3e50/ffffff?text=CEO'
        }
      }
    ]
  },

  // Template 4: Product Launch - Dynamic & Engaging
  product_launch: {
    id: 'product_launch',
    name: 'Product Launch',
    description: 'Dynamic design perfect for product announcements and launches',
    preview: 'Engaging layout with product showcase and interactive elements',
    structure: {
      paragraphs: 3,
      components: ['product_hero', 'feature_highlights', 'countdown_timer', 'cta_button']
    },
    ollamaPrompt: `Generate a product launch email with exactly 3 paragraphs:

    Paragraph 1: Exciting announcement about new product/service launch relevant to {company}
    Paragraph 2: Key benefits and how it solves problems for companies like {company}
    Paragraph 3: Exclusive early access offer and urgency to act

    Use excited, energetic language. Create anticipation and urgency. Focus on innovation and exclusive access.`,

    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">

        <!-- Product Hero Component -->
        <div id="component-product-hero" style="background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); padding: 50px 30px; text-align: center; color: #333;">
          <div style="background: white; padding: 20px; border-radius: 15px; display: inline-block; box-shadow: 0 8px 30px rgba(0,0,0,0.1);">
            <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
            <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 700; color: #333;">Revolutionary Launch</h1>
            <p style="margin: 0; color: #666; font-size: 16px;">Game-changing solution for {company}</p>
          </div>
        </div>

        <div style="padding: 40px 30px;">
          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 30px;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 1: Exciting product announcement for {company}]
            </p>
          </div>

          <!-- Feature Highlights Component -->
          <div id="component-feature-highlights" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin: 35px 0;">
            <h3 style="margin: 0 0 25px; text-align: center; font-size: 20px;">What's Inside</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;">🎯</div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Smart Targeting</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">AI-powered precision</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;">⚡</div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Lightning Speed</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">10x faster results</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;">📊</div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Real-time Analytics</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Live performance data</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;">🔒</div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Enterprise Security</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Bank-level protection</p>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 2: Key benefits for companies like {company}]
            </p>
          </div>

          <!-- Countdown Timer Component -->
          <div id="component-countdown-timer" style="background: #ff6b6b; color: white; padding: 25px; text-align: center; border-radius: 10px; margin: 35px 0;">
            <h3 style="margin: 0 0 15px; font-size: 18px;">⏰ Limited Time Exclusive Access</h3>
            <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 15px;">
              <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 8px; min-width: 60px;">
                <div style="font-size: 20px; font-weight: bold;">07</div>
                <div style="font-size: 12px; opacity: 0.9;">DAYS</div>
              </div>
              <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 8px; min-width: 60px;">
                <div style="font-size: 20px; font-weight: bold;">14</div>
                <div style="font-size: 12px; opacity: 0.9;">HOURS</div>
              </div>
              <div style="background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 8px; min-width: 60px;">
                <div style="font-size: 20px; font-weight: bold;">32</div>
                <div style="font-size: 12px; opacity: 0.9;">MINS</div>
              </div>
            </div>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Early access ends soon!</p>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 3: Exclusive early access and urgency]
            </p>
          </div>

          <!-- CTA Button Component -->
          <div id="component-cta-button" style="text-align: center; margin: 35px 0;">
            <a href="https://earlyaccess.product.com"
               style="display: inline-block; background: linear-gradient(45deg, #ff6b6b, #ffa500); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 25px rgba(255,107,107,0.3); text-transform: uppercase; letter-spacing: 1px;">
              Get Early Access Now
            </a>
            <p style="margin: 15px 0 0; color: #666; font-size: 14px;">🎁 Includes exclusive launch bonuses worth $500</p>
          </div>
        </div>
      </div>
    `,
    components: [
      {
        id: 'component-product-hero',
        type: 'product_hero',
        position: { x: 0, y: 0 },
        properties: {
          icon: '🚀',
          title: 'Revolutionary Launch',
          subtitle: 'Game-changing solution for {company}',
          backgroundColor: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
        }
      },
      {
        id: 'component-feature-highlights',
        type: 'feature_highlights',
        position: { x: 0, y: 200 },
        properties: {
          title: 'What\'s Inside',
          features: [
            { icon: '🎯', title: 'Smart Targeting', description: 'AI-powered precision' },
            { icon: '⚡', title: 'Lightning Speed', description: '10x faster results' },
            { icon: '📊', title: 'Real-time Analytics', description: 'Live performance data' },
            { icon: '🔒', title: 'Enterprise Security', description: 'Bank-level protection' }
          ]
        }
      },
      {
        id: 'component-countdown-timer',
        type: 'countdown_timer',
        position: { x: 0, y: 450 },
        properties: {
          title: '⏰ Limited Time Exclusive Access',
          endMessage: 'Early access ends soon!',
          backgroundColor: '#ff6b6b'
        }
      },
      {
        id: 'component-cta-button',
        type: 'cta_button',
        position: { x: 0, y: 600 },
        properties: {
          text: 'Get Early Access Now',
          url: 'https://earlyaccess.product.com',
          backgroundColor: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
          description: '🎁 Includes exclusive launch bonuses worth $500'
        }
      }
    ]
  },

  // Template 5: Consultative Sales - Trust & Authority
  consultative_sales: {
    id: 'consultative_sales',
    name: 'Consultative Sales',
    description: 'Trust-building design for consultative sales approaches',
    preview: 'Professional layout emphasizing expertise and thought leadership',
    structure: {
      paragraphs: 5,
      components: ['expert_header', 'case_study', 'methodology', 'cta_consultation']
    },
    ollamaPrompt: `Generate a consultative sales email with exactly 5 paragraphs:

    Paragraph 1: Industry insight or trend observation relevant to {company}
    Paragraph 2: Challenge identification specific to companies like {company}
    Paragraph 3: Our methodology and approach to solving this challenge
    Paragraph 4: Case study preview or success story example
    Paragraph 5: Soft consultation offer and value-first approach

    Use consultative, advisory tone. Position as expert advisor, not salesperson. Focus on insights and value.`,

    html: `
      <div style="font-family: 'Times New Roman', serif; max-width: 620px; margin: 0 auto; background: white; border: 2px solid #e8e8e8;">

        <!-- Expert Header Component -->
        <div id="component-expert-header" style="background: white; padding: 35px 40px; border-bottom: 1px solid #ddd;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="https://via.placeholder.com/80x80/34495e/ffffff?text=Expert" alt="Expert" style="width: 80px; height: 80px; border-radius: 50%;">
            <div>
              <h2 style="margin: 0 0 5px; font-size: 22px; color: #2c3e50;">Strategic Advisory</h2>
              <p style="margin: 0; color: #7f8c8d; font-size: 16px;">Insights for {company} Leadership</p>
              <div style="margin-top: 8px;">
                <span style="background: #ecf0f1; padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #2c3e50; text-transform: uppercase; letter-spacing: 1px;">Industry Expert</span>
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 40px;">
          <p style="margin: 0 0 25px; font-size: 16px; color: #2c3e50;">Dear {name},</p>

          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 1: Industry insight relevant to {company}]
            </p>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 2: Challenge identification for {company}]
            </p>
          </div>

          <!-- Methodology Component -->
          <div id="component-methodology" style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 30px; margin: 35px 0;">
            <h3 style="margin: 0 0 20px; color: #2c3e50; font-size: 18px; text-align: center;">Our Proven Framework</h3>
            <div style="display: flex; justify-content: space-between; gap: 15px;">
              <div style="flex: 1; text-align: center; padding: 15px;">
                <div style="background: #3498db; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: bold;">1</div>
                <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">ANALYZE</h4>
                <p style="margin: 0; font-size: 12px; color: #7f8c8d;">Current state assessment</p>
              </div>
              <div style="flex: 1; text-align: center; padding: 15px;">
                <div style="background: #e74c3c; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: bold;">2</div>
                <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">STRATEGIZE</h4>
                <p style="margin: 0; font-size: 12px; color: #7f8c8d;">Custom solution design</p>
              </div>
              <div style="flex: 1; text-align: center; padding: 15px;">
                <div style="background: #27ae60; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: bold;">3</div>
                <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">EXECUTE</h4>
                <p style="margin: 0; font-size: 12px; color: #7f8c8d;">Implementation & results</p>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 3: Our methodology and approach]
            </p>
          </div>

          <!-- Case Study Component -->
          <div id="component-case-study" style="border-left: 4px solid #f39c12; background: #fef9e7; padding: 25px; margin: 35px 0;">
            <h3 style="margin: 0 0 15px; color: #d68910; font-size: 16px;">📊 Recent Success Story</h3>
            <p style="margin: 0 0 15px; font-style: italic; color: #6c757d; font-size: 15px; line-height: 1.6;">
              "Similar manufacturing company increased operational efficiency by 180% and reduced costs by $2.3M annually using our strategic framework."
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600; color: #2c3e50; font-size: 14px;">Manufacturing Industry • 500+ employees</span>
              <span style="background: #f39c12; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">VERIFIED RESULTS</span>
            </div>
          </div>

          <!-- Generated Paragraph 4 -->
          <div id="generated-paragraph-4" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 4: Case study preview and success examples]
            </p>
          </div>

          <!-- Generated Paragraph 5 -->
          <div id="generated-paragraph-5" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0; text-align: justify;">
              [GENERATED CONTENT 5: Consultation offer and value-first approach]
            </p>
          </div>

          <!-- CTA Consultation Component -->
          <div id="component-cta-consultation" style="background: #2c3e50; color: white; padding: 25px; text-align: center; margin: 35px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 15px; font-size: 18px;">Complimentary Strategic Assessment</h3>
            <p style="margin: 0 0 20px; font-size: 14px; opacity: 0.9;">No obligation • 30-minute expert consultation</p>
            <a href="https://consultation.company.com"
               style="display: inline-block; background: white; color: #2c3e50; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Schedule Assessment
            </a>
          </div>
        </div>

        <div style="padding: 25px 40px; background: #f8f9fa; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #495057; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #2c3e50;">Strategic Advisory Team</strong><br>
            <em style="color: #7f8c8d;">Trusted by 200+ enterprise clients</em>
          </p>
        </div>
      </div>
    `,
    components: [
      {
        id: 'component-expert-header',
        type: 'expert_header',
        position: { x: 0, y: 0 },
        properties: {
          title: 'Strategic Advisory',
          subtitle: 'Insights for {company} Leadership',
          expertImage: 'https://via.placeholder.com/80x80/34495e/ffffff?text=Expert',
          badge: 'Industry Expert'
        }
      },
      {
        id: 'component-methodology',
        type: 'methodology',
        position: { x: 0, y: 250 },
        properties: {
          title: 'Our Proven Framework',
          steps: [
            { number: '1', title: 'ANALYZE', description: 'Current state assessment', color: '#3498db' },
            { number: '2', title: 'STRATEGIZE', description: 'Custom solution design', color: '#e74c3c' },
            { number: '3', title: 'EXECUTE', description: 'Implementation & results', color: '#27ae60' }
          ]
        }
      },
      {
        id: 'component-case-study',
        type: 'case_study',
        position: { x: 0, y: 450 },
        properties: {
          title: '📊 Recent Success Story',
          quote: 'Similar manufacturing company increased operational efficiency by 180% and reduced costs by $2.3M annually using our strategic framework.',
          details: 'Manufacturing Industry • 500+ employees',
          badge: 'VERIFIED RESULTS',
          backgroundColor: '#fef9e7',
          borderColor: '#f39c12'
        }
      },
      {
        id: 'component-cta-consultation',
        type: 'cta_consultation',
        position: { x: 0, y: 650 },
        properties: {
          title: 'Complimentary Strategic Assessment',
          description: 'No obligation • 30-minute expert consultation',
          buttonText: 'Schedule Assessment',
          url: 'https://consultation.company.com',
          backgroundColor: '#2c3e50'
        }
      }
    ]
  },

  // Template 6: Event Invitation - Community & Networking
  event_invitation: {
    id: 'event_invitation',
    name: 'Event Invitation',
    description: 'Engaging design for event invitations and community building',
    preview: 'Vibrant layout perfect for webinars, conferences, and networking events',
    structure: {
      paragraphs: 3,
      components: ['event_hero', 'agenda_timeline', 'speaker_showcase', 'registration_cta']
    },
    ollamaPrompt: `Generate an event invitation email with exactly 3 paragraphs:

    Paragraph 1: Exciting event announcement and why it's valuable for {company}
    Paragraph 2: Key topics, speakers, and exclusive insights they'll gain
    Paragraph 3: Limited spots available and encouragement to register now

    Use enthusiastic, community-building language. Create excitement about networking and learning opportunities.`,

    html: `
      <div style="font-family: 'Nunito', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: white;">

        <!-- Event Hero Component -->
        <div id="component-event-hero" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; background: rgba(255,255,255,0.1); width: 100px; height: 100px; border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; background: rgba(255,255,255,0.05); width: 120px; height: 120px; border-radius: 50%;"></div>
          <div style="position: relative; z-index: 2;">
            <div style="background: rgba(255,255,255,0.2); display: inline-block; padding: 8px 20px; border-radius: 20px; margin-bottom: 20px; font-size: 14px; font-weight: 600;">
              EXCLUSIVE EVENT
            </div>
            <h1 style="margin: 0 0 15px; font-size: 28px; font-weight: 700;">Future of Business Summit</h1>
            <p style="margin: 0 0 20px; font-size: 18px; opacity: 0.9;">Specially curated for {company} and industry leaders</p>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; display: inline-block;">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">SAVE THE DATE</div>
              <div style="font-size: 20px; font-weight: 600;">March 15, 2024 | 2:00 PM EST</div>
            </div>
          </div>
        </div>

        <div style="padding: 40px 30px;">
          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 30px;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 1: Event announcement and value for {company}]
            </p>
          </div>

          <!-- Agenda Timeline Component -->
          <div id="component-agenda-timeline" style="background: #f8f9ff; padding: 30px; border-radius: 12px; margin: 35px 0;">
            <h3 style="margin: 0 0 25px; text-align: center; color: #333; font-size: 20px;">📅 Event Agenda</h3>
            <div style="space-y: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; margin-bottom: 15px;">
                <div style="background: #667eea; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 15px; min-width: 70px; text-align: center;">2:00 PM</div>
                <div>
                  <h4 style="margin: 0 0 5px; color: #333; font-size: 16px;">Opening Keynote: Digital Transformation Trends</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">Industry insights and future predictions</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; margin-bottom: 15px;">
                <div style="background: #764ba2; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 15px; min-width: 70px; text-align: center;">2:45 PM</div>
                <div>
                  <h4 style="margin: 0 0 5px; color: #333; font-size: 16px;">Panel: Scaling for Growth</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">CEO roundtable discussion</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px;">
                <div style="background: #667eea; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 15px; min-width: 70px; text-align: center;">3:30 PM</div>
                <div>
                  <h4 style="margin: 0 0 5px; color: #333; font-size: 16px;">Networking & Q&A</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">Connect with peers and experts</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 2: Key topics, speakers, and insights]
            </p>
          </div>

          <!-- Speaker Showcase Component -->
          <div id="component-speaker-showcase" style="background: linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; border-radius: 12px; margin: 35px 0;">
            <h3 style="margin: 0 0 25px; text-align: center; color: #333; font-size: 20px;">🎤 Featured Speakers</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="text-align: center; background: rgba(255,255,255,0.7); padding: 20px; border-radius: 10px;">
                <img src="https://via.placeholder.com/80x80/333/ffffff?text=Speaker1" alt="Speaker" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px;">
                <h4 style="margin: 0 0 5px; color: #333; font-size: 16px;">Sarah Johnson</h4>
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">CEO, TechVanguard</p>
                <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">KEYNOTE</span>
              </div>
              <div style="text-align: center; background: rgba(255,255,255,0.7); padding: 20px; border-radius: 10px;">
                <img src="https://via.placeholder.com/80x80/333/ffffff?text=Speaker2" alt="Speaker" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px;">
                <h4 style="margin: 0 0 5px; color: #333; font-size: 16px;">Michael Chen</h4>
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Innovation Director, FutureScale</p>
                <span style="background: #764ba2; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PANEL</span>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #333; margin: 0;">
              [GENERATED CONTENT 3: Limited spots and registration encouragement]
            </p>
          </div>

          <!-- Registration CTA Component -->
          <div id="component-registration-cta" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 35px; text-align: center; border-radius: 15px; margin: 35px 0; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -10px; right: 20px; background: #ffeb3b; color: #333; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 700; transform: rotate(15deg);">
              LIMITED SEATS
            </div>
            <h3 style="margin: 0 0 15px; font-size: 22px;">🎟️ Reserve Your Spot</h3>
            <p style="margin: 0 0 25px; font-size: 16px; opacity: 0.9;">Join 200+ industry leaders • Complimentary attendance</p>
            <a href="https://register.event.com"
               style="display: inline-block; background: white; color: #667eea; padding: 16px 35px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 17px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              Register Free Now
            </a>
            <p style="margin: 20px 0 0; font-size: 14px; opacity: 0.8;">🎁 Bonus: Exclusive strategy guide for attendees</p>
          </div>
        </div>

        <div style="padding: 25px 30px; background: #f8f9fa; text-align: center;">
          <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Can't make it live? All registrants receive the recording.</p>
          <p style="margin: 0; color: #999; font-size: 12px;">Future of Business Summit • Hosted by Industry Leaders Network</p>
        </div>
      </div>
    `,
    components: [
      {
        id: 'component-event-hero',
        type: 'event_hero',
        position: { x: 0, y: 0 },
        properties: {
          badge: 'EXCLUSIVE EVENT',
          title: 'Future of Business Summit',
          subtitle: 'Specially curated for {company} and industry leaders',
          date: 'March 15, 2024 | 2:00 PM EST',
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      },
      {
        id: 'component-agenda-timeline',
        type: 'agenda_timeline',
        position: { x: 0, y: 200 },
        properties: {
          title: '📅 Event Agenda',
          agenda: [
            { time: '2:00 PM', title: 'Opening Keynote: Digital Transformation Trends', description: 'Industry insights and future predictions' },
            { time: '2:45 PM', title: 'Panel: Scaling for Growth', description: 'CEO roundtable discussion' },
            { time: '3:30 PM', title: 'Networking & Q&A', description: 'Connect with peers and experts' }
          ]
        }
      },
      {
        id: 'component-speaker-showcase',
        type: 'speaker_showcase',
        position: { x: 0, y: 400 },
        properties: {
          title: '🎤 Featured Speakers',
          speakers: [
            { name: 'Sarah Johnson', title: 'CEO, TechVanguard', image: 'https://via.placeholder.com/80x80/333/ffffff?text=Speaker1', badge: 'KEYNOTE' },
            { name: 'Michael Chen', title: 'Innovation Director, FutureScale', image: 'https://via.placeholder.com/80x80/333/ffffff?text=Speaker2', badge: 'PANEL' }
          ]
        }
      },
      {
        id: 'component-registration-cta',
        type: 'registration_cta',
        position: { x: 0, y: 600 },
        properties: {
          badge: 'LIMITED SEATS',
          title: '🎟️ Reserve Your Spot',
          description: 'Join 200+ industry leaders • Complimentary attendance',
          buttonText: 'Register Free Now',
          url: 'https://register.event.com',
          bonus: '🎁 Bonus: Exclusive strategy guide for attendees'
        }
      }
    ]
  }
};

export default EMAIL_TEMPLATES;