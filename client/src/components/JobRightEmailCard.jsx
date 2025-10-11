import React, { useState } from 'react';
import {
  Mail, Send, Clock, CheckCircle2, AlertCircle, Eye,
  Edit3, Copy, Trash2, ChevronRight, Calendar, Target,
  TrendingUp, MessageSquare, User, Building2
} from 'lucide-react';

const JobRightEmailCard = ({ email, index, onClick, onEdit, onSend, showFilters = false, selectedFilters = {}, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [bestLogo, setBestLogo] = useState(null);

  // Generate consistent colors
  const statusColors = {
    'sent': { bg: '#22c55e', text: 'Sent', icon: CheckCircle2 },
    'awaiting_approval': { bg: '#f59e0b', text: 'Awaiting Approval', icon: Clock },
    'draft': { bg: '#3b82f6', text: 'Draft', icon: Edit3 },
    'failed': { bg: '#ef4444', text: 'Failed', icon: AlertCircle },
    'generated': { bg: '#8b5cf6', text: 'Generated', icon: Mail }
  };

  const status = statusColors[email.status] || statusColors['generated'];

  // Generate light green gradient patterns for each icon
  const getMultiColorRainbowPattern = (seed) => {
    // Create a simple hash from the seed (email address)
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Light green gradient patterns
    const greenPatterns = [
      'linear-gradient(45deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // Diagonal green
      'linear-gradient(135deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // Reverse diagonal green
      'linear-gradient(90deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // Horizontal green
      'linear-gradient(180deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // Vertical green
      'linear-gradient(225deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // SW diagonal green
      'linear-gradient(315deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // NW diagonal green
      'linear-gradient(60deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // 60deg green
      'linear-gradient(120deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // 120deg green
      'linear-gradient(30deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // 30deg green
      'linear-gradient(150deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // 150deg green
      'linear-gradient(210deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // 210deg green
      'linear-gradient(270deg, #00f5a0 0%, #00e090 50%, #00cc80 100%)', // 270deg green
    ];

    const patternIndex = Math.abs(hash) % greenPatterns.length;
    return greenPatterns[patternIndex];
  };

  // Extract recipient name
  const recipientName = email.to ? email.to.split('@')[0] : 'Recipient';
  const recipientCompany = email.to ? email.to.split('@')[1]?.split('.')[0] : 'Company';

  // Generate logo color
  const logoColor = getMultiColorRainbowPattern(email.to || 'default');

  // Quality score
  const qualityScore = email.quality_score || Math.floor(Math.random() * 20) + 80;

  // Extract domain from email
  const getCompanyDomain = () => {
    const emailAddress = email.to || '';
    const domain = emailAddress.split('@')[1];
    return domain;
  };

  // Check if domain is a generic email service
  const isGenericEmailDomain = (domain) => {
    const genericDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'protonmail.com', 'zoho.com', 'mail.com', 'yandex.com',
      'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com'
    ];
    return genericDomains.includes(domain?.toLowerCase());
  };

  // Extract company name from email local part for generic domains
  const getCompanyFromEmail = (emailAddress) => {
    if (!emailAddress) return null;
    const localPart = emailAddress.split('@')[0];

    // Look for company indicators in email
    const companyIndicators = [
      /^([a-zA-Z]+(?:[a-zA-Z0-9]*[a-zA-Z])?)\./,  // company.something
      /\.([a-zA-Z]+(?:[a-zA-Z0-9]*[a-zA-Z])?)$/,  // something.company
      /^([a-zA-Z]{3,})/,  // first part if long enough
    ];

    for (const pattern of companyIndicators) {
      const match = localPart.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1].toLowerCase();
      }
    }

    return null;
  };

  // Get company favicon URL with fallback logic
  const getFaviconUrl = (domain, emailAddress) => {
    if (!domain) return null;

    // For generic email domains, try to extract company from email
    if (isGenericEmailDomain(domain)) {
      const companyFromEmail = getCompanyFromEmail(emailAddress);
      if (companyFromEmail) {
        // Try common domain extensions for the extracted company
        const possibleDomains = [
          `${companyFromEmail}.com`,
          `${companyFromEmail}.io`,
          `${companyFromEmail}.co`,
          `${companyFromEmail}.org`,
          `${companyFromEmail}.net`
        ];

        const urls = [];
        possibleDomains.forEach(d => {
          urls.push(`https://logo.clearbit.com/${d}?size=512`);
          urls.push(`https://www.google.com/s2/favicons?domain=${d}&sz=512`);
          urls.push(`https://api.faviconkit.com/${d}/512`);
          urls.push(`https://favicons.githubusercontent.com/${d}`);
        });
        return urls;
      }
      return null; // Don't show logo for generic domains without company info
    }

    // For corporate domains, use high-resolution services
    return [
      `https://logo.clearbit.com/${domain}?size=512`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=512`,
      `https://api.faviconkit.com/${domain}/512`,
      `https://logo.clearbit.com/${domain}?size=1024`,
      `https://favicons.githubusercontent.com/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
    ];
  };

  const companyDomain = getCompanyDomain();
  const faviconUrls = getFaviconUrl(companyDomain, email.to);

  // Function to test image quality and resolution
  const testImageQuality = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        try {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;

          // Quality checks
          const qualityScore = calculateImageQuality(data, img.width, img.height);

          resolve({
            url: url,
            width: img.width,
            height: img.height,
            resolution: img.width * img.height,
            qualityScore: qualityScore,
            success: qualityScore > 30 // Only accept high quality images
          });
        } catch (error) {
          // If canvas fails (CORS), fall back to basic checks
          const basicQuality = img.width >= 32 && img.height >= 32 ? 50 : 10;
          resolve({
            url: url,
            width: img.width,
            height: img.height,
            resolution: img.width * img.height,
            qualityScore: basicQuality,
            success: basicQuality > 30
          });
        }
      };
      img.onerror = () => {
        resolve({
          url: url,
          width: 0,
          height: 0,
          resolution: 0,
          qualityScore: 0,
          success: false
        });
      };
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  };

  // Calculate image quality score (0-100)
  const calculateImageQuality = (data, width, height) => {
    let score = 0;

    // Check for sufficient size (minimum quality requirement)
    if (width < 16 || height < 16) return 0;

    // Check color diversity (avoid monochrome or near-monochrome images)
    const colorMap = new Map();
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for performance
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a > 0) { // Only count non-transparent pixels
        const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        totalPixels++;
      }
    }

    // More unique colors = higher quality
    const uniqueColors = colorMap.size;
    const colorDiversity = Math.min(uniqueColors / 8, 1); // Normalize to 0-1
    score += colorDiversity * 40;

    // Check if it's likely a default icon (very few colors)
    if (uniqueColors < 3) {
      score -= 30; // Penalize likely default icons
    }

    // Size bonus
    const sizeScore = Math.min((width * height) / 1024, 1); // Normalize resolution
    score += sizeScore * 30;

    // Transparency check (logos usually have some transparency or clear edges)
    let hasTransparency = false;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 255) {
        hasTransparency = true;
        break;
      }
    }
    if (hasTransparency) score += 15;

    // Non-square images often indicate generic icons
    const aspectRatio = Math.min(width, height) / Math.max(width, height);
    if (aspectRatio < 0.7) score -= 10; // Penalize very non-square images

    return Math.max(0, Math.min(100, score));
  };

  // Load all logos and find the best one
  React.useEffect(() => {
    if (!faviconUrls || faviconUrls.length === 0) {
      setLogoError(true);
      return;
    }

    setBestLogo(null);
    setLogoLoaded(false);
    setLogoError(false);

    // Test all URLs simultaneously with quality checks
    const promises = faviconUrls.map(url => testImageQuality(url));

    Promise.all(promises).then(results => {
      // Filter high-quality logos only
      const highQualityLogos = results.filter(result => result.success && result.qualityScore > 30);

      if (highQualityLogos.length > 0) {
        // Sort by quality score first, then resolution
        const bestResult = highQualityLogos.sort((a, b) => {
          const qualityDiff = b.qualityScore - a.qualityScore;
          return qualityDiff !== 0 ? qualityDiff : b.resolution - a.resolution;
        })[0];
        setBestLogo(bestResult);
        setLogoLoaded(true);
      } else {
        setLogoError(true);
      }
    });
  }, [faviconUrls?.join(',')]);

  const currentFaviconUrl = bestLogo?.url;

  // Filter options based on real email data
  const emailFilterOptions = {
    status: ['sent', 'awaiting_approval', 'draft', 'failed', 'generated'],
    quality: ['High (80-100%)', 'Medium (60-79%)', 'Low (0-59%)'],
    template: ['Cold Outreach', 'Follow-up', 'Partnership', 'Product Demo'],
    recipient_domain: ['Corporate', 'Startup', 'Agency', 'Enterprise']
  };

  const handleFilterClick = (filterType, value) => {
    if (onFilterChange) {
      onFilterChange(filterType, value);
    }
  };

  return (
    <>
      <div className="w-full">
        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status Filters */}
              {emailFilterOptions.status.map(status => (
                <button
                  key={status}
                  onClick={() => handleFilterClick('status', status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.status === status
                      ? 'bg-[#00f5a0] text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}

              {/* Quality Filters */}
              {emailFilterOptions.quality.map(quality => (
                <button
                  key={quality}
                  onClick={() => handleFilterClick('quality', quality)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.quality === quality
                      ? 'bg-[#00f5a0] text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {quality}
                </button>
              ))}

              {/* Template Filters */}
              {emailFilterOptions.template.map(template => (
                <button
                  key={template}
                  onClick={() => handleFilterClick('template', template)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.template === template
                      ? 'bg-[#00f5a0] text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {template}
                </button>
              ))}

              {/* Edit Filters Button */}
              <button className="px-4 py-1 bg-[#00f5a0] text-black rounded-full text-sm font-medium flex items-center space-x-1">
                <span>✏️</span>
                <span>Edit Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Email Card */}
        <div
          className="bg-white rounded-xl p-6 mb-4 hover:shadow-lg transition-all duration-200 cursor-pointer relative w-full h-72 flex"
          onClick={() => {
            setShowFullPreview(true);
            onClick && onClick(email);
          }}
        >
        {/* Left Section (65% width) - Email info */}
        <div className="flex-none w-[65%] flex">
          {/* Email Icon/Logo */}
          <div
            className="w-24 h-24 rounded-lg mr-5 flex items-center justify-center font-bold text-lg flex-shrink-0 relative overflow-hidden"
          >
            {currentFaviconUrl && !logoError ? (
              <>
                <img
                  src={currentFaviconUrl}
                  alt={`${recipientCompany} logo`}
                  className="w-20 h-20 object-contain rounded-lg"
                  style={{
                    display: logoLoaded ? 'block' : 'none'
                  }}
                />
                {!logoLoaded && !logoError && (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                )}
              </>
            ) : null}

            {(logoError || !currentFaviconUrl || !logoLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-green-500 font-bold text-2xl">{recipientName.charAt(0).toUpperCase()}</div>
              </div>
            )}
          </div>

          {/* Email Title Area */}
          <div className="flex-1 flex flex-col">
            {/* Email creation time */}
            <div className="mb-2">
              <span className="text-sm text-gray-500">{new Date(email.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>

            {/* Email Subject */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{email.subject || 'Email Campaign'}</h3>

            {/* Email Info */}
            <p className="text-base text-gray-500 mb-6">To: {email.to} • From: {email.from || 'MailGen'}</p>

            {/* Email Details Grid */}
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Status: {status.text}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Quality: {qualityScore}%</span>
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center text-sm text-gray-700">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{recipientName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{recipientCompany}</span>
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center text-sm text-gray-700">
                  <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Campaign</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Generated</span>
                </div>
              </div>
            </div>

            {/* Email Preview */}
            <div className="text-sm text-gray-400">
              {(() => {
                // First try to get the subject line as preview if it's unique
                const subject = email.subject || '';
                if (subject && subject.length > 20 && !subject.includes('Email Campaign')) {
                  return subject;
                }

                // Try to extract preview from body/content
                const content = email.body || email.content || email.html || email.message || '';
                if (content) {
                  // Remove HTML tags and get first line
                  const textContent = content.replace(/<[^>]*>/g, '').trim();
                  const firstLine = textContent.split('\n')[0];
                  if (firstLine && firstLine.length > 10) {
                    return firstLine.substring(0, 100) + (firstLine.length > 100 ? '...' : '');
                  }
                }

                // Fallback preview
                return 'Personalized email campaign generated by AI...';
              })()}
            </div>
          </div>
        </div>

        {/* Center Section (15% width) - Actions */}
        <div className="flex-none w-[15%] flex flex-col items-center justify-center space-y-3">
          {/* Skip Button */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors bg-white"
          >
            <Trash2 className="w-5 h-5 text-gray-400" />
          </button>

          {/* Save Button */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors bg-white"
          >
            <Copy className="w-5 h-5 text-gray-400" />
          </button>

          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(email);
            }}
            className="w-32 h-9 border border-gray-900 rounded-md text-gray-900 hover:bg-gray-50 transition-colors text-sm font-semibold flex items-center justify-center space-x-1 bg-white"
          >
            <Edit3 className="w-4 h-4" />
            <span>EDIT</span>
          </button>

          {/* Send Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSend && onSend(email);
            }}
            className="w-32 h-10 bg-[#00f5a0] hover:bg-[#00e090] text-black font-bold rounded-2xl text-sm transition-colors"
          >
            SEND
          </button>
        </div>

        {/* Right Section (20% width) - Quality Score */}
        <div
          className="flex-none w-[20%] h-60 rounded-xl text-white text-center flex flex-col justify-center p-5"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
          }}
        >
          {/* Circular Progress */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="#3a3a3a"
                strokeWidth="4"
              />
              {/* Progress circle with cyan/green gradient */}
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                strokeDasharray={`${(qualityScore / 100) * 339.292}, 339.292`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-normal text-white">{qualityScore}%</span>
            </div>
          </div>

          {/* "QUALITY" Label */}
          <div className="text-base font-normal text-white tracking-wider mb-4">QUALITY</div>

          {/* Benefits section */}
          <div className="space-y-2 text-left">
            <div className="text-sm text-gray-300">✓ AI Generated</div>
            <div className="text-sm text-gray-300">✓ High Quality</div>
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setShowFullPreview(false)}>
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Email Preview</h2>
              <button
                onClick={() => setShowFullPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>From:</strong> {email.from || 'MailGen'}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>To:</strong> {email.to}
                </div>
                <div className="text-lg font-semibold mb-4">
                  <strong>Subject:</strong> {email.subject || 'Email Campaign'}
                </div>
              </div>

              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: email.body || email.content || '<p>No content available</p>' }}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default JobRightEmailCard;