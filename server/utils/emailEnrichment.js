/**
 * Enhanced Email Enrichment Utility
 * Extracts meaningful information from email addresses including:
 * - Real names (handling various formats)
 * - Job titles/roles
 * - Departments
 * - Quality scoring
 */

// Generic email prefixes that should be flagged as low quality
const GENERIC_PREFIXES = [
  'info', 'contact', 'hello', 'hi', 'support', 'help', 'admin', 'webmaster',
  'sales', 'marketing', 'office', 'mail', 'noreply', 'no-reply', 'test',
  'example', 'sample', 'demo', 'user', 'customer', 'client', 'team',
  'general', 'inbox', 'reception', 'enquiry', 'inquiry', 'service',
  'youremail', 'yourbusinessname', 'yourname', 'yourcompany'
];

// Department/role keywords in email addresses
const DEPARTMENT_KEYWORDS = {
  // Food & Science
  'foodsci': 'Food Science',
  'foodscience': 'Food Science',
  'nutrition': 'Nutrition',
  'culinary': 'Culinary',
  'agriculture': 'Agriculture',
  'agtech': 'Agricultural Technology',

  // Business Functions
  'hr': 'Human Resources',
  'finance': 'Finance',
  'accounting': 'Accounting',
  'legal': 'Legal',
  'operations': 'Operations',
  'logistics': 'Logistics',
  'procurement': 'Procurement',
  'purchasing': 'Purchasing',

  // Tech & Engineering
  'tech': 'Technology',
  'engineering': 'Engineering',
  'it': 'Information Technology',
  'dev': 'Development',
  'software': 'Software Development',
  'product': 'Product',
  'data': 'Data Analytics',

  // Marketing & Sales
  'marketing': 'Marketing',
  'sales': 'Sales',
  'bd': 'Business Development',
  'partnerships': 'Partnerships',
  'investor': 'Investor Relations',
  'ir': 'Investor Relations',
  'pr': 'Public Relations',

  // Research & Innovation
  'research': 'Research',
  'innovation': 'Innovation',
  'r&d': 'Research & Development',
  'lab': 'Laboratory',
  'science': 'Science'
};

// Job title keywords
const TITLE_KEYWORDS = {
  'ceo': 'CEO',
  'cto': 'CTO',
  'cfo': 'CFO',
  'coo': 'COO',
  'cmo': 'CMO',
  'vp': 'Vice President',
  'director': 'Director',
  'manager': 'Manager',
  'head': 'Head',
  'lead': 'Lead',
  'coordinator': 'Coordinator',
  'specialist': 'Specialist',
  'analyst': 'Analyst',
  'engineer': 'Engineer',
  'scientist': 'Scientist',
  'researcher': 'Researcher',
  'founder': 'Founder',
  'president': 'President'
};

/**
 * Parse email address and extract enriched information
 * @param {string} email - Email address to parse
 * @returns {Object} Enriched prospect data
 */
function enrichEmailData(email) {
  if (!email || !email.includes('@')) {
    return {
      name: null,
      firstName: null,
      lastName: null,
      title: null,
      department: null,
      isGeneric: true,
      qualityScore: 0
    };
  }

  const [username, domain] = email.toLowerCase().split('@');

  // Check if it's a generic email
  const isGeneric = GENERIC_PREFIXES.some(prefix =>
    username === prefix || username.startsWith(prefix + '.')
  );

  // Extract department from email prefix
  const department = extractDepartment(username);

  // Extract title/role from email prefix
  const title = extractTitle(username);

  // Extract name from email
  const { firstName, lastName, fullName } = extractName(username, email);

  // Calculate quality score
  const qualityScore = calculateQualityScore({
    firstName,
    lastName,
    isGeneric,
    department,
    title,
    domain
  });

  return {
    name: fullName,
    firstName,
    lastName,
    title,
    department,
    isGeneric,
    qualityScore,
    employmentType: determineEmploymentType(domain, username),
    seniority: determineSeniority(username, title)
  };
}

/**
 * Extract department from email username
 */
function extractDepartment(username) {
  // Check for exact matches first
  for (const [keyword, dept] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (username === keyword || username.startsWith(keyword + '.') || username.endsWith('.' + keyword)) {
      return dept;
    }
  }

  // Check for partial matches
  for (const [keyword, dept] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (username.includes(keyword)) {
      return dept;
    }
  }

  return null;
}

/**
 * Extract job title from email username
 */
function extractTitle(username) {
  for (const [keyword, title] of Object.entries(TITLE_KEYWORDS)) {
    if (username.includes(keyword)) {
      return title;
    }
  }
  return null;
}

/**
 * Extract name from email username with various pattern recognition
 */
function extractName(username, fullEmail) {
  // Remove numbers from username for name extraction
  const cleanUsername = username.replace(/[0-9]/g, '');

  // Pattern 1: first.last or first_last
  if (cleanUsername.includes('.') || cleanUsername.includes('_')) {
    const separator = cleanUsername.includes('.') ? '.' : '_';
    const parts = cleanUsername.split(separator).filter(p => p.length > 0);

    if (parts.length >= 2 && !GENERIC_PREFIXES.includes(parts[0])) {
      const firstName = capitalize(parts[0]);
      const lastName = capitalize(parts[parts.length - 1]);
      return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`
      };
    }
  }

  // Pattern 2: firstLast (camelCase) - e.g., sarahJohnson
  const camelCaseMatch = cleanUsername.match(/^([a-z]+)([A-Z][a-z]+)$/);
  if (camelCaseMatch) {
    const firstName = capitalize(camelCaseMatch[1]);
    const lastName = capitalize(camelCaseMatch[2]);
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`
    };
  }

  // Pattern 3: f.last or flast
  if (cleanUsername.length > 2 && !GENERIC_PREFIXES.includes(cleanUsername)) {
    // Check if it looks like initials + last name
    if (cleanUsername.match(/^[a-z]{1,2}[a-z]{3,}$/)) {
      const lastName = capitalize(cleanUsername.slice(1));
      return {
        firstName: null,
        lastName,
        fullName: lastName
      };
    }
  }

  // Pattern 4: Single word that's not generic
  if (!GENERIC_PREFIXES.includes(cleanUsername) && cleanUsername.length > 2) {
    // Check if it looks like a real name (not too short, not a keyword)
    const isDepartment = Object.keys(DEPARTMENT_KEYWORDS).some(k => cleanUsername.includes(k));
    const isRole = Object.keys(TITLE_KEYWORDS).some(k => cleanUsername.includes(k));

    if (!isDepartment && !isRole && cleanUsername.length >= 3) {
      const name = capitalize(cleanUsername);
      return {
        firstName: name,
        lastName: null,
        fullName: name
      };
    }
  }

  // If we can't extract a good name, return null
  return {
    firstName: null,
    lastName: null,
    fullName: null
  };
}

/**
 * Capitalize first letter of string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Calculate quality score for the extracted data
 */
function calculateQualityScore(data) {
  let score = 0;

  // Name quality (40 points)
  if (data.firstName && data.lastName) {
    score += 40;
  } else if (data.firstName || data.lastName) {
    score += 20;
  }

  // Not generic (30 points)
  if (!data.isGeneric) {
    score += 30;
  }

  // Has department (15 points)
  if (data.department) {
    score += 15;
  }

  // Has title (15 points)
  if (data.title) {
    score += 15;
  }

  // Business domain bonus (10 points)
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  if (!personalDomains.some(d => data.domain?.includes(d))) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Determine employment type from domain and username
 */
function determineEmploymentType(domain, username) {
  // Educational domains often indicate academic/research roles
  if (domain.includes('.edu') || domain.includes('.ac.')) {
    if (username.includes('student')) return 'Student';
    if (username.includes('research') || username.includes('postdoc')) return 'Researcher';
    return 'Academic/Research';
  }

  // Government domains
  if (domain.includes('.gov')) {
    return 'Government';
  }

  // Default to full-time for business emails
  return 'Full-time';
}

/**
 * Determine seniority level from username and title
 */
function determineSeniority(username, title) {
  const seniorKeywords = ['ceo', 'cto', 'cfo', 'coo', 'cmo', 'president', 'vp', 'director', 'head', 'chief'];
  const midKeywords = ['manager', 'lead', 'senior', 'principal'];
  const juniorKeywords = ['associate', 'junior', 'assistant', 'coordinator', 'intern'];

  const lowerUsername = username.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // Check senior level
  if (seniorKeywords.some(k => lowerUsername.includes(k) || lowerTitle.includes(k))) {
    return 'Senior';
  }

  // Check mid level
  if (midKeywords.some(k => lowerUsername.includes(k) || lowerTitle.includes(k))) {
    return 'Mid-level';
  }

  // Check junior level
  if (juniorKeywords.some(k => lowerUsername.includes(k) || lowerTitle.includes(k))) {
    return 'Junior';
  }

  return 'Mid-level'; // Default
}

/**
 * Enhance existing prospect with enriched email data
 */
function enhanceProspect(prospect) {
  if (!prospect.email) return prospect;

  const enrichedData = enrichEmailData(prospect.email);

  return {
    ...prospect,
    // Only override if we have better data
    name: enrichedData.name || prospect.name,
    firstName: enrichedData.firstName || prospect.firstName,
    lastName: enrichedData.lastName || prospect.lastName,
    title: enrichedData.title || prospect.title || prospect.role,
    department: enrichedData.department || prospect.department,
    role: enrichedData.title || prospect.role,
    employmentType: enrichedData.employmentType !== 'Full-time' ? enrichedData.employmentType : (prospect.employmentType || 'Full-time'),
    seniority: enrichedData.seniority || prospect.seniority || 'Mid-level',
    isGeneric: enrichedData.isGeneric,
    qualityScore: enrichedData.qualityScore,
    // Keep original data
    originalName: prospect.name
  };
}

module.exports = {
  enrichEmailData,
  enhanceProspect,
  extractDepartment,
  extractTitle,
  extractName,
  GENERIC_PREFIXES,
  DEPARTMENT_KEYWORDS,
  TITLE_KEYWORDS
};
