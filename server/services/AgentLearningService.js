/**
 * Agent Learning Service
 * Responsible for capturing, analyzing, and applying learnings during workflows
 * Makes the agent truly self-improving per campaign/user
 */

const db = require('../models/database');

class AgentLearningService {
  constructor() {
    this.learningCategories = {
      PROSPECT_QUALITY: 'prospect_quality',
      EMAIL_PERFORMANCE: 'email_performance',
      SEARCH_OPTIMIZATION: 'search_optimization',
      TIMING: 'timing',
      INDUSTRY_INSIGHTS: 'industry_insights',
      PERSONALIZATION: 'personalization',
      SUBJECT_LINES: 'subject_lines',
      CALL_TO_ACTION: 'call_to_action'
    };

    this.learningTypes = {
      OBSERVATION: 'observation',
      PATTERN: 'pattern',
      CORRELATION: 'correlation',
      IMPROVEMENT: 'improvement',
      WARNING: 'warning'
    };

    console.log('🧠 Agent Learning Service initialized');
  }

  /**
   * Analyze prospect search results and learn from them
   */
  async learnFromProspectSearch(userId, campaignId, searchQuery, results, context = {}) {
    try {
      const validEmails = results.filter(r => r.email && r.email.includes('@'));
      const industries = [...new Set(results.map(r => r.industry).filter(Boolean))];
      const companies = results.map(r => r.company).filter(Boolean);

      // Learning: Search effectiveness
      if (validEmails.length > 0) {
        const successRate = validEmails.length / Math.max(results.length, 1);

        await db.saveAgentLearning(userId, campaignId, {
          type: this.learningTypes.OBSERVATION,
          category: this.learningCategories.SEARCH_OPTIMIZATION,
          insight: `Search query "${searchQuery}" yielded ${validEmails.length} valid prospects with ${(successRate * 100).toFixed(0)}% success rate`,
          evidence: {
            query: searchQuery,
            totalResults: results.length,
            validEmails: validEmails.length,
            successRate
          },
          confidence: Math.min(0.5 + (validEmails.length * 0.05), 0.95),
          impactScore: successRate
        });

        // Track metric
        await db.saveAgentMetric(userId, campaignId, {
          type: 'search',
          name: 'prospect_discovery_rate',
          value: successRate,
          context: { query: searchQuery }
        });
      }

      // Learning: Industry patterns
      if (industries.length > 0) {
        const topIndustry = this.getMostFrequent(results.map(r => r.industry).filter(Boolean));
        if (topIndustry) {
          await db.saveAgentLearning(userId, campaignId, {
            type: this.learningTypes.PATTERN,
            category: this.learningCategories.INDUSTRY_INSIGHTS,
            insight: `"${topIndustry}" is the dominant industry in search results (${industries.length} unique industries found)`,
            evidence: { industries, topIndustry },
            confidence: 0.7,
            impactScore: 0.5
          });
        }
      }

      // Log decision
      await db.logAgentDecision(userId, campaignId, {
        type: 'prospect_search',
        decision: `Executed search: "${searchQuery}"`,
        reasoning: `Target audience analysis suggested this search term based on ${context.audienceType || 'general'} audience`,
        alternatives: context.alternativeQueries || []
      });

      return { success: true, learningsCreated: 2 };
    } catch (error) {
      console.error('❌ [AgentLearning] Failed to learn from prospect search:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Learn from email generation patterns
   */
  async learnFromEmailGeneration(userId, campaignId, emailData, prospect, context = {}) {
    try {
      const subjectLength = emailData.subject?.length || 0;
      const bodyLength = emailData.body?.length || emailData.html?.length || 0;
      const hasPersonalization = this.detectPersonalization(emailData.body || emailData.html);

      // Learning: Email structure preferences
      await db.saveAgentLearning(userId, campaignId, {
        type: this.learningTypes.OBSERVATION,
        category: this.learningCategories.EMAIL_PERFORMANCE,
        insight: `Generated email with ${subjectLength} char subject, ${bodyLength} char body${hasPersonalization ? ', with personalization' : ''}`,
        evidence: {
          subjectLength,
          bodyLength,
          hasPersonalization,
          prospectIndustry: prospect?.industry,
          prospectRole: prospect?.role || prospect?.position
        },
        confidence: 0.6,
        impactScore: hasPersonalization ? 0.7 : 0.4
      });

      // Learning: Subject line patterns
      if (emailData.subject) {
        const subjectPattern = this.analyzeSubjectLine(emailData.subject);
        await db.saveAgentLearning(userId, campaignId, {
          type: this.learningTypes.PATTERN,
          category: this.learningCategories.SUBJECT_LINES,
          insight: `Subject line style: ${subjectPattern.style} (${subjectPattern.hasQuestion ? 'question' : 'statement'}, ${subjectPattern.hasNumber ? 'with numbers' : 'no numbers'})`,
          evidence: subjectPattern,
          confidence: 0.65,
          impactScore: 0.5
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [AgentLearning] Failed to learn from email generation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Learn from email send results (opens, clicks, replies)
   */
  async learnFromEmailResults(userId, campaignId, emailId, results) {
    try {
      const { opened, clicked, replied, bounced } = results;

      // Learning: Email effectiveness
      if (opened) {
        await db.saveAgentLearning(userId, campaignId, {
          type: this.learningTypes.CORRELATION,
          category: this.learningCategories.EMAIL_PERFORMANCE,
          insight: `Email was opened - subject line was effective`,
          evidence: { emailId, opened: true, clicked, replied },
          confidence: 0.8,
          impactScore: replied ? 1.0 : clicked ? 0.8 : 0.6
        });
      }

      if (replied) {
        await db.saveAgentLearning(userId, campaignId, {
          type: this.learningTypes.IMPROVEMENT,
          category: this.learningCategories.EMAIL_PERFORMANCE,
          insight: `Email received a reply - content resonated with recipient`,
          evidence: { emailId, replied: true },
          confidence: 0.95,
          impactScore: 1.0
        });

        // Track high-value metric
        await db.saveAgentMetric(userId, campaignId, {
          type: 'email',
          name: 'reply_received',
          value: 1,
          context: { emailId }
        });
      }

      if (bounced) {
        await db.saveAgentLearning(userId, campaignId, {
          type: this.learningTypes.WARNING,
          category: this.learningCategories.PROSPECT_QUALITY,
          insight: `Email bounced - prospect data quality issue detected`,
          evidence: { emailId, bounced: true },
          confidence: 0.9,
          impactScore: -0.5
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [AgentLearning] Failed to learn from email results:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get applicable learnings for current context
   * This is how the agent "applies" what it learned
   */
  async getApplicableLearnings(userId, campaignId, context) {
    try {
      const learnings = await db.getAgentLearnings(userId, campaignId, {
        minConfidence: 0.6,
        limit: 20
      });

      // Filter learnings relevant to current context
      const applicable = learnings.filter(l => {
        if (context.stage === 'prospect_search' && l.category === this.learningCategories.SEARCH_OPTIMIZATION) {
          return true;
        }
        if (context.stage === 'email_generation' &&
            (l.category === this.learningCategories.EMAIL_PERFORMANCE ||
             l.category === this.learningCategories.SUBJECT_LINES ||
             l.category === this.learningCategories.PERSONALIZATION)) {
          return true;
        }
        if (context.industry && l.category === this.learningCategories.INDUSTRY_INSIGHTS) {
          return true;
        }
        return false;
      });

      // Sort by impact score and confidence
      applicable.sort((a, b) => (b.impactScore * b.confidence) - (a.impactScore * a.confidence));

      return applicable.slice(0, 5);
    } catch (error) {
      console.error('❌ [AgentLearning] Failed to get applicable learnings:', error);
      return [];
    }
  }

  /**
   * Generate optimization suggestions based on learnings
   */
  async generateOptimizationSuggestions(userId, campaignId) {
    try {
      const insights = await db.getAgentInsightsSummary(userId, campaignId);
      const suggestions = [];

      // Analyze learnings for actionable suggestions
      if (insights.topLearnings) {
        for (const learning of insights.topLearnings) {
          if (learning.type === this.learningTypes.PATTERN && learning.confidence > 0.7) {
            suggestions.push({
              type: 'pattern_detected',
              category: learning.category,
              suggestion: `Based on observed patterns: ${learning.insight}`,
              confidence: learning.confidence,
              action: this.suggestActionForPattern(learning)
            });
          }

          if (learning.type === this.learningTypes.WARNING) {
            suggestions.push({
              type: 'warning',
              category: learning.category,
              suggestion: `Warning detected: ${learning.insight}`,
              confidence: learning.confidence,
              action: 'Review and address this issue'
            });
          }
        }
      }

      // Analyze metrics for improvement suggestions
      if (insights.improvements && insights.improvements.length > 0) {
        const improving = insights.improvements.filter(m => m.improvement > 0);
        const declining = insights.improvements.filter(m => m.improvement < 0);

        if (improving.length > 0) {
          suggestions.push({
            type: 'positive_trend',
            category: 'performance',
            suggestion: `Positive trends detected in: ${improving.map(m => m.name).join(', ')}`,
            confidence: 0.8,
            action: 'Continue current approach'
          });
        }

        if (declining.length > 0) {
          suggestions.push({
            type: 'negative_trend',
            category: 'performance',
            suggestion: `Declining metrics: ${declining.map(m => m.name).join(', ')}`,
            confidence: 0.8,
            action: 'Review and adjust strategy'
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('❌ [AgentLearning] Failed to generate suggestions:', error);
      return [];
    }
  }

  // Helper methods
  getMostFrequent(arr) {
    if (!arr || arr.length === 0) return null;
    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  detectPersonalization(content) {
    if (!content) return false;
    const patterns = [
      /\{name\}/i, /\{company\}/i, /\{first_?name\}/i,
      /{{.*}}/i, /\[.*\]/i
    ];
    return patterns.some(p => p.test(content));
  }

  analyzeSubjectLine(subject) {
    return {
      length: subject.length,
      hasQuestion: subject.includes('?'),
      hasNumber: /\d/.test(subject),
      hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(subject),
      hasUrgency: /(urgent|asap|today|now|limited)/i.test(subject),
      style: subject.length < 30 ? 'short' : subject.length < 60 ? 'medium' : 'long'
    };
  }

  suggestActionForPattern(learning) {
    const actions = {
      [this.learningCategories.SEARCH_OPTIMIZATION]: 'Refine search queries to match successful patterns',
      [this.learningCategories.EMAIL_PERFORMANCE]: 'Apply email best practices from high-performing emails',
      [this.learningCategories.SUBJECT_LINES]: 'Use subject line patterns that showed better open rates',
      [this.learningCategories.INDUSTRY_INSIGHTS]: 'Tailor messaging for dominant industry segments',
      [this.learningCategories.PERSONALIZATION]: 'Increase personalization in email content'
    };
    return actions[learning.category] || 'Review and apply learnings';
  }
}

module.exports = new AgentLearningService();
