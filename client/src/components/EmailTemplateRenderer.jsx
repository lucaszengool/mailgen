import React from 'react';
import { EMAIL_TEMPLATES } from '../data/emailTemplatesConsistent.js';

/**
 * Shared Email Template Renderer
 * This component renders templates EXACTLY as they will appear in generated emails
 * Used by both customization preview and email generation for consistency
 */
const EmailTemplateRenderer = ({
  templateId,
  customizations = {},
  isEditable = false,
  onEdit = () => {},
  sampleData = {
    name: 'Sarah Johnson',
    company: 'TechCorp Industries',
    senderName: 'James Wilson',
    senderCompany: 'Your Company',
    email: 'sarah@techcorp.com'
  }
}) => {
  const template = EMAIL_TEMPLATES[templateId];

  if (!template) {
    return <div className="text-red-500">Template not found: {templateId}</div>;
  }

  // Helper to render custom media at a specific insertion point
  const renderCustomMediaAt = (insertPoint) => {
    const customMedia = getCustomization('customMedia', []);
    return customMedia
      ?.filter(m => m.insertAfter === insertPoint)
      .map((media, idx) => (
        <div key={media.id || idx} style={{
          margin: '20px 0',
          textAlign: media.alignment || 'center'
        }}>
          <img
            src={media.url}
            alt={`Custom media ${idx + 1}`}
            style={{
              width: media.width || '400px',
              maxWidth: '100%',
              display: 'block',
              margin: media.alignment === 'center' ? '0 auto' : media.alignment === 'right' ? '0 0 0 auto' : '0'
            }}
          />
        </div>
      ));
  };

  // Replace placeholders with sample data - define early
  const replacePlaceholders = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/{name}/g, sampleData.name)
      .replace(/{company}/g, sampleData.company)
      .replace(/{senderName}/g, sampleData.senderName)
      .replace(/{senderCompany}/g, sampleData.senderCompany)
      .replace(/\\n/g, '\n');
  };

  // Handle nested customizations structure - support both direct and nested access
  const getCustomization = (path, fallback) => {
    // Try direct access first (customizations.headerTitle)
    if (customizations[path] !== undefined) {
      return customizations[path];
    }

    // Try nested access (customizations.customizations.headerTitle)
    if (customizations.customizations && customizations.customizations[path] !== undefined) {
      return customizations.customizations[path];
    }

    return fallback;
  };

  // Apply customizations with fallbacks to template defaults
  const config = {
    // Subject line - template-specific defaults
    subject: replacePlaceholders(getCustomization('subject',
      template.subject ||
      (templateId === 'modern_tech' ? 'Transform Your Business with AI-Powered Solutions' :
       templateId === 'professional_partnership' ? 'Partnership Opportunity with {company}' :
       templateId === 'executive_outreach' ? 'Strategic Partnership Proposal for {company}' :
       templateId === 'product_launch' ? '🚀 Exclusive Early Access: Revolutionary New Platform' :
       templateId === 'consultative_sales' ? 'Strategic Assessment Opportunity for {company}' :
       templateId === 'event_invitation' ? 'You\'re Invited: Future of Business Summit' :
       'Partnership Opportunity with {company}')
    )),

    // Basic customizations
    greeting: replacePlaceholders(getCustomization('greeting', 'Hi {name},')),
    signature: replacePlaceholders(getCustomization('signature', 'Best regards,\\n{senderName}\\n{senderCompany}')),
    logo: getCustomization('logo', ''),  // Company logo URL or base64

    // Advanced customizations
    headerTitle: replacePlaceholders(getCustomization('headerTitle',
      templateId === 'modern_tech' ? 'Transform Your Business with AI' :
      templateId === 'professional_partnership' ? 'Building Strategic Partnerships' :
      templateId === 'executive_outreach' ? 'Executive Partnership Proposal' :
      templateId === 'product_launch' ? 'Introducing Revolutionary Solutions' :
      templateId === 'consultative_sales' ? 'Strategic Business Partnership' :
      templateId === 'event_invitation' ? 'Industry Innovation Summit' :
      'Partnership Opportunity'
    )),
    mainHeading: replacePlaceholders(getCustomization('mainHeading', `Revolutionizing {company} with AI-Powered Solutions`)),
    buttonText: replacePlaceholders(getCustomization('buttonText', 'Schedule Your Free Demo')),
    buttonUrl: getCustomization('buttonUrl', 'https://calendly.com/meeting'),
    primaryColor: getCustomization('primaryColor', '#10b981'),
    accentColor: getCustomization('accentColor', '#047857'),
    testimonialText: replacePlaceholders(getCustomization('testimonialText', '"This solution transformed our operations. We saw remarkable results in just weeks."')),
    testimonialAuthor: replacePlaceholders(getCustomization('testimonialAuthor', 'CEO, Industry Leader')),

    // Text styling options
    textSize: getCustomization('textSize', '16px'),
    textColor: getCustomization('textColor', '#000000'),
    fontWeight: getCustomization('fontWeight', 'normal'),
    fontStyle: getCustomization('fontStyle', 'normal'),
    fontSize: getCustomization('textSize', '16px'), // Alias for textSize

    // Body text specific styling
    bodyTextSize: getCustomization('textSize', '16px'),
    bodyTextColor: getCustomization('textColor', '#000000'),
    bodyTextWeight: getCustomization('fontWeight', 'normal'),
    bodyTextStyle: getCustomization('fontStyle', 'normal'),

    // Greeting text styling
    greetingSize: getCustomization('textSize', '18px'),
    greetingColor: getCustomization('textColor', '#000000'),
    greetingWeight: getCustomization('fontWeight', 'normal'),
    greetingStyle: getCustomization('fontStyle', 'normal'),

    // Signature styling
    signatureSize: getCustomization('textSize', '16px'),
    signatureColor: getCustomization('textColor', '#000000'),
    signatureWeight: getCustomization('fontWeight', 'normal'),
    signatureStyle: getCustomization('fontStyle', 'normal'),

    // Stats component colors
    statsBackground: getCustomization('statsBackground', '#f8f9fa'),
    statsBorderColor: getCustomization('statsBorderColor', '#e9ecef'),

    // Testimonial component colors
    testimonialBackground: getCustomization('testimonialBackground', '#f8f9fa'),
    testimonialBorderColor: getCustomization('testimonialBorderColor', getCustomization('primaryColor', '#10b981')),
    testimonialAvatarBackground: getCustomization('testimonialAvatarBackground', '#e9ecef'),

    // Feature grid colors
    featureBackground: getCustomization('featureBackground', '#f8f9fa'),
    featureCardBackground: getCustomization('featureCardBackground', 'white'),
    featureIconBackground: getCustomization('featureIconBackground', getCustomization('primaryColor', '#10b981')),

    // Methodology colors
    methodologyBackground: getCustomization('methodologyBackground', '#f8f9fa'),
    methodologyCircleBackground: getCustomization('methodologyCircleBackground', '#e9ecef'),

    // Case study colors
    caseStudyBackground: getCustomization('caseStudyBackground', '#f8f9fa'),
    caseStudyBorderColor: getCustomization('caseStudyBorderColor', getCustomization('primaryColor', '#10b981')),

    // Agenda colors
    agendaBackground: getCustomization('agendaBackground', '#f8f9fa'),
    agendaCardBackground: getCustomization('agendaCardBackground', 'white'),
    agendaTimeBadgeBackground: getCustomization('agendaTimeBadgeBackground', '#e9ecef'),

    // Speaker colors
    speakerBackground: getCustomization('speakerBackground', '#f8f9fa'),
    speakerCardBackground: getCustomization('speakerCardBackground', 'white'),
    speakerAvatarBackground: getCustomization('speakerAvatarBackground', '#e9ecef'),

    // Urgency banner colors
    urgencyBackground: getCustomization('urgencyBackground', '#fff9e6'),
    urgencyBorderColor: getCustomization('urgencyBorderColor', '#ffe4a3')
  };

  const EditableText = ({ children, field, multiline = false, className = "" }) => {
    if (!isEditable) {
      return <span className={className}>{children}</span>;
    }

    // Use getCustomization to access field value consistently
    const fieldValue = getCustomization(field, children);

    if (multiline) {
      return (
        <textarea
          value={fieldValue}
          onChange={(e) => onEdit(field, e.target.value)}
          className={`${className} border-0 hover:border hover:border-green-400 focus:border focus:border-green-500 focus:outline-none resize-none bg-transparent`}
          style={{ minHeight: '60px', width: '100%', padding: '0' }}
        />
      );
    }

    return (
      <input
        type="text"
        value={fieldValue}
        onChange={(e) => onEdit(field, e.target.value)}
        className={`${className} border-0 hover:border-b hover:border-green-400 focus:border-b focus:border-green-500 focus:outline-none bg-transparent`}
        style={{ width: '100%', padding: '0' }}
      />
    );
  };

  // Render template-specific content
  const renderTemplateContent = () => {
    switch (templateId) {
      case 'professional_partnership':
        return (
          <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", maxWidth: '600px', margin: '0 auto', background: '#ffffff' }}>
            {/* Custom Media: Start of Email */}
            {renderCustomMediaAt('start')}

            {/* Logo Component */}
            <div style={{ textAlign: 'center', padding: '30px 20px', background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              {config.logo ? (
                <img
                  src={config.logo}
                  alt="Company Logo"
                  style={{
                    maxWidth: '180px',
                    maxHeight: '60px',
                    margin: '0 auto',
                    display: 'block',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div style={{ width: '180px', height: '60px', background: config.primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '18px', fontWeight: 'bold' }}>
                  COMPANY LOGO
                </div>
              )}
              <p style={{ margin: '10px 0 0', color: '#6c757d', fontSize: '14px' }}>
                {isEditable ? (
                  <EditableText field="headerTitle" className="text-center">
                    {config.headerTitle}
                  </EditableText>
                ) : config.headerTitle}
              </p>
            </div>

            {/* Custom Media: After Logo */}
            {renderCustomMediaAt('logo')}

            <div style={{ padding: '40px 30px' }}>
              {/* Greeting */}
              <h2 style={{ color: '#343a40', margin: '0 0 30px', fontSize: '24px' }}>
                {isEditable ? (
                  <EditableText field="greeting">
                    {replacePlaceholders(config.greeting)}
                  </EditableText>
                ) : replacePlaceholders(config.greeting)}
              </h2>

              {/* Custom Media: After Greeting */}
              {renderCustomMediaAt('greeting')}

              {/* Generated Paragraph 1 */}
              <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#343a40', margin: 0 }}>
                  {isEditable ? (
                    <EditableText field="introText" multiline className="w-full">
                      I noticed that {sampleData.company} is leading innovation in your industry. Our strategic partnership could unlock significant value for both organizations.
                    </EditableText>
                  ) : `I noticed that ${sampleData.company} is leading innovation in your industry. Our strategic partnership could unlock significant value for both organizations.`}
                </p>
              </div>

              {/* Custom Media: After Paragraph 1 */}
              {renderCustomMediaAt('paragraph-1')}

              {/* CTA Button Component */}
              <div style={{ textAlign: 'center', margin: '35px 0' }}>
                <a href={config.buttonUrl || 'https://calendly.com/partnership'} style={{
                  display: 'inline-block',
                  background: config.primaryColor,
                  color: 'white',
                  padding: '14px 30px',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {isEditable ? (
                    <>
                      <EditableText field="buttonText" className="text-white bg-transparent border-0">
                        {config.buttonText}
                      </EditableText>
                      <div style={{ fontSize: '10px', marginTop: '5px' }}>
                        <EditableText field="buttonUrl" className="text-green-200">
                          URL: {config.buttonUrl || 'https://calendly.com/partnership'}
                        </EditableText>
                      </div>
                    </>
                  ) : config.buttonText}
                </a>
                <p style={{ margin: '12px 0 0', color: '#6c757d', fontSize: '14px' }}>15-minute introductory call</p>
              </div>

              {/* Custom Media: After CTA */}
              {renderCustomMediaAt('cta')}

              {/* Generated Paragraph 2 */}
              <div style={{ margin: '25px 0' }}>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#343a40', margin: 0 }}>
                  {isEditable ? (
                    <EditableText field="valueText" multiline className="w-full">
                      Our complementary strengths create a powerful opportunity for mutual growth. We bring proven expertise in AI-powered solutions, while {sampleData.company} offers deep market insights and customer relationships.
                    </EditableText>
                  ) : `Our complementary strengths create a powerful opportunity for mutual growth. We bring proven expertise in AI-powered solutions, while ${sampleData.company} offers deep market insights and customer relationships.`}
                </p>
              </div>

              {/* Custom Media: After Paragraph 2 */}
              {renderCustomMediaAt('paragraph-2')}

              {/* Testimonial Component */}
              <div style={{ background: '#f8f9fa', borderLeft: '4px solid ' + config.primaryColor, padding: '20px', margin: '30px 0', borderRadius: '0 6px 6px 0' }}>
                <blockquote style={{ margin: 0, fontStyle: 'italic', color: '#495057', fontSize: '15px', lineHeight: '1.5' }}>
                  {isEditable ? (
                    <EditableText field="testimonialText" multiline className="w-full bg-transparent">
                      {config.testimonialText}
                    </EditableText>
                  ) : config.testimonialText}
                </blockquote>
                <cite style={{ display: 'block', textAlign: 'right', marginTop: '12px', color: '#6c757d', fontSize: '14px', fontWeight: '600' }}>
                  — {isEditable ? (
                    <EditableText field="testimonialAuthor" className="bg-transparent">
                      {config.testimonialAuthor}
                    </EditableText>
                  ) : config.testimonialAuthor}
                </cite>
              </div>

              {/* Custom Media: After Testimonial */}
              {renderCustomMediaAt('testimonial')}

              {/* Generated Paragraph 3 */}
              <div style={{ margin: '25px 0 0' }}>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#343a40', margin: 0 }}>
                  {isEditable ? (
                    <EditableText field="ctaText" multiline className="w-full">
                      Would you be available for a strategic discussion next week? I'd love to explore how we can create value together.
                    </EditableText>
                  ) : `Would you be available for a strategic discussion next week? I'd love to explore how we can create value together.`}
                </p>
              </div>

              {/* Custom Media: After Paragraph 3 */}
              {renderCustomMediaAt('paragraph-3')}
            </div>

            {/* Footer/Signature Section */}
            <div style={{ padding: '25px 30px', background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
              <p style={{
                whiteSpace: 'pre-line',
                fontSize: config.signatureSize || '14px',
                color: config.signatureColor || '#6c757d',
                margin: 0,
                lineHeight: '1.6',
                fontWeight: config.signatureWeight || config.fontWeight,
                fontStyle: config.signatureStyle || config.fontStyle
              }}>
                {isEditable ? (
                  <EditableText field="signature" multiline className="w-full">
                    {replacePlaceholders(config.signature)}
                  </EditableText>
                ) : replacePlaceholders(config.signature)}
              </p>
            </div>

            {/* Custom Media: After Signature / End of Email */}
            {renderCustomMediaAt('signature')}
            {renderCustomMediaAt('end')}
          </div>
        );

      case 'modern_tech':
        return (
          <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", maxWidth: '600px', margin: '0 auto', background: 'transparent',  overflow: 'hidden' }}>
            {/* Header Banner - Matches emailTemplates.js exactly */}
            <div style={{
              background: config.primaryColor,
              padding: '40px 30px',
              textAlign: 'center',
              color: 'white'
            }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 10px' }}>
                {isEditable ? (
                  <EditableText field="headerTitle" className="text-white bg-transparent border-white text-center w-full">
                    {config.headerTitle}
                  </EditableText>
                ) : config.headerTitle}
              </h1>
              <p style={{ fontSize: '18px', margin: '0', opacity: '0.9' }}>
                Accelerating Tech Excellence for {sampleData.company}
              </p>
            </div>

            <div style={{ padding: '40px 30px' }}>

            {/* Greeting */}
            <p style={{
              fontSize: config.greetingSize || config.textSize,
              color: config.greetingColor || config.textColor,
              margin: '20px 0',
              lineHeight: '1.6',
              fontWeight: config.greetingWeight || config.fontWeight,
              fontStyle: config.greetingStyle || config.fontStyle
            }}>
              {isEditable ? (
                <EditableText field="greeting">
                  {replacePlaceholders(config.greeting)}
                </EditableText>
              ) : replacePlaceholders(config.greeting)}
            </p>

            {/* Main Heading */}
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#333333', margin: '0 0 16px', lineHeight: '1.6' }}>
              {isEditable ? (
                <EditableText field="mainHeading" className="w-full">
                  {config.mainHeading.replace('{company}', sampleData.company)}
                </EditableText>
              ) : config.mainHeading.replace('{company}', sampleData.company)}
            </p>

            {/* Content paragraphs */}
            <p style={{
              fontSize: config.bodyTextSize || config.textSize,
              lineHeight: '1.6',
              color: config.bodyTextColor || config.textColor,
              margin: '0 0 16px',
              fontWeight: config.bodyTextWeight || config.fontWeight,
              fontStyle: config.bodyTextStyle || config.fontStyle
            }}>
              {isEditable ? (
                <EditableText field="paragraph1" multiline className="w-full">
                  I noticed that {sampleData.company} is at the forefront of technological innovation in your industry. Our AI-powered platform has helped similar companies achieve remarkable results, and I believe we could deliver significant value to your organization.
                </EditableText>
              ) : `I noticed that ${sampleData.company} is at the forefront of technological innovation in your industry. Our AI-powered platform has helped similar companies achieve remarkable results, and I believe we could deliver significant value to your organization.`}
            </p>

            <p style={{
              fontSize: config.bodyTextSize || config.textSize,
              lineHeight: '1.6',
              color: config.bodyTextColor || config.textColor,
              margin: '0 0 16px',
              fontWeight: config.bodyTextWeight || config.fontWeight,
              fontStyle: config.bodyTextStyle || config.fontStyle
            }}>
              {isEditable ? (
                <EditableText field="paragraph2" multiline className="w-full">
                  Our solution integrates seamlessly with your existing infrastructure, requiring minimal setup time while delivering maximum impact. Within just 30 days, you'll see measurable improvements in efficiency and substantial cost savings.
                </EditableText>
              ) : `Our solution integrates seamlessly with your existing infrastructure, requiring minimal setup time while delivering maximum impact. Within just 30 days, you'll see measurable improvements in efficiency and substantial cost savings.`}
            </p>

            {/* Feature Grid - Matches backend exactly */}
            {template.structure.components.includes('feature_grid') && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                margin: '35px 0',
                padding: '25px',
                background: config.primaryColor,
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>$</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{config.customizations?.features?.[0] || '40% Cost Reduction'}</h3>
                  <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>Automate repetitive processes</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚡</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{config.customizations?.features?.[1] || '10x Faster Processing'}</h3>
                  <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>Real-time insights and reporting</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>✓</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{config.customizations?.features?.[2] || '100% Compliance'}</h3>
                  <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>Meet all industry standards</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>24/7</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{config.customizations?.features?.[3] || 'Global Scalability'}</h3>
                  <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>Round-the-clock assistance</p>
                </div>
              </div>
            )}

            {/* CTA Button - Matches backend exactly */}
            <div style={{ textAlign: 'center', margin: '35px 0' }}>
              <a href={config.buttonUrl || 'https://demo.ourplatform.com'} style={{
                display: 'inline-block',
                background: config.primaryColor,
                color: 'white',
                padding: '16px 35px',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '17px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                {isEditable ? (
                  <>
                    <EditableText field="buttonText" className="text-white bg-transparent border-0">
                      {config.buttonText}
                    </EditableText>
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>
                      <EditableText field="buttonUrl" className="text-green-200">
                        URL: {config.buttonUrl || 'https://demo.ourplatform.com'}
                      </EditableText>
                    </div>
                  </>
                ) : config.buttonText}
              </a>
              <p style={{ margin: '15px 0 0', color: '#6c757d', fontSize: '14px' }}>Live demo • No signup required</p>
            </div>
            </div> {/* Close padding div */}

            {/* Social Proof Component */}
            <div style={{
              background: '#343a40',
              color: 'white',
              padding: '30px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 20px', fontSize: '16px' }}>Trusted by 500+ tech companies</p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '30px',
                opacity: '0.7',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>TechCorp</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>InnovateAI</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>ScaleUp</span>
              </div>
            </div>

            {/* Signature */}
            <div style={{ padding: '30px' }}>
              <p style={{
                whiteSpace: 'pre-line',
                fontSize: config.signatureSize || config.textSize,
                color: config.signatureColor || config.textColor,
                margin: '0',
                lineHeight: '1.6',
                fontWeight: config.signatureWeight || config.fontWeight,
                fontStyle: config.signatureStyle || config.fontStyle
              }}>
                {isEditable ? (
                  <EditableText field="signature" multiline className="w-full">
                    {replacePlaceholders(config.signature)}
                  </EditableText>
                ) : replacePlaceholders(config.signature)}
              </p>
            </div>
          </div>
        );

      case 'executive_outreach':
        return (
          <div style={{
            fontFamily: "'Georgia', serif",
            maxWidth: '650px',
            margin: '0 auto',
            background: '#ffffff',
            border: '1px solid #e5e5e5'
          }}>
            {/* Executive Header Component - Dark gray background, white text, green border-bottom */}
            <div style={{
              background: '#343a40',
              color: 'white',
              padding: '35px 40px',
              borderBottom: '3px solid #28a745'
            }}>
              <h1 style={{
                margin: '0 0 8px',
                fontSize: '26px',
                fontWeight: '400',
                letterSpacing: '0.5px'
              }}>
                {isEditable ? (
                  <EditableText field="headerTitle" className="text-white">
                    {config.headerTitle}
                  </EditableText>
                ) : config.headerTitle}
              </h1>
              <p style={{
                margin: '0',
                fontSize: '16px',
                opacity: '0.9'
              }}>
                {isEditable ? (
                  <EditableText field="headerSubtitle" className="text-white">
                    Exclusively for {sampleData.company} Leadership
                  </EditableText>
                ) : `Exclusively for ${sampleData.company} Leadership`}
              </p>
            </div>

            {/* Main Content Area */}
            <div style={{ padding: '45px 40px' }}>
              {/* Formal Greeting */}
              <p style={{
                margin: '0 0 25px',
                fontSize: config.greetingSize || config.textSize || '18px',
                color: config.greetingColor || config.textColor || '#343a40',
                fontWeight: config.greetingWeight || config.fontWeight || 'normal',
                fontStyle: config.greetingStyle || config.fontStyle || 'normal'
              }}>
                {isEditable ? (
                  <EditableText field="greeting">
                    {replacePlaceholders(config.greeting)}
                  </EditableText>
                ) : replacePlaceholders(config.greeting)}
              </p>

              {/* Generated Paragraph 1 */}
              <div style={{ marginBottom: '25px' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph1" multiline className="w-full">
                      I hope this message finds you well. I'm reaching out because I believe there's a strategic opportunity that could significantly impact {sampleData.company}'s growth trajectory in the coming year.
                    </EditableText>
                  ) : `I hope this message finds you well. I'm reaching out because I believe there's a strategic opportunity that could significantly impact ${sampleData.company}'s growth trajectory in the coming year.`}
                </p>
              </div>

              {/* Stats Showcase Component - Light gray background, green left border */}
              {template.structure?.components?.includes('stats_showcase') && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '30px',
                  margin: '35px 0',
                  borderLeft: '4px solid #28a745'
                }}>
                  <h3 style={{
                    margin: '0 0 20px',
                    color: '#343a40',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    {isEditable ? (
                      <EditableText field="statsTitle">
                        Strategic Impact Metrics
                      </EditableText>
                    ) : 'Strategic Impact Metrics'}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '20px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#28a745',
                        marginBottom: '5px'
                      }}>
                        {isEditable ? (
                          <EditableText field="stat1Value">340%</EditableText>
                        ) : '340%'}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {isEditable ? (
                          <EditableText field="stat1Label">ROI Increase</EditableText>
                        ) : 'ROI Increase'}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#343a40',
                        marginBottom: '5px'
                      }}>
                        {isEditable ? (
                          <EditableText field="stat2Value">18 Mo</EditableText>
                        ) : '18 Mo'}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {isEditable ? (
                          <EditableText field="stat2Label">Avg. Payback</EditableText>
                        ) : 'Avg. Payback'}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#28a745',
                        marginBottom: '5px'
                      }}>
                        {isEditable ? (
                          <EditableText field="stat3Value">95%</EditableText>
                        ) : '95%'}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {isEditable ? (
                          <EditableText field="stat3Label">Success Rate</EditableText>
                        ) : 'Success Rate'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Paragraph 2 */}
              <div style={{ margin: '25px 0' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph2" multiline className="w-full">
                      Our strategic approach has helped Fortune 500 companies achieve remarkable transformations, and I see similar potential for {sampleData.company}.
                    </EditableText>
                  ) : `Our strategic approach has helped Fortune 500 companies achieve remarkable transformations, and I see similar potential for ${sampleData.company}.`}
                </p>
              </div>

              {/* Generated Paragraph 3 */}
              <div style={{ margin: '25px 0' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph3" multiline className="w-full">
                      I'd welcome the opportunity to discuss how we can create similar value for {sampleData.company}. Would you have 30 minutes next week for a strategic conversation?
                    </EditableText>
                  ) : `I'd welcome the opportunity to discuss how we can create similar value for ${sampleData.company}. Would you have 30 minutes next week for a strategic conversation?`}
                </p>
              </div>

              {/* Testimonial Component - Light gray background, border */}
              {template.structure?.components?.includes('testimonial') && (
                <div style={{
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '25px',
                  margin: '35px 0',
                  borderRadius: '4px'
                }}>
                  <blockquote style={{
                    margin: '0 0 15px',
                    fontStyle: 'italic',
                    color: '#495057',
                    fontSize: '16px',
                    lineHeight: '1.6'
                  }}>
                    {isEditable ? (
                      <EditableText field="testimonialText" multiline className="w-full bg-transparent">
                        "This strategic partnership transformed our market position. The executive team was impressed with both the strategic vision and execution capabilities."
                      </EditableText>
                    ) : '"This strategic partnership transformed our market position. The executive team was impressed with both the strategic vision and execution capabilities."'}
                  </blockquote>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: config.testimonialAvatarBackground || '#e9ecef',
                      marginRight: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: '#343a40',
                      fontWeight: '600'
                    }}>●</div>
                    <div>
                      <cite style={{
                        fontWeight: '600',
                        color: '#343a40',
                        fontStyle: 'normal',
                        display: 'block'
                      }}>
                        {isEditable ? (
                          <EditableText field="testimonialAuthor" className="bg-transparent">
                            Michael Rodriguez
                          </EditableText>
                        ) : 'Michael Rodriguez'}
                      </cite>
                      <span style={{ color: '#6c757d', fontSize: '14px' }}>
                        {isEditable ? (
                          <EditableText field="testimonialTitle" className="bg-transparent">
                            CEO & Chairman, Enterprise Solutions Inc.
                          </EditableText>
                        ) : 'CEO & Chairman, Enterprise Solutions Inc.'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Paragraph 4 */}
              <div style={{ margin: '25px 0 0' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph4" multiline className="w-full">
                      Looking forward to exploring this strategic opportunity with you.
                    </EditableText>
                  ) : 'Looking forward to exploring this strategic opportunity with you.'}
                </p>
              </div>
            </div>

            {/* Footer/Signature Section - Light gray background, border-top */}
            <div style={{
              padding: '30px 40px',
              background: '#f8f9fa',
              borderTop: '1px solid #dee2e6'
            }}>
              <p style={{
                margin: '0',
                color: '#495057',
                fontSize: config.signatureSize || config.textSize || '14px',
                lineHeight: '1.6',
                fontWeight: config.signatureWeight || config.fontWeight || 'normal',
                fontStyle: config.signatureStyle || config.fontStyle || 'normal',
                whiteSpace: 'pre-line'
              }}>
                {isEditable ? (
                  <EditableText field="signature" multiline className="w-full">
                    {replacePlaceholders(config.signature)}
                  </EditableText>
                ) : replacePlaceholders(config.signature)}
              </p>
            </div>
          </div>
        );

      case 'product_launch':
        return (
          <div style={{
            fontFamily: config.fontFamily || "'Helvetica Neue', Arial, sans-serif",
            maxWidth: '600px',
            margin: '0 auto',
            background: 'white'
          }}>
            {/* Product Hero Component */}
            <div style={{
              background: '#f8f9fa',
              padding: '50px 30px',
              textAlign: 'center',
              color: config.textColor
            }}>
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                display: 'inline-block',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚀</div>
                <h1 style={{
                  margin: '0 0 10px',
                  fontSize: config.textSize || '24px',
                  fontWeight: config.fontWeight || '700',
                  fontStyle: config.fontStyle,
                  color: config.textColor
                }}>
                  {isEditable ? (
                    <EditableText field="headerTitle">
                      {config.headerTitle}
                    </EditableText>
                  ) : config.headerTitle}
                </h1>
                <p style={{
                  margin: '0',
                  color: config.textColor,
                  fontSize: config.textSize || '16px',
                  fontWeight: config.fontWeight,
                  fontStyle: config.fontStyle
                }}>
                  {isEditable ? (
                    <EditableText field="heroSubtitle">
                      {getCustomization('heroSubtitle', `Game-changing solution for ${sampleData.company}`)}
                    </EditableText>
                  ) : getCustomization('heroSubtitle', `Game-changing solution for ${sampleData.company}`)}
                </p>
              </div>
            </div>

            <div style={{ padding: '40px 30px' }}>
              {/* Generated Paragraph 1 */}
              <div style={{ marginBottom: '30px' }}>
                <p style={{
                  fontSize: config.textSize || '17px',
                  lineHeight: '1.7',
                  color: config.textColor,
                  fontWeight: config.fontWeight,
                  fontStyle: config.fontStyle,
                  margin: '0'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph1" multiline className="w-full">
                      We're thrilled to announce the launch of our revolutionary new platform, specifically designed to address the challenges that companies like {sampleData.company} face in today's competitive landscape.
                    </EditableText>
                  ) : `We're thrilled to announce the launch of our revolutionary new platform, specifically designed to address the challenges that companies like ${sampleData.company} face in today's competitive landscape.`}
                </p>
              </div>

              {/* Feature Highlights Component */}
              <div style={{
                background: config.primaryColor,
                color: 'white',
                padding: '30px',
                borderRadius: '15px',
                margin: '35px 0'
              }}>
                <h3 style={{
                  margin: '0 0 25px',
                  textAlign: 'center',
                  fontSize: '20px'
                }}>
                  What's Inside
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ textAlign: 'center', padding: '15px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>
                      {isEditable ? (
                        <EditableText field="feature1Emoji" className="text-white bg-transparent">
                          {getCustomization('feature1Emoji', '🎯')}
                        </EditableText>
                      ) : getCustomization('feature1Emoji', '🎯')}
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>
                      {isEditable ? (
                        <EditableText field="feature1Title" className="text-white bg-transparent">
                          {getCustomization('feature1Title', 'Smart Targeting')}
                        </EditableText>
                      ) : getCustomization('feature1Title', 'Smart Targeting')}
                    </h4>
                    <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                      {isEditable ? (
                        <EditableText field="feature1Description" className="text-white bg-transparent">
                          {getCustomization('feature1Description', 'AI-powered precision')}
                        </EditableText>
                      ) : getCustomization('feature1Description', 'AI-powered precision')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>
                      {isEditable ? (
                        <EditableText field="feature2Emoji" className="text-white bg-transparent">
                          {getCustomization('feature2Emoji', '⚡')}
                        </EditableText>
                      ) : getCustomization('feature2Emoji', '⚡')}
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>
                      {isEditable ? (
                        <EditableText field="feature2Title" className="text-white bg-transparent">
                          {getCustomization('feature2Title', 'Lightning Speed')}
                        </EditableText>
                      ) : getCustomization('feature2Title', 'Lightning Speed')}
                    </h4>
                    <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                      {isEditable ? (
                        <EditableText field="feature2Description" className="text-white bg-transparent">
                          {getCustomization('feature2Description', '10x faster results')}
                        </EditableText>
                      ) : getCustomization('feature2Description', '10x faster results')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>
                      {isEditable ? (
                        <EditableText field="feature3Emoji" className="text-white bg-transparent">
                          {getCustomization('feature3Emoji', '📊')}
                        </EditableText>
                      ) : getCustomization('feature3Emoji', '📊')}
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>
                      {isEditable ? (
                        <EditableText field="feature3Title" className="text-white bg-transparent">
                          {getCustomization('feature3Title', 'Real-time Analytics')}
                        </EditableText>
                      ) : getCustomization('feature3Title', 'Real-time Analytics')}
                    </h4>
                    <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                      {isEditable ? (
                        <EditableText field="feature3Description" className="text-white bg-transparent">
                          {getCustomization('feature3Description', 'Live performance data')}
                        </EditableText>
                      ) : getCustomization('feature3Description', 'Live performance data')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>
                      {isEditable ? (
                        <EditableText field="feature4Emoji" className="text-white bg-transparent">
                          {getCustomization('feature4Emoji', '🔒')}
                        </EditableText>
                      ) : getCustomization('feature4Emoji', '🔒')}
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>
                      {isEditable ? (
                        <EditableText field="feature4Title" className="text-white bg-transparent">
                          {getCustomization('feature4Title', 'Enterprise Security')}
                        </EditableText>
                      ) : getCustomization('feature4Title', 'Enterprise Security')}
                    </h4>
                    <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                      {isEditable ? (
                        <EditableText field="feature4Description" className="text-white bg-transparent">
                          {getCustomization('feature4Description', 'Bank-level protection')}
                        </EditableText>
                      ) : getCustomization('feature4Description', 'Bank-level protection')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Generated Paragraph 2 */}
              <div style={{ margin: '30px 0' }}>
                <p style={{
                  fontSize: config.textSize || '17px',
                  lineHeight: '1.7',
                  color: config.textColor,
                  fontWeight: config.fontWeight,
                  fontStyle: config.fontStyle,
                  margin: '0'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph2" multiline className="w-full">
                      Join the early adopters who are already experiencing transformative results. As a valued partner, {sampleData.company} gets exclusive early access with special benefits.
                    </EditableText>
                  ) : `Join the early adopters who are already experiencing transformative results. As a valued partner, ${sampleData.company} gets exclusive early access with special benefits.`}
                </p>
              </div>

              {/* Countdown Timer Component */}
              <div style={{
                background: config.accentColor || '#6c757d',
                color: 'white',
                padding: '25px',
                textAlign: 'center',
                borderRadius: '10px',
                margin: '35px 0'
              }}>
                <h3 style={{ margin: '0 0 15px', fontSize: '18px' }}>
                  {isEditable ? (
                    <EditableText field="countdownTitle" className="text-white bg-transparent">
                      {getCustomization('countdownTitle', '⏰ Limited Time Exclusive Access')}
                    </EditableText>
                  ) : getCustomization('countdownTitle', '⏰ Limited Time Exclusive Access')}
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    minWidth: '60px'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {isEditable ? (
                        <EditableText field="countdownDays" className="text-white bg-transparent">
                          {getCustomization('countdownDays', '07')}
                        </EditableText>
                      ) : getCustomization('countdownDays', '07')}
                    </div>
                    <div style={{ fontSize: '12px', opacity: '0.9' }}>DAYS</div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    minWidth: '60px'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {isEditable ? (
                        <EditableText field="countdownHours" className="text-white bg-transparent">
                          {getCustomization('countdownHours', '14')}
                        </EditableText>
                      ) : getCustomization('countdownHours', '14')}
                    </div>
                    <div style={{ fontSize: '12px', opacity: '0.9' }}>HOURS</div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    minWidth: '60px'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {isEditable ? (
                        <EditableText field="countdownMins" className="text-white bg-transparent">
                          {getCustomization('countdownMins', '32')}
                        </EditableText>
                      ) : getCustomization('countdownMins', '32')}
                    </div>
                    <div style={{ fontSize: '12px', opacity: '0.9' }}>MINS</div>
                  </div>
                </div>
                <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
                  {isEditable ? (
                    <EditableText field="countdownSubtext" className="text-white bg-transparent">
                      {getCustomization('countdownSubtext', 'Early access ends soon!')}
                    </EditableText>
                  ) : getCustomization('countdownSubtext', 'Early access ends soon!')}
                </p>
              </div>

              {/* Generated Paragraph 3 */}
              <div style={{ margin: '30px 0' }}>
                <p style={{
                  fontSize: config.textSize || '17px',
                  lineHeight: '1.7',
                  color: config.textColor,
                  fontWeight: config.fontWeight,
                  fontStyle: config.fontStyle,
                  margin: '0'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph3" multiline className="w-full">
                      Don't miss this opportunity to be among the first to leverage this game-changing technology. Secure your exclusive access today.
                    </EditableText>
                  ) : "Don't miss this opportunity to be among the first to leverage this game-changing technology. Secure your exclusive access today."}
                </p>
              </div>

              {/* CTA Button Component */}
              <div style={{ textAlign: 'center', margin: '35px 0' }}>
                <a href={config.buttonUrl || 'https://earlyaccess.product.com'} style={{
                  display: 'inline-block',
                  background: config.primaryColor,
                  color: 'white',
                  padding: '18px 40px',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  fontWeight: '700',
                  fontSize: '18px',
                  boxShadow: '0 6px 25px rgba(40,167,69,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {isEditable ? (
                    <>
                      <EditableText field="buttonText" className="text-white bg-transparent border-0">
                        {config.buttonText}
                      </EditableText>
                      <div style={{ fontSize: '10px', marginTop: '5px' }}>
                        <EditableText field="buttonUrl" className="text-green-200">
                          URL: {config.buttonUrl || 'https://earlyaccess.product.com'}
                        </EditableText>
                      </div>
                    </>
                  ) : config.buttonText}
                </a>
                <p style={{
                  margin: '15px 0 0',
                  color: config.textColor,
                  fontSize: config.textSize || '14px',
                  fontWeight: config.fontWeight,
                  fontStyle: config.fontStyle
                }}>
                  🎁 Includes exclusive launch bonuses worth $500
                </p>
              </div>
            </div>
          </div>
        );

      case 'consultative_sales':
        return (
          <div style={{
            fontFamily: "'Times New Roman', serif",
            maxWidth: '620px',
            margin: '0 auto',
            background: 'white',
            border: '2px solid #e8e8e8'
          }}>
            {/* Expert Header Component */}
            <div style={{
              background: 'white',
              padding: '35px 40px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#343a40',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  flexShrink: 0
                }}>
                  {config.logo ? (
                    <img src={config.logo} alt="Expert" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : '●'}
                </div>
                <div>
                  <h2 style={{
                    margin: '0 0 5px',
                    fontSize: '22px',
                    color: '#343a40'
                  }}>
                    {isEditable ? (
                      <EditableText field="headerTitle">
                        {config.headerTitle}
                      </EditableText>
                    ) : config.headerTitle}
                  </h2>
                  <p style={{
                    margin: '0',
                    color: '#6c757d',
                    fontSize: '16px'
                  }}>
                    {isEditable ? (
                      <EditableText field="headerSubtitle">
                        Insights for {sampleData.company} Leadership
                      </EditableText>
                    ) : `Insights for ${sampleData.company} Leadership`}
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{
                      background: '#f8f9fa',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#343a40',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      INDUSTRY EXPERT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ padding: '40px' }}>
              {/* Formal Greeting */}
              <p style={{
                margin: '0 0 25px',
                fontSize: config.greetingSize || config.textSize || '16px',
                color: config.greetingColor || config.textColor || '#343a40',
                fontWeight: config.greetingWeight || config.fontWeight || 'normal',
                fontStyle: config.greetingStyle || config.fontStyle || 'normal'
              }}>
                {isEditable ? (
                  <EditableText field="greeting">
                    {replacePlaceholders(config.greeting)}
                  </EditableText>
                ) : replacePlaceholders(config.greeting)}
              </p>

              {/* Generated Paragraph 1 */}
              <div style={{ marginBottom: '25px' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph1" multiline className="w-full">
                      I've been following {sampleData.company}'s impressive growth and strategic initiatives. Based on my experience helping similar organizations navigate industry challenges, I believe there are specific opportunities we should discuss.
                    </EditableText>
                  ) : `I've been following ${sampleData.company}'s impressive growth and strategic initiatives. Based on my experience helping similar organizations navigate industry challenges, I believe there are specific opportunities we should discuss.`}
                </p>
              </div>

              {/* Generated Paragraph 2 */}
              <div style={{ margin: '25px 0' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph2" multiline className="w-full">
                      Our consultative approach has helped organizations achieve 3x revenue growth while optimizing operational efficiency. I'd like to explore how we can achieve similar results for {sampleData.company}.
                    </EditableText>
                  ) : `Our consultative approach has helped organizations achieve 3x revenue growth while optimizing operational efficiency. I'd like to explore how we can achieve similar results for ${sampleData.company}.`}
                </p>
              </div>

              {/* Methodology Component */}
              {template.structure?.components?.includes('methodology') && (
                <div style={{
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  padding: '30px',
                  margin: '35px 0'
                }}>
                  <h3 style={{
                    margin: '0 0 20px',
                    color: '#343a40',
                    fontSize: '18px',
                    textAlign: 'center'
                  }}>
                    {isEditable ? (
                      <EditableText field="methodologyTitle">
                        {getCustomization('methodologyTitle', 'Our Proven Framework')}
                      </EditableText>
                    ) : getCustomization('methodologyTitle', 'Our Proven Framework')}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '15px' }}>
                      <div style={{
                        background: '#28a745',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        fontWeight: 'bold'
                      }}>1</div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#343a40' }}>
                        {isEditable ? (
                          <EditableText field="step1Title">
                            {getCustomization('step1Title', 'ANALYZE')}
                          </EditableText>
                        ) : getCustomization('step1Title', 'ANALYZE')}
                      </h4>
                      <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>
                        {isEditable ? (
                          <EditableText field="step1Description">
                            {getCustomization('step1Description', 'Current state assessment')}
                          </EditableText>
                        ) : getCustomization('step1Description', 'Current state assessment')}
                      </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '15px' }}>
                      <div style={{
                        background: '#6c757d',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        fontWeight: 'bold'
                      }}>2</div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#343a40' }}>
                        {isEditable ? (
                          <EditableText field="step2Title">
                            {getCustomization('step2Title', 'STRATEGIZE')}
                          </EditableText>
                        ) : getCustomization('step2Title', 'STRATEGIZE')}
                      </h4>
                      <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>
                        {isEditable ? (
                          <EditableText field="step2Description">
                            {getCustomization('step2Description', 'Custom solution design')}
                          </EditableText>
                        ) : getCustomization('step2Description', 'Custom solution design')}
                      </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '15px' }}>
                      <div style={{
                        background: '#28a745',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        fontWeight: 'bold'
                      }}>3</div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#343a40' }}>
                        {isEditable ? (
                          <EditableText field="step3Title">
                            {getCustomization('step3Title', 'EXECUTE')}
                          </EditableText>
                        ) : getCustomization('step3Title', 'EXECUTE')}
                      </h4>
                      <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>
                        {isEditable ? (
                          <EditableText field="step3Description">
                            {getCustomization('step3Description', 'Implementation & results')}
                          </EditableText>
                        ) : getCustomization('step3Description', 'Implementation & results')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Paragraph 3 */}
              <div style={{ margin: '25px 0' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph3" multiline className="w-full">
                      Our methodology focuses on deep analysis of your current operations, strategic planning tailored to your specific needs, and meticulous execution to ensure sustainable results.
                    </EditableText>
                  ) : `Our methodology focuses on deep analysis of your current operations, strategic planning tailored to your specific needs, and meticulous execution to ensure sustainable results.`}
                </p>
              </div>

              {/* Case Study Component */}
              {template.structure?.components?.includes('case_study') && (
                <div style={{
                  borderLeft: '4px solid #28a745',
                  background: '#f8f9fa',
                  padding: '25px',
                  margin: '35px 0'
                }}>
                  <h3 style={{
                    margin: '0 0 15px',
                    color: '#28a745',
                    fontSize: '16px'
                  }}>
                    {isEditable ? (
                      <EditableText field="caseStudyTitle">
                        {getCustomization('caseStudyTitle', '📊 Recent Success Story')}
                      </EditableText>
                    ) : getCustomization('caseStudyTitle', '📊 Recent Success Story')}
                  </h3>
                  <p style={{
                    margin: '0 0 15px',
                    fontStyle: 'italic',
                    color: '#6c757d',
                    fontSize: '15px',
                    lineHeight: '1.6'
                  }}>
                    {isEditable ? (
                      <EditableText field="caseStudyText" multiline className="w-full">
                        {getCustomization('caseStudyText', '"Similar manufacturing company increased operational efficiency by 180% and reduced costs by $2.3M annually using our strategic framework."')}
                      </EditableText>
                    ) : getCustomization('caseStudyText', '"Similar manufacturing company increased operational efficiency by 180% and reduced costs by $2.3M annually using our strategic framework."')}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600', color: '#343a40', fontSize: '14px' }}>
                      {isEditable ? (
                        <EditableText field="caseStudyCompany">
                          {getCustomization('caseStudyCompany', 'Manufacturing Industry • 500+ employees')}
                        </EditableText>
                      ) : getCustomization('caseStudyCompany', 'Manufacturing Industry • 500+ employees')}
                    </span>
                    <span style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      VERIFIED RESULTS
                    </span>
                  </div>
                </div>
              )}

              {/* Generated Paragraph 4 */}
              <div style={{ margin: '25px 0' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph4" multiline className="w-full">
                      Similar success stories demonstrate the tangible value our approach delivers. Each engagement is customized to address your unique challenges and opportunities.
                    </EditableText>
                  ) : `Similar success stories demonstrate the tangible value our approach delivers. Each engagement is customized to address your unique challenges and opportunities.`}
                </p>
              </div>

              {/* Generated Paragraph 5 */}
              <div style={{ margin: '25px 0' }}>
                <p style={{
                  fontSize: config.bodyTextSize || config.textSize || '16px',
                  lineHeight: '1.8',
                  color: config.bodyTextColor || config.textColor || '#343a40',
                  margin: '0',
                  textAlign: 'justify',
                  fontWeight: config.bodyTextWeight || config.fontWeight || 'normal',
                  fontStyle: config.bodyTextStyle || config.fontStyle || 'normal'
                }}>
                  {isEditable ? (
                    <EditableText field="paragraph5" multiline className="w-full">
                      I'd welcome the opportunity to discuss how we can help {sampleData.company} achieve similar transformative results through our proven strategic framework.
                    </EditableText>
                  ) : `I'd welcome the opportunity to discuss how we can help ${sampleData.company} achieve similar transformative results through our proven strategic framework.`}
                </p>
              </div>

              {/* CTA Consultation Component */}
              <div style={{
                background: '#343a40',
                color: 'white',
                padding: '25px',
                textAlign: 'center',
                margin: '35px 0',
                borderRadius: '5px'
              }}>
                <h3 style={{ margin: '0 0 15px', fontSize: '18px' }}>
                  {isEditable ? (
                    <EditableText field="ctaTitle" className="text-white">
                      {getCustomization('ctaTitle', 'Complimentary Strategic Assessment')}
                    </EditableText>
                  ) : getCustomization('ctaTitle', 'Complimentary Strategic Assessment')}
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '14px', opacity: '0.9' }}>
                  {isEditable ? (
                    <EditableText field="ctaSubtitle" className="text-white">
                      {getCustomization('ctaSubtitle', 'No obligation • 30-minute expert consultation')}
                    </EditableText>
                  ) : getCustomization('ctaSubtitle', 'No obligation • 30-minute expert consultation')}
                </p>
                <a href={config.buttonUrl || 'https://consultation.company.com'} style={{
                  display: 'inline-block',
                  background: '#28a745',
                  color: 'white',
                  padding: '12px 25px',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}>
                  {isEditable ? (
                    <>
                      <EditableText field="buttonText" className="text-white bg-transparent border-0">
                        {config.buttonText}
                      </EditableText>
                      <div style={{ fontSize: '10px', marginTop: '5px' }}>
                        <EditableText field="buttonUrl" className="text-green-200">
                          URL: {config.buttonUrl || 'https://consultation.company.com'}
                        </EditableText>
                      </div>
                    </>
                  ) : config.buttonText}
                </a>
              </div>
            </div>

            {/* Footer/Signature Section */}
            <div style={{
              padding: '25px 40px',
              background: '#f8f9fa',
              borderTop: '1px solid #dee2e6'
            }}>
              <p style={{
                margin: '0',
                color: '#495057',
                fontSize: config.signatureSize || config.textSize || '14px',
                lineHeight: '1.6',
                fontWeight: config.signatureWeight || config.fontWeight || 'normal',
                fontStyle: config.signatureStyle || config.fontStyle || 'normal',
                whiteSpace: 'pre-line'
              }} dangerouslySetInnerHTML={{
                __html: isEditable ? (
                  replacePlaceholders(config.signature || 'Best regards,<br><strong style="color: #343a40;">Strategic Advisory Team</strong><br><em style="color: #6c757d;">Trusted by 200+ enterprise clients</em>')
                ) : replacePlaceholders(config.signature || 'Best regards,<br><strong style="color: #343a40;">Strategic Advisory Team</strong><br><em style="color: #6c757d;">Trusted by 200+ enterprise clients</em>')
              }} />
            </div>
          </div>
        );

      case 'event_invitation':
        return (
          <div style={{
            fontFamily: "'Nunito', -apple-system, sans-serif",
            maxWidth: '600px',
            margin: '0 auto',
            background: 'white'
          }}>
            {/* Event Hero Component */}
            <div style={{
              background: '#343a40',
              color: 'white',
              padding: '40px 30px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{ position: 'relative', zIndex: '2' }}>
                <div style={{
                  background: '#28a745',
                  display: 'inline-block',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  EXCLUSIVE EVENT
                </div>
                <h1 style={{
                  margin: '0 0 15px',
                  fontSize: '28px',
                  fontWeight: '700'
                }}>
                  {isEditable ? (
                    <EditableText field="eventTitle" className="text-white">
                      {getCustomization('eventTitle', 'Future of Business Summit')}
                    </EditableText>
                  ) : getCustomization('eventTitle', 'Future of Business Summit')}
                </h1>
                <p style={{
                  margin: '0 0 20px',
                  fontSize: '18px',
                  opacity: '0.9'
                }}>
                  Specially curated for {sampleData.company} and industry leaders
                </p>
                <div style={{
                  background: '#f8f9fa',
                  color: '#343a40',
                  padding: '15px',
                  borderRadius: '8px',
                  display: 'inline-block'
                }}>
                  <div style={{
                    fontSize: '14px',
                    opacity: '0.8',
                    marginBottom: '5px'
                  }}>
                    SAVE THE DATE
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    {isEditable ? (
                      <EditableText field="eventDate" className="bg-gray-100">
                        {getCustomization('eventDate', 'March 15, 2024 | 2:00 PM EST')}
                      </EditableText>
                    ) : getCustomization('eventDate', 'March 15, 2024 | 2:00 PM EST')}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '40px 30px' }}>
              {/* Generated Paragraph 1 */}
              <div style={{ marginBottom: '30px' }}>
                <p style={{
                  fontSize: '17px',
                  lineHeight: '1.7',
                  color: '#343a40',
                  margin: 0
                }}>
                  [GENERATED CONTENT 1: Event announcement and value for {sampleData.company}]
                </p>
              </div>

              {/* Agenda Timeline Component */}
              <div style={{
                background: '#f8f9fa',
                padding: '30px',
                borderRadius: '12px',
                margin: '35px 0'
              }}>
                <h3 style={{
                  margin: '0 0 25px',
                  textAlign: 'center',
                  color: '#343a40',
                  fontSize: '20px'
                }}>
                  📅 Event Agenda
                </h3>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px',
                    background: 'white',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '14px',
                      marginRight: '15px',
                      minWidth: '70px',
                      textAlign: 'center'
                    }}>
                      {isEditable ? (
                        <EditableText field="agenda1Time" className="text-white bg-transparent">
                          {getCustomization('agenda1Time', '2:00 PM')}
                        </EditableText>
                      ) : getCustomization('agenda1Time', '2:00 PM')}
                    </div>
                    <div>
                      <h4 style={{
                        margin: '0 0 5px',
                        color: '#343a40',
                        fontSize: '16px'
                      }}>
                        {isEditable ? (
                          <EditableText field="agenda1Title" className="w-full">
                            {getCustomization('agenda1Title', 'Opening Keynote: Digital Transformation Trends')}
                          </EditableText>
                        ) : getCustomization('agenda1Title', 'Opening Keynote: Digital Transformation Trends')}
                      </h4>
                      <p style={{
                        margin: 0,
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        {isEditable ? (
                          <EditableText field="agenda1Description" className="w-full">
                            {getCustomization('agenda1Description', 'Industry insights and future predictions')}
                          </EditableText>
                        ) : getCustomization('agenda1Description', 'Industry insights and future predictions')}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px',
                    background: 'white',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      background: '#6c757d',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '14px',
                      marginRight: '15px',
                      minWidth: '70px',
                      textAlign: 'center'
                    }}>
                      {isEditable ? (
                        <EditableText field="agenda2Time" className="text-white bg-transparent">
                          {getCustomization('agenda2Time', '2:45 PM')}
                        </EditableText>
                      ) : getCustomization('agenda2Time', '2:45 PM')}
                    </div>
                    <div>
                      <h4 style={{
                        margin: '0 0 5px',
                        color: '#343a40',
                        fontSize: '16px'
                      }}>
                        {isEditable ? (
                          <EditableText field="agenda2Title" className="w-full">
                            {getCustomization('agenda2Title', 'Panel: Scaling for Growth')}
                          </EditableText>
                        ) : getCustomization('agenda2Title', 'Panel: Scaling for Growth')}
                      </h4>
                      <p style={{
                        margin: 0,
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        {isEditable ? (
                          <EditableText field="agenda2Description" className="w-full">
                            {getCustomization('agenda2Description', 'CEO roundtable discussion')}
                          </EditableText>
                        ) : getCustomization('agenda2Description', 'CEO roundtable discussion')}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px',
                    background: 'white',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '14px',
                      marginRight: '15px',
                      minWidth: '70px',
                      textAlign: 'center'
                    }}>
                      {isEditable ? (
                        <EditableText field="agenda3Time" className="text-white bg-transparent">
                          {getCustomization('agenda3Time', '3:30 PM')}
                        </EditableText>
                      ) : getCustomization('agenda3Time', '3:30 PM')}
                    </div>
                    <div>
                      <h4 style={{
                        margin: '0 0 5px',
                        color: '#343a40',
                        fontSize: '16px'
                      }}>
                        {isEditable ? (
                          <EditableText field="agenda3Title" className="w-full">
                            {getCustomization('agenda3Title', 'Networking & Q&A')}
                          </EditableText>
                        ) : getCustomization('agenda3Title', 'Networking & Q&A')}
                      </h4>
                      <p style={{
                        margin: 0,
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        {isEditable ? (
                          <EditableText field="agenda3Description" className="w-full">
                            {getCustomization('agenda3Description', 'Connect with peers and experts')}
                          </EditableText>
                        ) : getCustomization('agenda3Description', 'Connect with peers and experts')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Paragraph 2 */}
              <div style={{ margin: '30px 0' }}>
                <p style={{
                  fontSize: '17px',
                  lineHeight: '1.7',
                  color: '#343a40',
                  margin: 0
                }}>
                  [GENERATED CONTENT 2: Key topics, speakers, and insights]
                </p>
              </div>

              {/* Speaker Showcase Component */}
              <div style={{
                background: '#f8f9fa',
                padding: '30px',
                borderRadius: '12px',
                margin: '35px 0',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  margin: '0 0 25px',
                  textAlign: 'center',
                  color: '#343a40',
                  fontSize: '20px'
                }}>
                  🎤 Featured Speakers
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}>
                  <div style={{
                    textAlign: 'center',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px'
                  }}>
                    <img
                      src="https://via.placeholder.com/80x80/343a40/ffffff?text=S1"
                      alt="Speaker"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        marginBottom: '15px'
                      }}
                    />
                    <h4 style={{
                      margin: '0 0 5px',
                      color: '#343a40',
                      fontSize: '16px'
                    }}>
                      {isEditable ? (
                        <EditableText field="speaker1Name" className="w-full">
                          {getCustomization('speaker1Name', 'Sarah Johnson')}
                        </EditableText>
                      ) : getCustomization('speaker1Name', 'Sarah Johnson')}
                    </h4>
                    <p style={{
                      margin: '0 0 10px',
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                      {isEditable ? (
                        <EditableText field="speaker1Title" className="w-full">
                          {getCustomization('speaker1Title', 'CEO, TechVanguard')}
                        </EditableText>
                      ) : getCustomization('speaker1Title', 'CEO, TechVanguard')}
                    </p>
                    <span style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {isEditable ? (
                        <EditableText field="speaker1Badge" className="text-white bg-transparent">
                          {getCustomization('speaker1Badge', 'KEYNOTE')}
                        </EditableText>
                      ) : getCustomization('speaker1Badge', 'KEYNOTE')}
                    </span>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px'
                  }}>
                    <img
                      src="https://via.placeholder.com/80x80/343a40/ffffff?text=S2"
                      alt="Speaker"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        marginBottom: '15px'
                      }}
                    />
                    <h4 style={{
                      margin: '0 0 5px',
                      color: '#343a40',
                      fontSize: '16px'
                    }}>
                      {isEditable ? (
                        <EditableText field="speaker2Name" className="w-full">
                          {getCustomization('speaker2Name', 'Michael Chen')}
                        </EditableText>
                      ) : getCustomization('speaker2Name', 'Michael Chen')}
                    </h4>
                    <p style={{
                      margin: '0 0 10px',
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                      {isEditable ? (
                        <EditableText field="speaker2Title" className="w-full">
                          {getCustomization('speaker2Title', 'Innovation Director, FutureScale')}
                        </EditableText>
                      ) : getCustomization('speaker2Title', 'Innovation Director, FutureScale')}
                    </p>
                    <span style={{
                      background: '#6c757d',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {isEditable ? (
                        <EditableText field="speaker2Badge" className="text-white bg-transparent">
                          {getCustomization('speaker2Badge', 'PANEL')}
                        </EditableText>
                      ) : getCustomization('speaker2Badge', 'PANEL')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Generated Paragraph 3 */}
              <div style={{ margin: '30px 0' }}>
                <p style={{
                  fontSize: '17px',
                  lineHeight: '1.7',
                  color: '#343a40',
                  margin: 0
                }}>
                  [GENERATED CONTENT 3: Limited spots and registration encouragement]
                </p>
              </div>

              {/* Registration CTA Component */}
              <div style={{
                background: '#28a745',
                color: 'white',
                padding: '35px',
                textAlign: 'center',
                borderRadius: '15px',
                margin: '35px 0',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '20px',
                  background: '#343a40',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  LIMITED SEATS
                </div>
                <h3 style={{
                  margin: '0 0 15px',
                  fontSize: '22px'
                }}>
                  {isEditable ? (
                    <EditableText field="registrationCta" className="text-white">
                      {getCustomization('registrationCta', '🎟️ Reserve Your Spot')}
                    </EditableText>
                  ) : getCustomization('registrationCta', '🎟️ Reserve Your Spot')}
                </h3>
                <p style={{
                  margin: '0 0 25px',
                  fontSize: '16px',
                  opacity: '0.9'
                }}>
                  Join 200+ industry leaders • Complimentary attendance
                </p>
                <a
                  href={config.buttonUrl || 'https://register.event.com'}
                  style={{
                    display: 'inline-block',
                    background: 'white',
                    color: '#28a745',
                    padding: '16px 35px',
                    textDecoration: 'none',
                    borderRadius: '50px',
                    fontWeight: '700',
                    fontSize: '17px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  {isEditable ? (
                    <>
                      <EditableText field="buttonText" className="bg-transparent border-0" style={{ color: '#28a745' }}>
                        {config.buttonText}
                      </EditableText>
                      <div style={{ fontSize: '10px', marginTop: '5px', color: '#28a745' }}>
                        <EditableText field="buttonUrl" className="bg-transparent">
                          URL: {config.buttonUrl || 'https://register.event.com'}
                        </EditableText>
                      </div>
                    </>
                  ) : config.buttonText}
                </a>
                <p style={{
                  margin: '20px 0 0',
                  fontSize: '14px',
                  opacity: '0.8'
                }}>
                  🎁 Bonus: Exclusive strategy guide for attendees
                </p>
              </div>
            </div>

            {/* Footer Section */}
            <div style={{
              padding: '25px 30px',
              background: '#f8f9fa',
              textAlign: 'center'
            }}>
              <p style={{
                margin: '0 0 10px',
                color: '#6c757d',
                fontSize: '14px'
              }}>
                Can't make it live? All registrants receive the recording.
              </p>
              <p style={{
                margin: 0,
                color: '#adb5bd',
                fontSize: '12px'
              }}>
                Future of Business Summit • Hosted by Industry Leaders Network
              </p>
            </div>
          </div>
        );

      case 'custom_template':
        // 🧩 Custom template - component-based builder
        const customComponents = getCustomization('customComponents', []);

        // Helper to render a single custom component
        const renderCustomComponent = (component) => {
          const props = component.properties || {};

          switch (component.type) {
            case 'logo':
              return (
                <div key={component.id} style={{ textAlign: 'center', padding: '30px 40px' }}>
                  {props.logoUrl && (
                    <img src={props.logoUrl} alt="Logo" style={{ maxWidth: '200px', marginBottom: '10px' }} />
                  )}
                  {props.subtitle && (
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>{replacePlaceholders(props.subtitle)}</p>
                  )}
                </div>
              );

            case 'greeting':
              return (
                <div key={component.id} style={{ padding: '0 40px', marginBottom: '20px' }}>
                  <p style={{ margin: 0, fontSize: '16px', color: '#000' }}>{replacePlaceholders(props.text)}</p>
                </div>
              );

            case 'paragraph':
              return (
                <div key={component.id} style={{ padding: '0 40px', marginBottom: '20px' }}>
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    color: '#333',
                    textAlign: props.alignment || 'left',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {replacePlaceholders(props.text)}
                  </p>
                </div>
              );

            case 'cta':
              return (
                <div key={component.id} style={{ textAlign: 'center', padding: '30px 40px' }}>
                  <a href={props.url} style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: props.color || '#10b981',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    {props.text || 'Get Started'}
                  </a>
                </div>
              );

            case 'testimonial':
              return (
                <div key={component.id} style={{
                  padding: '30px 40px',
                  background: '#f8f9fa',
                  borderLeft: '4px solid #10b981',
                  margin: '20px 0'
                }}>
                  <p style={{
                    fontSize: '18px',
                    fontStyle: 'italic',
                    color: '#495057',
                    margin: '0 0 10px'
                  }}>
                    {props.quote}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#6c757d',
                    margin: 0
                  }}>
                    — {props.author}
                  </p>
                </div>
              );

            case 'features':
              return (
                <div key={component.id} style={{ padding: '30px 40px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px'
                  }}>
                    {[1, 2, 3, 4].map(num => (
                      props[`feature${num}Title`] && (
                        <div key={num} style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <h4 style={{
                            margin: '0 0 8px',
                            color: '#10b981',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            {props[`feature${num}Title`]}
                          </h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                            {props[`feature${num}Description`]}
                          </p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              );

            case 'stats':
              return (
                <div key={component.id} style={{
                  padding: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '30px'
                  }}>
                    {[1, 2, 3].map(num => (
                      props[`stat${num}Value`] && (
                        <div key={num}>
                          <div style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '8px'
                          }}>
                            {props[`stat${num}Value`]}
                          </div>
                          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                            {props[`stat${num}Label`]}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              );

            case 'countdown':
              const eventDate = new Date(props.eventDate || '2025-12-31');
              const now = new Date();
              const daysLeft = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

              return (
                <div key={component.id} style={{
                  padding: '40px',
                  background: '#fff3cd',
                  textAlign: 'center',
                  borderRadius: '8px',
                  margin: '20px 40px'
                }}>
                  <h3 style={{
                    margin: '0 0 15px',
                    color: '#856404',
                    fontSize: '24px'
                  }}>
                    {props.eventName || 'Special Event'}
                  </h3>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#856404',
                    marginBottom: '10px'
                  }}>
                    {daysLeft > 0 ? daysLeft : 0}
                  </div>
                  <p style={{ margin: 0, fontSize: '16px', color: '#856404' }}>
                    Days Remaining
                  </p>
                </div>
              );

            case 'banner':
              return (
                <div key={component.id} style={{
                  padding: '60px 40px',
                  background: props.color || '#10b981',
                  textAlign: 'center'
                }}>
                  <h1 style={{
                    margin: '0 0 15px',
                    color: 'white',
                    fontSize: '36px',
                    fontWeight: 'bold'
                  }}>
                    {props.title || 'Welcome!'}
                  </h1>
                  <p style={{
                    margin: 0,
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '18px'
                  }}>
                    {props.subtitle || 'Discover our amazing products'}
                  </p>
                </div>
              );

            default:
              return null;
          }
        };

        // Render custom template
        return (
          <div style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            maxWidth: '600px',
            margin: '0 auto',
            background: 'white'
          }}>
            {customComponents.length > 0 ? (
              <div id="custom-email-content">
                {customComponents.map(component => renderCustomComponent(component))}
              </div>
            ) : (
              <div id="custom-email-content" style={{
                padding: '40px',
                background: 'transparent',
                minHeight: '400px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'transparent',
                  border: '2px dashed #dee2e6',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '48px',
                    color: '#6c757d',
                    marginBottom: '20px'
                  }}>+</div>
                  <h3 style={{
                    color: '#343a40',
                    margin: '0 0 10px',
                    fontSize: '20px'
                  }}>Start Building Your Custom Email</h3>
                  <p style={{
                    color: '#6c757d',
                    margin: 0,
                    fontSize: '14px'
                  }}>Add components using the Component Builder on the left</p>
                </div>
              </div>
            )}

            <div style={{
              padding: '25px 40px',
              background: 'transparent',
              borderTop: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <p style={{
                margin: 0,
                color: '#6c757d',
                fontSize: '14px'
              }}>
                {replacePlaceholders(config.signature)}
              </p>
            </div>
          </div>
        );

      default:
        // No fallback template - require explicit template selection
        throw new Error(`Unknown template: ${templateId}. Please select a valid template.`);
    }
  };

  return (
    <div className="email-template-renderer">
      {/* Subject Line Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg border-l-4 border-green-500">
        <span className="text-sm font-medium text-gray-600">Subject: </span>
        <span className="text-gray-800 font-medium">
          {isEditable ? (
            <EditableText field="subject" className="bg-gray-100 border-gray-300 inline w-full">
              {config.subject.replace('{company}', sampleData.company)}
            </EditableText>
          ) : config.subject.replace('{company}', sampleData.company)}
        </span>
      </div>

      {/* Template Content */}
      <div className="template-content">
        {renderTemplateContent()}
      </div>

      {/* Help text for editable mode */}
      {isEditable && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
             <strong>Click on any text to edit it directly.</strong> Your changes will be applied to all generated emails.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateRenderer;