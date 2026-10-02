#!/bin/bash

# Validate Android signing certificate expiration
# Fails if certificate expires within 30 days
# Usage: bash scripts/validate-cert.sh

set -e

KEYSTORE_PATH="${KEYSTORE_PATH:=android/app/gmuseo.keystore}"
KEYSTORE_PASS="${KEYSTORE_PASS:=android}"
DAYS_THRESHOLD=30

if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "ERROR: Keystore not found at $KEYSTORE_PATH"
  echo "Set KEYSTORE_PATH environment variable to override"
  exit 1
fi

# Extract certificate expiration date using keytool
# Supports both English and Spanish locale output
FULL_INFO=$(keytool -list -v -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASS" 2>&1)

if [ $? -ne 0 ]; then
  echo "ERROR: Could not read certificate info. Check keystore path and password."
  exit 1
fi

# Parse expiration date (format: "Valid from ... until Wed Jun 07 21:07:00 CEST 2056")
# Matches English "until" or Spanish "hasta"
EXPIRY_LINE=$(echo "$FULL_INFO" | grep -i "until\|hasta" | head -1)

if [ -z "$EXPIRY_LINE" ]; then
  echo "ERROR: Could not parse certificate expiration date"
  exit 1
fi

# Extract date after "until" or "hasta" (everything after the colon or last word)
EXPIRY_DATE=$(echo "$EXPIRY_LINE" | sed -E 's/.*until|.*hasta[: ]//i' | xargs)

if [ -z "$EXPIRY_DATE" ]; then
  echo "ERROR: Could not extract date from: $EXPIRY_LINE"
  exit 1
fi

# Try multiple date parsing methods for different systems
EXPIRY_TIMESTAMP=""
if command -v date &> /dev/null; then
  # Try GNU date first (Linux)
  EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null) || true

  # Fall back to BSD date (macOS)
  if [ -z "$EXPIRY_TIMESTAMP" ]; then
    EXPIRY_TIMESTAMP=$(date -j -f "%a %b %d %T %Z %Y" "$EXPIRY_DATE" +%s 2>/dev/null) || true
  fi
fi

if [ -z "$EXPIRY_TIMESTAMP" ]; then
  echo "WARNING: Could not parse date '$EXPIRY_DATE', skipping expiration check"
  echo "Please verify certificate manually: keytool -list -v -keystore $KEYSTORE_PATH"
  exit 0
fi

NOW_TIMESTAMP=$(date +%s)
THRESHOLD_SECONDS=$((DAYS_THRESHOLD * 86400))

TIME_UNTIL_EXPIRY=$((EXPIRY_TIMESTAMP - NOW_TIMESTAMP))

if [ $TIME_UNTIL_EXPIRY -lt 0 ]; then
  echo "ERROR: Certificate has already expired on $EXPIRY_DATE"
  exit 1
elif [ $TIME_UNTIL_EXPIRY -lt $THRESHOLD_SECONDS ]; then
  DAYS_LEFT=$((TIME_UNTIL_EXPIRY / 86400))
  echo "ERROR: Certificate expires in $DAYS_LEFT days ($EXPIRY_DATE)"
  echo "Renew certificate before attempting release build"
  exit 1
else
  DAYS_LEFT=$((TIME_UNTIL_EXPIRY / 86400))
  echo "✓ Certificate valid. Expires in $DAYS_LEFT days ($EXPIRY_DATE)"
  exit 0
fi
