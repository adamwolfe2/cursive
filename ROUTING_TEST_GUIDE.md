# Lead Routing Test Harness - User Guide

## Purpose

This test harness validates the lead routing logic **before database deployment**. It simulates routing 50 test leads through 6 priority-based routing rules across 3 vertical marketplaces.

**No database required** - pure logic testing with mock data.

---

## Quick Start

### Run the Simulation

```bash
pnpm test:routing
```

**Output**:
- Console results showing routing decisions
- File saved to: `routing-simulation-results.txt`

---

## Test Configuration

### 3 Test Verticals (Mock Workspaces)

1. **Healthcare/Med Spas Marketplace** (`healthcare.cursive.com`)
   - Industries: Healthcare, Medical Spa, Wellness, Cosmetic Surgery, Dental
   - Coverage: All US states

2. **Door-to-Door Sales Marketplace** (`doorstep.cursive.com`)
   - Industries: Solar, Roofing, Security Systems, Pest Control, Window Replacement
   - Coverage: Pacific Northwest (WA, OR) + West Region

3. **Home Services/HVAC Marketplace** (`homeservices.cursive.com`)
   - Industries: HVAC, Plumbing, Electrical, Landscaping, Home Improvement
   - Coverage: Midwest + South regions

4. **Default Workspace** (unmatched leads)
   - Fallback for leads that don't match any rules

---

## Routing Rules (Priority-Based)

### Rule Priority System
- **Higher priority = evaluated first**
- Rules evaluated in descending priority order (100 → 90 → 80...)
- First matching rule wins

### Configured Rules

#### Healthcare Rules
1. **Healthcare - High Demand States** (Priority 100)
   - Industries: Healthcare, Medical Spa, Wellness, Cosmetic Surgery, Dental
   - States: CA, TX, FL
   - → Routes to Healthcare Workspace

2. **Healthcare - All Other States** (Priority 90)
   - Industries: Healthcare, Medical Spa, Wellness, Cosmetic Surgery, Dental
   - States: All other US states
   - → Routes to Healthcare Workspace

#### Door-to-Door Rules
3. **Door-to-Door - Pacific Northwest** (Priority 100)
   - Industries: Solar, Roofing, Security Systems, Pest Control
   - States: WA, OR
   - → Routes to Door-to-Door Workspace

4. **Door-to-Door - West Region** (Priority 80)
   - Industries: Solar, Roofing, Security Systems, Pest Control
   - Regions: West (CA, CO, WY, MT, ID, NV, UT, AZ, NM, AK, HI, WA, OR)
   - → Routes to Door-to-Door Workspace

#### HVAC Rules
5. **HVAC - Midwest + South** (Priority 100)
   - Industries: HVAC, Plumbing, Electrical, Landscaping, Home Improvement
   - Regions: Midwest, Southeast, Southwest
   - → Routes to HVAC Workspace

6. **HVAC - Other States** (Priority 80)
   - Industries: HVAC, Plumbing, Electrical, Landscaping, Home Improvement
   - States: All other US states
   - → Routes to HVAC Workspace

---

## Test Dataset (50 Leads)

### Lead Categories

**Healthcare Leads** (15 total):
- CA, TX, FL med spas (Rule 1 - Priority 100)
- Other states wellness/dental (Rule 2 - Priority 90)

**Door-to-Door Leads** (15 total):
- WA, OR solar/roofing (Rule 3 - Priority 100)
- CA, CO, NV, AZ security/pest control (Rule 4 - Priority 80)

**HVAC/Home Services Leads** (17 total):
- IL, GA, TX, MO HVAC/plumbing (Rule 5 - Priority 100)
- MA, PA, MD other states (Rule 6 - Priority 80)

**Edge Cases** (3 leads):
- Missing state → Routes to default workspace
- Missing industry → Routes to default workspace
- Unmatched industry (Software) → Routes to default workspace

---

## Understanding Results

### Summary Statistics

```
Total Leads Tested:    50
Correct Routing:       47 ✅
Incorrect Routing:     3 ❌
Accuracy:              94.00%
```

**What to look for**:
- **Accuracy should be 100%** for production deployment
- Any incorrect routing indicates a logic bug

### Distribution by Workspace

Shows how leads are distributed across marketplaces:

```
Healthcare/Med Spas Marketplace: 15 leads
Home Services/HVAC Marketplace: 17 leads
Door-to-Door Sales Marketplace: 15 leads
Unmatched Leads Holding: 3 leads
```

**What to validate**:
- Healthcare should get ~30% of leads
- HVAC should get ~34% of leads
- Door-to-Door should get ~30% of leads
- Default workspace should only have edge cases (<10%)

### Distribution by Rule

Shows which rules are matching:

```
Healthcare - High Demand States (Priority 100): 12 leads
HVAC - Midwest + South (Priority 100): 14 leads
Door-to-Door - Pacific Northwest (Priority 100): 6 leads
Healthcare - All Other States (Priority 90): 3 leads
```

**What to validate**:
- Higher priority rules should match more leads (if designed that way)
- No rule should have 0 matches (means it's unreachable)

### Routing Conflicts

If any leads route incorrectly, they appear here:

```
⚠️  ROUTING CONFLICTS DETECTED

Glow Medical Spa (Medical Spa, CA)
  Issue: Expected workspace healthcare-workspace-id (rule rule-healthcare-1),
         got default-workspace-id (rule null)
```

**What this means**:
- A lead that should match a rule is falling through to default
- Indicates a bug in rule conditions or priority ordering

### Detailed Results

Shows each lead's routing decision:

```
1. ✅ Glow Medical Spa
   Industry: Medical Spa | State: CA
   → Routed to: Healthcare/Med Spas Marketplace
   → Rule: Healthcare - High Demand States (priority 100)
   → Reason: Matched rule: Healthcare - High Demand States (priority 100)
```

**What to review**:
- Each lead should route to its expected workspace
- Routing reason should make sense given the lead's industry/location
- ❌ leads need investigation

---

## Common Issues & Fixes

### Issue 1: All Leads Route to Default Workspace

**Symptom**: 100% of leads go to default workspace

**Cause**: Rules conditions don't match any test leads

**Fix**:
1. Check industry spelling matches exactly (case-sensitive)
2. Verify state codes are uppercase (CA, not ca)
3. Ensure regions are spelled correctly

---

### Issue 2: Priority Conflicts

**Symptom**: Lower priority rule matching when higher priority should match

**Example**:
```
Solar company in WA routes to:
  Rule 4 (Door-to-Door - West Region, Priority 80)
Expected:
  Rule 3 (Door-to-Door - Pacific Northwest, Priority 100)
```

**Cause**: Higher priority rule conditions too restrictive

**Fix**: Adjust rule conditions or priorities

---

### Issue 3: Missing State Leads Don't Fallback

**Symptom**: Leads without state data cause errors instead of routing to default

**Cause**: Missing null checks in routing logic

**Fix**: Ensure all rule conditions handle null/undefined gracefully

---

### Issue 4: Region Mapping Incorrect

**Symptom**: TX leads go to Midwest instead of Southwest

**Cause**: State-to-region mapping incorrect

**Fix**: Review `getStateRegion()` mapping in test harness

---

## Interpreting 100% Accuracy

When all 50 leads route correctly:

```
Total Leads Tested:    50
Correct Routing:       50 ✅
Incorrect Routing:     0 ❌
Accuracy:              100.00%
```

**This means**:
- ✅ All rules are correctly configured
- ✅ Priority ordering is correct
- ✅ Edge cases (missing data) handled properly
- ✅ Geographic routing (regions + states) working
- ✅ Industry matching working
- ✅ Ready for database deployment

---

## Next Steps After 100% Accuracy

1. **Review Distribution**
   - Is the lead distribution across verticals what you expect?
   - Are high-priority rules matching the right volume?

2. **Add More Test Cases**
   - Test company size filtering (if you add that to rules)
   - Test revenue range filtering
   - Test international leads (non-US)

3. **Deploy to Database**
   - Apply the migration (`20260123000001_add_lead_routing.sql`)
   - Insert routing rules from test harness into `lead_routing_rules` table
   - Test with real leads from DataShopper/Clay

4. **Build Buyer Marketplace**
   - Create `/marketplace` route for buyers
   - Filter leads by authenticated buyer's workspace
   - Add claiming and payment flow

---

## Customizing the Test Harness

### Add New Test Leads

Edit `src/lib/services/__tests__/routing-test-harness.ts`:

```typescript
const TEST_LEADS = [
  ...existingLeads,
  {
    id: 'lead-051',
    company_name: 'My New Test Company',
    company_industry: 'Your Industry',
    company_location: { city: 'City', state: 'ST', country: 'US' },
    email: 'test@example.com',
    phone: '+1-555-0000',
    expected_workspace: 'expected-workspace-id',
    expected_rule: 'expected-rule-id'
  }
]
```

### Add New Routing Rules

```typescript
const MOCK_ROUTING_RULES = [
  ...existingRules,
  {
    id: 'rule-new',
    workspace_id: 'master-workspace-id',
    rule_name: 'My New Rule',
    priority: 95, // Choose appropriate priority
    is_active: true,
    destination_workspace_id: 'target-workspace-id',
    conditions: {
      industries: ['Industry1', 'Industry2'],
      us_states: ['CA', 'TX'],
      regions: [],
      countries: ['US']
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['custom-tag']
    }
  }
]
```

### Run Again

```bash
pnpm test:routing
```

---

## Production Deployment Checklist

Before deploying routing logic to production:

- [ ] Test harness shows 100% accuracy
- [ ] All 50 test leads route correctly
- [ ] No routing conflicts detected
- [ ] Lead distribution matches expectations
- [ ] Edge cases (missing data) handled
- [ ] Reviewed detailed results for each lead
- [ ] Customized rules for your actual verticals
- [ ] Database migration ready to apply
- [ ] Routing rules SQL ready to insert

**Only proceed to deployment when all boxes are checked.**

---

## Troubleshooting

### Error: Cannot find module

```
Error: Cannot find module '@/lib/services/lead-routing.service'
```

**Fix**: Ensure you're running from project root:
```bash
cd /Users/adamwolfe/openinfo-platform
pnpm test:routing
```

### TypeScript Compilation Errors

**Fix**: Run typecheck first:
```bash
pnpm typecheck
```

Fix any errors before running routing test.

### Results File Not Generated

**Fix**: Check write permissions:
```bash
touch routing-simulation-results.txt
chmod 644 routing-simulation-results.txt
```

---

## Questions to Answer With This Test

1. **Are my routing rules correct?**
   - Do healthcare leads go to healthcare marketplace?
   - Do geographic filters work (states and regions)?

2. **Is rule priority working?**
   - Do higher priority rules win when multiple rules could match?
   - Example: WA solar leads should match "Pacific Northwest" (priority 100) not "West Region" (priority 80)

3. **What happens to unmatched leads?**
   - Do they go to default workspace?
   - Are there too many unmatched leads?

4. **Is my vertical segmentation correct?**
   - Does each vertical get roughly the volume you expect?
   - Are leads properly isolated between verticals?

---

## Success Criteria

**Green Light for Production**:
- ✅ 100% routing accuracy
- ✅ 0 conflicts
- ✅ All verticals receiving leads
- ✅ Edge cases handled gracefully
- ✅ Distribution matches business logic

**Red Light - Need Fixes**:
- ❌ <100% accuracy
- ❌ Any conflicts
- ❌ Vertical receiving 0 leads (unless expected)
- ❌ Too many leads going to default workspace (>10%)

---

## Contact

If routing logic isn't working as expected:

1. Review the detailed results in `routing-simulation-results.txt`
2. Check rule conditions match your industry/state data exactly
3. Verify priority ordering makes sense
4. Ensure state-to-region mapping is correct for your business

**Remember**: Fix all issues in the test harness BEFORE deploying to database. It's much easier to debug with mock data than with production leads.

---

**Last Updated**: 2026-01-22
**Test Coverage**: 50 leads across 3 verticals
**Expected Accuracy**: 100%
