#!/bin/bash

# ZedFace Control Script
# Usage: ./control.sh <action> [options]

SERVER_URL="http://localhost:3001"
AUTH_TOKEN="${ZEDFACE_TOKEN:-zedface-control-2024}"

# Helper function to make API calls
api_call() {
  local data="$1"
  curl -s -X POST "$SERVER_URL/api/control" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Helper function to get status
get_status() {
  curl -s -X GET "$SERVER_URL/api/status" \
    -H "Authorization: Bearer $AUTH_TOKEN"
}

# Parse command
case "$1" in
  "state")
    if [ -z "$2" ]; then
      echo "Usage: $0 state <state_name>"
      echo "Available states: intro, idle, offline, reconnecting, listening, thinking, speaking, error"
      exit 1
    fi
    api_call "{\"action\": \"setState\", \"state\": \"$2\"}"
    ;;

  "param")
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "Usage: $0 param <param_name> <value>"
      echo "Example: $0 param particleSize 20"
      exit 1
    fi
    api_call "{\"action\": \"setParam\", \"param\": \"$2\", \"value\": $3}"
    ;;

  "preset")
    if [ -z "$2" ]; then
      echo "Usage: $0 preset <preset_name>"
      echo "Available presets: calm, energetic, alert, sleeping"
      exit 1
    fi
    api_call "{\"action\": \"applyPreset\", \"preset\": \"$2\"}"
    ;;

  "status")
    get_status
    ;;

  "help")
    echo "ZedFace Control Script"
    echo ""
    echo "Usage:"
    echo "  $0 state <state>          - Set sphere state"
    echo "  $0 param <name> <value>   - Set a parameter"
    echo "  $0 preset <name>          - Apply a preset scene"
    echo "  $0 status                 - Get current status"
    echo "  $0 help                   - Show this help"
    echo ""
    echo "States: intro, idle, offline, reconnecting, listening, thinking, speaking, error"
    echo "Presets: calm, energetic, alert, sleeping"
    echo ""
    echo "Environment variables:"
    echo "  ZEDFACE_TOKEN  - Authentication token (default: zedface-control-2024)"
    ;;

  *)
    echo "Unknown command: $1"
    echo "Run '$0 help' for usage information"
    exit 1
    ;;
esac
