#!/bin/bash
# =============================================================================
# Production Readiness Validation Script
# OpenInfo Platform - Lead Marketplace
#
# This script runs the complete local verification pipeline to ensure
# the branch is ready for merge to main.
#
# Usage: ./scripts/validate.sh
# =============================================================================

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
FAILED=0
STEPS_RUN=0
STEPS_PASSED=0

# Function to print step header
step() {
    echo ""
    echo "=============================================="
    echo -e "${YELLOW}[$((++STEPS_RUN))] $1${NC}"
    echo "=============================================="
}

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((STEPS_PASSED++))
}

# Function to print failure
failure() {
    echo -e "${RED}✗ $1${NC}"
    FAILED=1
}

# Function to print info
info() {
    echo -e "  $1"
}

# =============================================================================
# STEP 1: TypeScript Compilation Check
# =============================================================================
step "TypeScript Compilation Check"
if pnpm typecheck 2>&1; then
    success "TypeScript compilation passed"
else
    failure "TypeScript compilation failed"
fi

# =============================================================================
# STEP 2: Linting
# =============================================================================
step "ESLint Check"
if pnpm lint 2>&1; then
    success "ESLint passed"
else
    failure "ESLint failed"
fi

# =============================================================================
# STEP 3: Unit Tests
# =============================================================================
step "Unit Tests"
if pnpm test 2>&1; then
    success "All tests passed"
else
    failure "Tests failed"
fi

# =============================================================================
# STEP 4: Build Check (ensures production build works)
# =============================================================================
step "Production Build Check"
if pnpm build 2>&1; then
    success "Production build successful"
else
    failure "Production build failed"
fi

# =============================================================================
# STEP 5: Migration Files Check
# =============================================================================
step "Migration Files Validation"
MIGRATION_DIR="supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
    MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)
    info "Found $MIGRATION_COUNT migration files"

    # Check for migration naming convention (YYYYMMDDHHMMSS_name.sql)
    INVALID_MIGRATIONS=$(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | grep -v '[0-9]\{14\}_' || true)
    if [ -z "$INVALID_MIGRATIONS" ]; then
        success "All migration files follow naming convention"
    else
        failure "Some migrations don't follow naming convention"
        echo "$INVALID_MIGRATIONS"
    fi
else
    info "No migrations directory found (OK if not using Supabase migrations locally)"
    success "Migration check skipped"
fi

# =============================================================================
# STEP 6: Environment Variables Check
# =============================================================================
step "Environment Variables Check"
if [ -f ".env.example" ]; then
    info "Checking .env.example completeness..."

    # Key variables that should be documented
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )

    MISSING_VARS=0
    for VAR in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "$VAR" .env.example; then
            info "Missing: $VAR"
            MISSING_VARS=$((MISSING_VARS + 1))
        fi
    done

    if [ $MISSING_VARS -eq 0 ]; then
        success "All required environment variables documented"
    else
        failure "$MISSING_VARS required variables missing from .env.example"
    fi
else
    failure ".env.example file not found"
fi

# =============================================================================
# STEP 7: Security Check - No Hardcoded Secrets
# =============================================================================
step "Security Check - Hardcoded Secrets"
# Look for common secret patterns (simplified check)
POTENTIAL_SECRETS=$(grep -rn --include="*.ts" --include="*.tsx" \
    -E "(sk_live_|sk_test_|AKIA[A-Z0-9]{16}|password\s*=\s*['\"][^'\"]+['\"])" \
    src/ 2>/dev/null | grep -v ".test." | grep -v "// example" || true)

if [ -z "$POTENTIAL_SECRETS" ]; then
    success "No hardcoded secrets detected"
else
    failure "Potential hardcoded secrets found:"
    echo "$POTENTIAL_SECRETS"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "=============================================="
echo "VALIDATION SUMMARY"
echo "=============================================="
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=============================================="
    echo "            ALL CHECKS PASSED!"
    echo "=============================================="
    echo ""
    echo "Steps run: $STEPS_RUN"
    echo "Steps passed: $STEPS_PASSED"
    echo ""
    echo "Branch is ready for merge."
    echo "=============================================="
    echo -e "${NC}"
    exit 0
else
    echo -e "${RED}=============================================="
    echo "            VALIDATION FAILED"
    echo "=============================================="
    echo ""
    echo "Steps run: $STEPS_RUN"
    echo "Steps passed: $STEPS_PASSED"
    echo "Steps failed: $((STEPS_RUN - STEPS_PASSED))"
    echo ""
    echo "Please fix the issues above before merging."
    echo "=============================================="
    echo -e "${NC}"
    exit 1
fi
