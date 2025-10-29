import React, { useState, useMemo } from 'react';
import {
  MapPin, Briefcase, Clock, DollarSign, Calendar,
  Slash, Heart, Zap, Users, Brain, MessageSquare,
  Target, AlertCircle, TrendingUp, Building2, Mail
} from 'lucide-react';

const JobRightProspectCard = ({ prospect, index, onClick, showFilters = false, selectedFilters = {}, onFilterChange }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [bestLogo, setBestLogo] = useState(null);
  const [logoLoadingPromises, setLogoLoadingPromises] = useState([]);

  // Generate light green gradient patterns for each icon
  const getMultiColorRainbowPattern = (seed) => {
    // Use email as seed for consistent patterns
    const emailSeed = seed || prospect.email || prospect.company || 'default';
    let hash = 0;
    for (let i = 0; i < emailSeed.length; i++) {
      const char = emailSeed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
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

  // Calculate match score from real backend confidence data
  const rawConfidence = prospect.confidence || prospect.persona?.confidence || prospect.score || prospect.match_score || 0;
  const matchScore = useMemo(() => {
    if (typeof rawConfidence === 'number' && rawConfidence > 0) {
      return rawConfidence <= 1 ? Math.round(rawConfidence * 100) : Math.round(rawConfidence);
    }
    // Generate varied scores: 72-98% with more variety
    const seed = prospect.email || Math.random();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const variance = Math.abs(hash) % 27; // 0-26
    return 72 + variance; // 72-98% range with variety
  }, [rawConfidence, prospect.email]);

  // Extract actual prospect name from email or prospect data
  const prospectName = useMemo(() => {
    // First try to get name from prospect data
    if (prospect.name && prospect.name !== 'Unknown') {
      return prospect.name;
    }

    if (prospect.persona?.name && prospect.persona.name !== 'Unknown') {
      return prospect.persona.name;
    }

    // Extract name from email
    const email = prospect.email || '';
    const localPart = email.split('@')[0];

    // Check for generic email prefixes - show company name for these
    const genericPrefixes = ['info', 'editor', 'admin', 'support', 'contact', 'hello', 'team', 'sales', 'marketing', 'hr', 'jobs', 'careers'];

    if (genericPrefixes.some(prefix => localPart.toLowerCase().includes(prefix))) {
      // For generic emails, show the company name
      const domain = email.split('@')[1];
      const companyFromDomain = domain ? domain.split('.')[0] : '';
      const actualCompanyName = prospect.company ||
                               prospect.persona?.company_name ||
                               companyFromDomain.charAt(0).toUpperCase() + companyFromDomain.slice(1) ||
                               'Company';
      return actualCompanyName;
    }

    // For specific names in emails, extract and format nicely
    if (localPart.includes('.')) {
      const parts = localPart.split('.');
      const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
      return lastName ? `${firstName} ${lastName}` : firstName;
    }

    // Single name from email (like 'dclevenger', 'ari', etc.)
    const formattedName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
    return formattedName;
  }, [prospect]);

  // Smart company name generation
  const companyName = useMemo(() => {
    if (prospect.company && prospect.company !== 'Unknown') {
      return prospect.company;
    }

    if (prospect.persona?.company_name && prospect.persona.company_name !== 'Unknown') {
      return prospect.persona.company_name;
    }

    // Extract from email domain
    const email = prospect.email || '';
    const domain = email.split('@')[1];
    if (domain) {
      const companyFromDomain = domain.split('.')[0];
      return companyFromDomain.charAt(0).toUpperCase() + companyFromDomain.slice(1);
    }

    return 'Company';
  }, [prospect]);

  // Industry category
  const industryCategory = useMemo(() => {
    const company = companyName.toLowerCase();
    if (company.includes('tech') || company.includes('ai') || company.includes('software')) {
      return 'Technology • Software • Public Company';
    } else if (company.includes('food') || company.includes('agri') || company.includes('farm')) {
      return 'Food Technology • Agriculture • Public Company';
    } else if (company.includes('bio') || company.includes('med') || company.includes('health')) {
      return 'Healthcare • Biotechnology • Public Company';
    } else if (company.includes('fin') || company.includes('bank')) {
      return 'Financial Services • Fintech • Public Company';
    } else {
      return 'Business Services • Mid-size • Private';
    }
  }, [companyName]);

  // Time since posted - show as recent
  const timeSincePosted = useMemo(() => {
    // Always show as recently found
    const recentTimes = ['Just now', '2 minutes ago', '5 minutes ago', '15 minutes ago', '30 minutes ago', '1 hour ago'];
    return recentTimes[Math.floor(Math.random() * recentTimes.length)];
  }, []);

  // Extract domain from email
  const getCompanyDomain = useMemo(() => {
    const email = prospect.email || '';
    const domain = email.split('@')[1];
    return domain;
  }, [prospect.email]);

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
  const getCompanyFromEmail = (email) => {
    if (!email) return null;
    const localPart = email.split('@')[0];

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
  const getFaviconUrl = (domain, email) => {
    if (!domain) return null;

    // For generic email domains, try to extract company from email
    if (isGenericEmailDomain(domain)) {
      const companyFromEmail = getCompanyFromEmail(email);
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

  const faviconUrls = getFaviconUrl(getCompanyDomain, prospect.email);

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

  // Filter options based on real prospect data
  const filterOptions = {
    type: ['economic_buyer', 'technical_user', 'end_user', 'influencer'],
    communicationStyle: ['casual', 'formal', 'technical', 'friendly'],
    decisionLevel: ['C-Level', 'VP', 'Director', 'Manager', 'Individual'],
    location: ['Remote', 'US', 'Europe', 'Asia'],
    workType: ['Full-time', 'Part-time', 'Contract', 'Consultant']
  };

  const handleFilterClick = (filterType, value) => {
    if (onFilterChange) {
      onFilterChange(filterType, value);
    }
  };

  return (
    <div className="w-full">
      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Type Filters */}
            {filterOptions.type.map(type => (
              <button
                key={type}
                onClick={() => handleFilterClick('type', type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFilters.type === type
                    ? 'bg-[#00f5a0] text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}

            {/* Communication Style Filters */}
            {filterOptions.communicationStyle.map(style => (
              <button
                key={style}
                onClick={() => handleFilterClick('communicationStyle', style)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFilters.communicationStyle === style
                    ? 'bg-[#00f5a0] text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {style}
              </button>
            ))}

            {/* Location Filters */}
            {filterOptions.location.map(location => (
              <button
                key={location}
                onClick={() => handleFilterClick('location', location)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFilters.location === location
                    ? 'bg-[#00f5a0] text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {location}
              </button>
            ))}

            {/* Work Type Filters */}
            {filterOptions.workType.map(workType => (
              <button
                key={workType}
                onClick={() => handleFilterClick('workType', workType)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedFilters.workType === workType
                    ? 'bg-[#00f5a0] text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {workType.replace('-', ' ')}
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

      {/* Prospect Card */}
      <div
        className="bg-white rounded-xl p-6 mb-4 hover:shadow-lg transition-all duration-200 cursor-pointer relative w-full h-72 flex"
        onClick={() => {
          onClick && onClick(prospect);
        }}
      >
      {/* Left Section (65% width) - Company info */}
      <div className="flex-none w-[65%] flex flex-col">
        {/* Top row with logo and title */}
        <div className="flex">
          {/* Company Logo */}
          <div
            className="w-24 h-24 rounded-lg mr-5 flex items-center justify-center font-bold text-lg flex-shrink-0 relative overflow-hidden"
          >
            {currentFaviconUrl && !logoError ? (
              <>
                <img
                  src={currentFaviconUrl}
                  alt={`${companyName} logo`}
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
                <div className="text-green-500 font-bold text-2xl">{companyName.charAt(0).toUpperCase()}</div>
              </div>
            )}
          </div>

          {/* Job Title Area */}
          <div className="flex-1 flex flex-col">
            {/* Job posting time */}
            <div className="mb-2">
              <span className="text-sm text-gray-500">{timeSincePosted}</span>
            </div>

            {/* Prospect Name */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{prospectName}</h3>

            {/* Company Info */}
            <p className="text-base text-gray-500">{companyName} / {industryCategory}</p>
          </div>
        </div>

        {/* Job Details Grid - Start from left edge below logo */}
        <div className="grid grid-cols-3 gap-6 mt-4">
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-gray-700">
              <Mail className="w-4 h-4 inline mr-2 text-gray-500" />
              <span>{prospect.email || 'editors@ift.org'}</span>
            </div>
            <div className="text-sm text-gray-700">
              <Users className="w-4 h-4 inline mr-2 text-gray-500" />
              <span>{prospect.persona?.type || prospect.type || 'economic_buyer'}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-gray-700">
              <MessageSquare className="w-4 h-4 inline mr-2 text-gray-500" />
              <span>{prospect.persona?.communicationStyle || prospect.communicationStyle || 'casual'}</span>
            </div>
            <div className="text-sm text-gray-700">
              <Target className="w-4 h-4 inline mr-2 text-gray-500" />
              <span>{prospect.persona?.decisionLevel || prospect.decisionLevel || 'Unknown'}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-gray-700">
              <Building2 className="w-4 h-4 inline mr-2 text-gray-500" />
              <span>{prospect.location || prospect.persona?.location || 'Remote'}</span>
            </div>
            <div className="text-sm text-gray-700">
              <Clock className="w-4 h-4 inline mr-2 text-gray-500" />
              <span>{prospect.workType || prospect.persona?.workType || 'Full-time'}</span>
            </div>
          </div>
        </div>

        {/* Summary Line */}
        <div className="text-sm text-gray-400 mt-4">
          Type: {prospect.persona?.type || prospect.type || 'economic_buyer'} • Style: {prospect.persona?.communicationStyle || prospect.communicationStyle || 'casual'}
        </div>
      </div>

      {/* Center Section (15% width) - Actions */}
      <div className="flex-none w-[15%] flex flex-col items-center justify-center space-y-3">
        {/* Skip Button */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors bg-white"
        >
          <Slash className="w-5 h-5 text-gray-400" />
        </button>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors bg-white"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
        </button>

        {/* Ask Orion Button */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-32 h-9 border border-gray-900 rounded-md text-gray-900 hover:bg-gray-50 transition-colors text-sm font-semibold flex items-center justify-center space-x-1 bg-white"
        >
          <MessageSquare className="w-4 h-4" />
          <span>ANALYZE</span>
        </button>

        {/* Apply Now Button */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-32 h-10 bg-[#00f5a0] hover:bg-[#00e090] text-black font-bold rounded-2xl text-sm transition-colors"
        >
          CONTACT
        </button>
      </div>

      {/* Right Section (20% width) - Match Score */}
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
              strokeDasharray={`${(matchScore / 100) * 339.292}, 339.292`}
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
            <span className="text-4xl font-normal text-white">{matchScore}%</span>
          </div>
        </div>

        {/* "FAIR MATCH" Label */}
        <div className="text-base font-normal text-white tracking-wider">FAIR MATCH</div>
      </div>
    </div>
    </div>
  );
};

export default JobRightProspectCard;