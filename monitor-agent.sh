#!/bin/bash

echo "🤖 PERSISTENT AI AGENT MONITORING DASHBOARD"
echo "==========================================="
echo "Commands available:"
echo "  monitor - Real-time monitoring"
echo "  status  - Current status"
echo "  stop    - Stop the agent"
echo "  logs    - View recent logs"
echo ""

case "$1" in
  "monitor")
    echo "📊 Starting real-time monitoring..."
    echo "Press Ctrl+C to exit"
    echo ""
    while true; do
      clear
      echo "🤖 PERSISTENT AI AGENT MONITOR"
      echo "================================"
      echo "Time: $(date)"
      echo ""
      
      # Get status
      node persistent-ai-agent.js status 2>/dev/null | jq -r '
        "Status: " + (if .isRunning then "🟢 RUNNING" else "🔴 STOPPED" end),
        "Runtime: " + (.stats.runtime | tostring) + " minutes",
        "Prospects Found: " + (.stats.prospectsFound | tostring),
        "Emails Sent: " + (.stats.emailsSent | tostring),
        "Knowledge Base: " + (.stats.learningsCount | tostring) + " entries",
        "Pending Emails: " + (.upcomingEmails | tostring),
        "",
        "Recent Activity:"
      '
      
      node persistent-ai-agent.js status 2>/dev/null | jq -r '
        .recentActivity[] | "  • " + .type + " (" + .timestamp[11:19] + ")"
      '
      
      echo ""
      echo "Next update in 10 seconds..."
      sleep 10
    done
    ;;
    
  "status")
    echo "📊 Current Agent Status:"
    node persistent-ai-agent.js status | jq .
    ;;
    
  "stop")
    echo "🛑 Stopping agent..."
    node persistent-ai-agent.js stop
    ;;
    
  "logs")
    echo "📋 Recent Agent Logs:"
    tail -20 data/agent_log.txt 2>/dev/null || echo "No logs found"
    ;;
    
  "kb")
    echo "📚 Knowledge Base Contents:"
    if [ -f "data/knowledge_base.json" ]; then
      jq . data/knowledge_base.json | head -50
    else
      echo "Knowledge base not found"
    fi
    ;;
    
  *)
    echo "Usage: ./monitor-agent.sh [command]"
    echo ""
    echo "Commands:"
    echo "  monitor - Real-time monitoring dashboard"
    echo "  status  - Show current status"
    echo "  stop    - Stop the agent"
    echo "  logs    - View recent logs"
    echo "  kb      - View knowledge base"
    echo ""
    echo "Examples:"
    echo "  ./monitor-agent.sh monitor"
    echo "  ./monitor-agent.sh status"
    ;;
esac