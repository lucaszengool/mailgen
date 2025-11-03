/**
 * Predefined Email Templates with Consistent Green, Grey, Black, White Color Scheme
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
    ollamaPrompt: `Write a professional partnership email from {senderName} at {companyName} to {recipientName} at {company}.

Write a SINGLE coherent business email that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Brief, warm greeting and introduction (1-2 sentences)
2. Main body: Value proposition and partnership benefits (2-3 sentences)
3. Closing: Clear next steps and call to action (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Each paragraph should naturally lead to the next
- Use proper paragraph breaks for readability
- Professional yet conversational tone
- Be concise but compelling
- Focus on mutual value and benefits

DO NOT include:
- Multiple greetings or sign-offs
- Disconnected sections
- Repetitive content
- Generic filler text

Write the complete email now (without subject line or email headers):`,

    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: transparent;">

        <!-- Logo Component -->
        <div id="component-logo" style="text-align: center; padding: 30px 20px; background: transparent; border-bottom: 2px solid #e9ecef;">
          <img src="https://via.placeholder.com/180x60/28a745/ffffff?text=COMPANY+LOGO" alt="Company Logo" style="max-width: 180px; height: auto; display: block; margin: 0 auto;">
          <p style="margin: 10px 0 0; color: #6c757d; font-size: 14px;">Building Strategic Partnerships</p>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #343a40; margin: 0 0 30px; font-size: 24px;">Hello {name}!</h2>

          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #343a40; margin: 0;">
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
            <p style="font-size: 16px; line-height: 1.6; color: #343a40; margin: 0;">
              [GENERATED CONTENT 2: Value proposition and mutual benefits]
            </p>
          </div>

          <!-- Testimonial Component -->
          <div id="component-testimonial" style="background: transparent; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 0 6px 6px 0;">
            <blockquote style="margin: 0; font-style: italic; color: #495057; font-size: 15px; line-height: 1.5;">
              "This partnership exceeded our expectations. We saw immediate results in market expansion and lead quality."
            </blockquote>
            <cite style="display: block; text-align: right; margin-top: 12px; color: #6c757d; font-size: 14px; font-weight: 600;">
              — Sarah Chen, CEO at GrowthTech
            </cite>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 25px 0 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #343a40; margin: 0;">
              [GENERATED CONTENT 3: Next steps and call to action]
            </p>
          </div>
        </div>

        <div style="padding: 25px 30px; background: transparent; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            Best regards,<br>
            <strong>Partnership Development Team</strong>
          </p>
        </div>
      </div>
    `
  },

  // Template 2: Modern Tech - Clean with Green Accents
  modern_tech: {
    id: 'modern_tech',
    name: 'Modern Tech',
    description: 'Bold, clean design perfect for tech companies and startups',
    preview: 'Modern design with green accents for tech-savvy audiences',
    structure: {
      paragraphs: 2,
      components: ['header_banner', 'feature_grid', 'cta_button', 'social_proof']
    },
    ollamaPrompt: `Write a modern tech-focused email from {senderName} at {companyName} to {recipientName} at {company}.

Write a SINGLE coherent tech email that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Hook about innovation and technology trends (1-2 sentences)
2. Main body: How our solution accelerates their tech goals (2-3 sentences)
3. Closing: Next steps and tech demo invitation (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Use modern, energetic language
- Focus on innovation, scalability, and cutting-edge solutions
- Professional yet exciting tone
- Be concise but compelling
- Create enthusiasm for technology

DO NOT include:
- Multiple greetings or sign-offs
- Disconnected sections
- Repetitive content
- Generic filler text

Write the complete email now (without subject line or email headers):`,

    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: transparent;">

        <!-- Header Banner Component -->
        <div id="component-header-banner" style="background: #343a40; padding: 40px 30px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 700;">Innovation Awaits</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Accelerating Tech Excellence for {company}</p>
        </div>

        <div style="padding: 40px 30px;">
          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 30px;">
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 1: Innovation hook and tech trends for {company}]
            </p>
          </div>

          <!-- Feature Grid Component -->
          <div id="component-feature-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 35px 0; padding: 25px; background: #28a745; border-radius: 12px; color: white;">
            <div style="text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;"></div>
              <h3 style="margin: 0 0 8px; font-size: 16px;">Lightning Fast</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Instant deployment</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;"></div>
              <h3 style="margin: 0 0 8px; font-size: 16px;">Scalable Growth</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Unlimited potential</p>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 2: How our solution accelerates their tech goals]
            </p>
          </div>

          <!-- CTA Button Component -->
          <div id="component-cta-button" style="text-align: center; margin: 35px 0;">
            <a href="https://demo.ourplatform.com"
               style="display: inline-block; background: #28a745; color: white; padding: 16px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
              Explore the Platform
            </a>
            <p style="margin: 15px 0 0; color: #6c757d; font-size: 14px;">Live demo • No signup required</p>
          </div>
        </div>

        <!-- Social Proof Component -->
        <div id="component-social-proof" style="background: #343a40; color: white; padding: 30px; text-align: center;">
          <p style="margin: 0 0 20px; font-size: 16px;">Trusted by 500+ tech companies</p>
          <div style="display: flex; justify-content: center; align-items: center; gap: 30px; opacity: 0.7;">
            <span style="font-size: 14px; font-weight: 500;">TechCorp</span>
            <span style="font-size: 14px; font-weight: 500;">InnovateAI</span>
            <span style="font-size: 14px; font-weight: 500;">ScaleUp</span>
          </div>
        </div>
      </div>
    `
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
    ollamaPrompt: `Write an executive-level email from {senderName} at {companyName} to {recipientName} at {company}.

Write a SINGLE coherent executive email that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Executive summary of strategic opportunity (1-2 sentences)
2. Main body: Strategic implications, market positioning, and ROI potential (3-4 sentences)
3. Closing: Executive-level meeting request and next steps (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Use sophisticated, strategic language for C-level executives
- Focus on business outcomes, ROI, and strategic value
- Professional and authoritative tone
- Be concise but comprehensive
- Emphasize competitive advantages

DO NOT include:
- Multiple greetings or sign-offs
- Disconnected sections
- Repetitive content
- Generic filler text

Write the complete email now (without subject line or email headers):`,

    html: `
      <div style="font-family: 'Georgia', serif; max-width: 650px; margin: 0 auto; background: transparent; border: 1px solid #e5e5e5;">

        <!-- Executive Header Component -->
        <div id="component-executive-header" style="background: #343a40; color: white; padding: 35px 40px; border-bottom: 3px solid #28a745;">
          <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 400; letter-spacing: 0.5px;">Strategic Partnership Opportunity</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">Exclusively for {company} Leadership</p>
        </div>

        <div style="padding: 45px 40px;">
          <p style="margin: 0 0 25px; font-size: 18px; color: #343a40;">Dear {name},</p>

          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 1: Executive summary of opportunity for {company}]
            </p>
          </div>

          <!-- Stats Showcase Component -->
          <div id="component-stats-showcase" style="background: transparent; padding: 30px; margin: 35px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 20px; color: #343a40; font-size: 20px;">Strategic Impact Metrics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 5px;">340%</div>
                <div style="font-size: 14px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px;">ROI Increase</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #343a40; margin-bottom: 5px;">18 Mo</div>
                <div style="font-size: 14px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px;">Avg. Payback</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 5px;">95%</div>
                <div style="font-size: 14px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px;">Success Rate</div>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 2: Strategic implications and market positioning]
            </p>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 3: Competitive advantages and ROI potential]
            </p>
          </div>

          <!-- Testimonial Component -->
          <div id="component-testimonial" style="background: transparent; border: 1px solid #dee2e6; padding: 25px; margin: 35px 0; border-radius: 4px;">
            <blockquote style="margin: 0 0 15px; font-style: italic; color: #495057; font-size: 16px; line-height: 1.6;">
              "This strategic partnership transformed our market position. The executive team was impressed with both the strategic vision and execution capabilities."
            </blockquote>
            <div style="display: flex; align-items: center;">
              <img src="https://via.placeholder.com/50x50/343a40/ffffff?text=CEO" alt="Executive" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px;">
              <div>
                <cite style="font-weight: 600; color: #343a40; font-style: normal; display: block;">Michael Rodriguez</cite>
                <span style="color: #6c757d; font-size: 14px;">CEO & Chairman, Enterprise Solutions Inc.</span>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 4 -->
          <div id="generated-paragraph-4" style="margin: 25px 0 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 4: Executive-level next steps and meeting request]
            </p>
          </div>
        </div>

        <div style="padding: 30px 40px; background: transparent; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #495057;">
            Respectfully,<br>
            <strong style="color: #343a40;">Executive Partnership Team</strong><br>
            <span style="font-size: 14px; color: #6c757d;">strategic-partnerships@company.com</span>
          </p>
        </div>
      </div>
    `
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
    ollamaPrompt: `Write a product launch email from {senderName} at {companyName} to {recipientName} at {company}.

Write a SINGLE coherent product launch email that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Exciting product announcement (1-2 sentences)
2. Main body: Key benefits and how it solves problems for companies like {company} (2-3 sentences)
3. Closing: Exclusive early access offer with urgency (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Use excited, energetic language
- Create anticipation and urgency
- Focus on innovation and exclusive access
- Enthusiastic but professional tone
- Be compelling and action-oriented
- Emphasize limited-time benefits

DO NOT include:
- Multiple greetings or sign-offs
- Disconnected sections
- Repetitive content
- Generic filler text

Write the complete email now (without subject line or email headers):`,

    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: transparent;">

        <!-- Product Hero Component -->
        <div id="component-product-hero" style="background: transparent; padding: 50px 30px; text-align: center; color: #343a40;">
          <div style="background: transparent; padding: 20px; border-radius: 15px; display: inline-block; box-shadow: 0 8px 30px rgba(0,0,0,0.1);">
            <div style="font-size: 48px; margin-bottom: 10px;"></div>
            <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 700; color: #343a40;">Revolutionary Launch</h1>
            <p style="margin: 0; color: #6c757d; font-size: 16px;">Game-changing solution for {company}</p>
          </div>
        </div>

        <div style="padding: 40px 30px;">
          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 30px;">
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 1: Exciting product announcement for {company}]
            </p>
          </div>

          <!-- Feature Highlights Component -->
          <div id="component-feature-highlights" style="background: #28a745; color: white; padding: 30px; border-radius: 15px; margin: 35px 0;">
            <h3 style="margin: 0 0 25px; text-align: center; font-size: 20px;">What's Inside</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;"></div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Smart Targeting</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">AI-powered precision</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;"></div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Lightning Speed</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">10x faster results</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;"></div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Real-time Analytics</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Live performance data</p>
              </div>
              <div style="text-align: center; padding: 15px;">
                <div style="font-size: 28px; margin-bottom: 10px;"></div>
                <h4 style="margin: 0 0 8px; font-size: 16px;">Enterprise Security</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Bank-level protection</p>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 2: Key benefits for companies like {company}]
            </p>
          </div>

          <!-- Countdown Timer Component -->
          <div id="component-countdown-timer" style="background: #6c757d; color: white; padding: 25px; text-align: center; border-radius: 10px; margin: 35px 0;">
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
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 3: Exclusive early access and urgency]
            </p>
          </div>

          <!-- CTA Button Component -->
          <div id="component-cta-button" style="text-align: center; margin: 35px 0;">
            <a href="https://earlyaccess.product.com"
               style="display: inline-block; background: #28a745; color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 25px rgba(40,167,69,0.3); text-transform: uppercase; letter-spacing: 1px;">
              Get Early Access Now
            </a>
            <p style="margin: 15px 0 0; color: #6c757d; font-size: 14px;"> Includes exclusive launch bonuses worth $500</p>
          </div>
        </div>
      </div>
    `
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
    ollamaPrompt: `Write a consultative sales email from {senderName} at {companyName} to {recipientName} at {company}.

Write a SINGLE coherent consultative email that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Industry insight and challenge identification (2-3 sentences)
2. Main body: Our methodology, approach, and success story example (3-4 sentences)
3. Closing: Soft consultation offer with value-first approach (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Use consultative, advisory tone
- Position as expert advisor, not salesperson
- Focus on insights and value
- Professional and trustworthy tone
- Be helpful and educational
- Emphasize expertise and results

DO NOT include:
- Multiple greetings or sign-offs
- Disconnected sections
- Repetitive content
- Generic filler text

Write the complete email now (without subject line or email headers):`,

    html: `
      <div style="font-family: 'Times New Roman', serif; max-width: 620px; margin: 0 auto; background: transparent; border: 2px solid #e8e8e8;">

        <!-- Expert Header Component -->
        <div id="component-expert-header" style="background: transparent; padding: 35px 40px; border-bottom: 1px solid #dee2e6;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="https://via.placeholder.com/80x80/343a40/ffffff?text=Expert" alt="Expert" style="width: 80px; height: 80px; border-radius: 50%;">
            <div>
              <h2 style="margin: 0 0 5px; font-size: 22px; color: #343a40;">Strategic Advisory</h2>
              <p style="margin: 0; color: #6c757d; font-size: 16px;">Insights for {company} Leadership</p>
              <div style="margin-top: 8px;">
                <span style="background: transparent; padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #343a40; text-transform: uppercase; letter-spacing: 1px;">Industry Expert</span>
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 40px;">
          <p style="margin: 0 0 25px; font-size: 16px; color: #343a40;">Dear {name},</p>

          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 1: Industry insight relevant to {company}]
            </p>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 2: Challenge identification for {company}]
            </p>
          </div>

          <!-- Methodology Component -->
          <div id="component-methodology" style="background: transparent; border: 1px solid #dee2e6; padding: 30px; margin: 35px 0;">
            <h3 style="margin: 0 0 20px; color: #343a40; font-size: 18px; text-align: center;">Our Proven Framework</h3>
            <div style="display: flex; justify-content: space-between; gap: 15px;">
              <div style="flex: 1; text-align: center; padding: 15px;">
                <div style="background: #28a745; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: bold;">1</div>
                <h4 style="margin: 0 0 8px; font-size: 14px; color: #343a40;">ANALYZE</h4>
                <p style="margin: 0; font-size: 12px; color: #6c757d;">Current state assessment</p>
              </div>
              <div style="flex: 1; text-align: center; padding: 15px;">
                <div style="background: #6c757d; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: bold;">2</div>
                <h4 style="margin: 0 0 8px; font-size: 14px; color: #343a40;">STRATEGIZE</h4>
                <p style="margin: 0; font-size: 12px; color: #6c757d;">Custom solution design</p>
              </div>
              <div style="flex: 1; text-align: center; padding: 15px;">
                <div style="background: #28a745; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: bold;">3</div>
                <h4 style="margin: 0 0 8px; font-size: 14px; color: #343a40;">EXECUTE</h4>
                <p style="margin: 0; font-size: 12px; color: #6c757d;">Implementation & results</p>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 3: Our methodology and approach]
            </p>
          </div>

          <!-- Case Study Component -->
          <div id="component-case-study" style="border-left: 4px solid #28a745; background: transparent; padding: 25px; margin: 35px 0;">
            <h3 style="margin: 0 0 15px; color: #28a745; font-size: 16px;"> Recent Success Story</h3>
            <p style="margin: 0 0 15px; font-style: italic; color: #6c757d; font-size: 15px; line-height: 1.6;">
              "Similar manufacturing company increased operational efficiency by 180% and reduced costs by $2.3M annually using our strategic framework."
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600; color: #343a40; font-size: 14px;">Manufacturing Industry • 500+ employees</span>
              <span style="background: #28a745; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">VERIFIED RESULTS</span>
            </div>
          </div>

          <!-- Generated Paragraph 4 -->
          <div id="generated-paragraph-4" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 4: Case study preview and success examples]
            </p>
          </div>

          <!-- Generated Paragraph 5 -->
          <div id="generated-paragraph-5" style="margin: 25px 0;">
            <p style="font-size: 16px; line-height: 1.8; color: #343a40; margin: 0; text-align: justify;">
              [GENERATED CONTENT 5: Consultation offer and value-first approach]
            </p>
          </div>

          <!-- CTA Consultation Component -->
          <div id="component-cta-consultation" style="background: #343a40; color: white; padding: 25px; text-align: center; margin: 35px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 15px; font-size: 18px;">Complimentary Strategic Assessment</h3>
            <p style="margin: 0 0 20px; font-size: 14px; opacity: 0.9;">No obligation • 30-minute expert consultation</p>
            <a href="https://consultation.company.com"
               style="display: inline-block; background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              Schedule Assessment
            </a>
          </div>
        </div>

        <div style="padding: 25px 40px; background: transparent; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #495057; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #343a40;">Strategic Advisory Team</strong><br>
            <em style="color: #6c757d;">Trusted by 200+ enterprise clients</em>
          </p>
        </div>
      </div>
    `
  },

  // Template 6: Event Invitation - Community & Networking
  event_invitation: {
    id: 'event_invitation',
    name: 'Event Invitation',
    description: 'Engaging design for event invitations and community building',
    preview: 'Clean layout perfect for webinars, conferences, and networking events',
    structure: {
      paragraphs: 3,
      components: ['event_hero', 'agenda_timeline', 'speaker_showcase', 'registration_cta']
    },
    ollamaPrompt: `Write an event invitation email from {senderName} at {companyName} to {recipientName} at {company}.

Write a SINGLE coherent event invitation that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Exciting event announcement and value for {company} (1-2 sentences)
2. Main body: Key topics, speakers, and exclusive insights they'll gain (2-3 sentences)
3. Closing: Limited spots available with registration encouragement (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Use enthusiastic, community-building language
- Create excitement about networking and learning
- Professional yet engaging tone
- Be compelling and inviting
- Emphasize exclusivity and value

DO NOT include:
- Multiple greetings or sign-offs
- Disconnected sections
- Repetitive content
- Generic filler text

Write the complete email now (without subject line or email headers):`,

    html: `
      <div style="font-family: 'Nunito', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: transparent;">

        <!-- Event Hero Component -->
        <div id="component-event-hero" style="background: #343a40; color: white; padding: 40px 30px; text-align: center; position: relative;">
          <div style="position: relative; z-index: 2;">
            <div style="background: #28a745; display: inline-block; padding: 8px 20px; border-radius: 20px; margin-bottom: 20px; font-size: 14px; font-weight: 600;">
              EXCLUSIVE EVENT
            </div>
            <h1 style="margin: 0 0 15px; font-size: 28px; font-weight: 700;">Future of Business Summit</h1>
            <p style="margin: 0 0 20px; font-size: 18px; opacity: 0.9;">Specially curated for {company} and industry leaders</p>
            <div style="background: transparent; color: #343a40; padding: 15px; border-radius: 8px; display: inline-block;">
              <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">SAVE THE DATE</div>
              <div style="font-size: 20px; font-weight: 600;">March 15, 2024 | 2:00 PM EST</div>
            </div>
          </div>
        </div>

        <div style="padding: 40px 30px;">
          <!-- Generated Paragraph 1 -->
          <div id="generated-paragraph-1" style="margin-bottom: 30px;">
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 1: Event announcement and value for {company}]
            </p>
          </div>

          <!-- Agenda Timeline Component -->
          <div id="component-agenda-timeline" style="background: transparent; padding: 30px; border-radius: 12px; margin: 35px 0;">
            <h3 style="margin: 0 0 25px; text-align: center; color: #343a40; font-size: 20px;"> Event Agenda</h3>
            <div style="space-y: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: transparent; border-radius: 8px; margin-bottom: 15px;">
                <div style="background: #28a745; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 15px; min-width: 70px; text-align: center;">2:00 PM</div>
                <div>
                  <h4 style="margin: 0 0 5px; color: #343a40; font-size: 16px;">Opening Keynote: Digital Transformation Trends</h4>
                  <p style="margin: 0; color: #6c757d; font-size: 14px;">Industry insights and future predictions</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: transparent; border-radius: 8px; margin-bottom: 15px;">
                <div style="background: #6c757d; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 15px; min-width: 70px; text-align: center;">2:45 PM</div>
                <div>
                  <h4 style="margin: 0 0 5px; color: #343a40; font-size: 16px;">Panel: Scaling for Growth</h4>
                  <p style="margin: 0; color: #6c757d; font-size: 14px;">CEO roundtable discussion</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: transparent; border-radius: 8px;">
                <div style="background: #28a745; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 15px; min-width: 70px; text-align: center;">3:30 PM</div>
                <div>
                  <h4 style="margin: 0 0 5px; color: #343a40; font-size: 16px;">Networking & Q&A</h4>
                  <p style="margin: 0; color: #6c757d; font-size: 14px;">Connect with peers and experts</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 2 -->
          <div id="generated-paragraph-2" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 2: Key topics, speakers, and insights]
            </p>
          </div>

          <!-- Speaker Showcase Component -->
          <div id="component-speaker-showcase" style="background: transparent; padding: 30px; border-radius: 12px; margin: 35px 0; border: 1px solid #e9ecef;">
            <h3 style="margin: 0 0 25px; text-align: center; color: #343a40; font-size: 20px;"> Featured Speakers</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="text-align: center; background: transparent; padding: 20px; border-radius: 10px;">
                <img src="https://via.placeholder.com/80x80/343a40/ffffff?text=S1" alt="Speaker" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px;">
                <h4 style="margin: 0 0 5px; color: #343a40; font-size: 16px;">Sarah Johnson</h4>
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">CEO, TechVanguard</p>
                <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">KEYNOTE</span>
              </div>
              <div style="text-align: center; background: transparent; padding: 20px; border-radius: 10px;">
                <img src="https://via.placeholder.com/80x80/343a40/ffffff?text=S2" alt="Speaker" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px;">
                <h4 style="margin: 0 0 5px; color: #343a40; font-size: 16px;">Michael Chen</h4>
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">Innovation Director, FutureScale</p>
                <span style="background: #6c757d; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PANEL</span>
              </div>
            </div>
          </div>

          <!-- Generated Paragraph 3 -->
          <div id="generated-paragraph-3" style="margin: 30px 0;">
            <p style="font-size: 17px; line-height: 1.7; color: #343a40; margin: 0;">
              [GENERATED CONTENT 3: Limited spots and registration encouragement]
            </p>
          </div>

          <!-- Registration CTA Component -->
          <div id="component-registration-cta" style="background: #28a745; color: white; padding: 35px; text-align: center; border-radius: 15px; margin: 35px 0; position: relative;">
            <div style="position: absolute; top: -10px; right: 20px; background: #343a40; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 700;">
              LIMITED SEATS
            </div>
            <h3 style="margin: 0 0 15px; font-size: 22px;"> Reserve Your Spot</h3>
            <p style="margin: 0 0 25px; font-size: 16px; opacity: 0.9;">Join 200+ industry leaders • Complimentary attendance</p>
            <a href="https://register.event.com"
               style="display: inline-block; background: transparent; color: #28a745; padding: 16px 35px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 17px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              Register Free Now
            </a>
            <p style="margin: 20px 0 0; font-size: 14px; opacity: 0.8;"> Bonus: Exclusive strategy guide for attendees</p>
          </div>
        </div>

        <div style="padding: 25px 30px; background: transparent; text-align: center;">
          <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">Can't make it live? All registrants receive the recording.</p>
          <p style="margin: 0; color: #adb5bd; font-size: 12px;">Future of Business Summit • Hosted by Industry Leaders Network</p>
        </div>
      </div>
    `
  },

  // Template 7: Custom Template - Build Your Own
  custom_template: {
    id: 'custom_template',
    name: 'Custom Template',
    description: 'Start from scratch and build your own custom email template',
    preview: 'Empty canvas for creating personalized email designs with custom components and media',
    structure: {
      paragraphs: 0,
      components: []
    },
    ollamaPrompt: `Write a custom email from {senderName} at {companyName} to {recipientName} at {company}.

Write a SINGLE coherent business email that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Brief, warm greeting and introduction (1-2 sentences)
2. Main body: Your custom message (2-3 sentences)
3. Closing: Clear next steps and call to action (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Each paragraph should naturally lead to the next
- Use proper paragraph breaks for readability
- Professional yet conversational tone
- Be concise but compelling

Write the complete email now (without subject line or email headers):`,

    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: transparent;">
        <!-- Empty Template - User can add components -->
        <div id="custom-email-content" style="padding: 40px; background: transparent; min-height: 400px;">
          <div style="text-align: center; padding: 60px 20px; background: transparent; border: 2px dashed #dee2e6; border-radius: 8px;">
            <svg style="width: 48px; height: 48px; color: #6c757d; margin-bottom: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <h3 style="color: #343a40; margin: 0 0 10px; font-size: 20px;">Start Building Your Custom Email</h3>
            <p style="color: #6c757d; margin: 0; font-size: 14px;">Click 'Customize' to add your own components, text, images, and styling</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 25px 40px; background: transparent; border-top: 1px solid #dee2e6; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            Build your perfect email template with custom components
          </p>
        </div>
      </div>
    `
  }
};

export default EMAIL_TEMPLATES;