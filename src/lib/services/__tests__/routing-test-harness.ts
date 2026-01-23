/**
 * Lead Routing Test Harness
 *
 * Tests routing logic with mock data before deployment.
 * No database required - pure logic testing.
 */

import { LeadRoutingService } from '../lead-routing.service'

// ============================================================================
// MOCK WORKSPACES
// ============================================================================

const MOCK_WORKSPACES = [
  {
    id: 'healthcare-workspace-id',
    name: 'Healthcare/Med Spas Marketplace',
    subdomain: 'healthcare',
    allowed_industries: ['Healthcare', 'Medical Spa', 'Wellness', 'Cosmetic Surgery'],
    allowed_regions: [] // Will use routing rules instead
  },
  {
    id: 'doortodoor-workspace-id',
    name: 'Door-to-Door Sales Marketplace',
    subdomain: 'doorstep',
    allowed_industries: ['Solar', 'Roofing', 'Security Systems', 'Pest Control'],
    allowed_regions: [] // Will use routing rules instead
  },
  {
    id: 'hvac-workspace-id',
    name: 'Home Services/HVAC Marketplace',
    subdomain: 'homeservices',
    allowed_industries: ['HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Home Improvement'],
    allowed_regions: [] // Will use routing rules instead
  },
  {
    id: 'default-workspace-id',
    name: 'Unmatched Leads Holding',
    subdomain: 'default',
    allowed_industries: [],
    allowed_regions: []
  }
]

// ============================================================================
// MOCK ROUTING RULES (Priority-based)
// ============================================================================

const MOCK_ROUTING_RULES = [
  // Rule 1: Healthcare/Med Spas in CA, TX, FL (Priority 100)
  {
    id: 'rule-healthcare-1',
    workspace_id: 'master-workspace-id',
    rule_name: 'Healthcare - High Demand States',
    priority: 100,
    is_active: true,
    destination_workspace_id: 'healthcare-workspace-id',
    conditions: {
      industries: ['Healthcare', 'Medical Spa', 'Wellness', 'Cosmetic Surgery', 'Dental'],
      us_states: ['CA', 'TX', 'FL'],
      company_sizes: [], // Any size
      revenue_ranges: [],
      countries: ['US'],
      regions: []
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['healthcare', 'high-demand-state']
    }
  },

  // Rule 2: Healthcare in all other states (Priority 90)
  {
    id: 'rule-healthcare-2',
    workspace_id: 'master-workspace-id',
    rule_name: 'Healthcare - All Other States',
    priority: 90,
    is_active: true,
    destination_workspace_id: 'healthcare-workspace-id',
    conditions: {
      industries: ['Healthcare', 'Medical Spa', 'Wellness', 'Cosmetic Surgery', 'Dental'],
      us_states: [], // All states not matching higher priority rule
      company_sizes: [],
      revenue_ranges: [],
      countries: ['US'],
      regions: []
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['healthcare']
    }
  },

  // Rule 3: Door-to-Door in Pacific Northwest (Priority 100)
  {
    id: 'rule-d2d-pnw',
    workspace_id: 'master-workspace-id',
    rule_name: 'Door-to-Door - Pacific Northwest',
    priority: 100,
    is_active: true,
    destination_workspace_id: 'doortodoor-workspace-id',
    conditions: {
      industries: ['Solar', 'Roofing', 'Security Systems', 'Pest Control', 'Window Replacement'],
      us_states: ['WA', 'OR'],
      company_sizes: [],
      revenue_ranges: [],
      countries: ['US'],
      regions: []
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['door-to-door', 'pacific-northwest']
    }
  },

  // Rule 4: Door-to-Door in West region (Priority 80)
  {
    id: 'rule-d2d-west',
    workspace_id: 'master-workspace-id',
    rule_name: 'Door-to-Door - West Region',
    priority: 80,
    is_active: true,
    destination_workspace_id: 'doortodoor-workspace-id',
    conditions: {
      industries: ['Solar', 'Roofing', 'Security Systems', 'Pest Control', 'Window Replacement'],
      us_states: [],
      company_sizes: [],
      revenue_ranges: [],
      countries: ['US'],
      regions: ['West'] // CA, CO, WY, MT, ID, NV, UT, AZ, NM, AK, HI
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['door-to-door', 'west-region']
    }
  },

  // Rule 5: HVAC/Home Services in Midwest + South (Priority 100)
  {
    id: 'rule-hvac-midwest-south',
    workspace_id: 'master-workspace-id',
    rule_name: 'HVAC - Midwest + South',
    priority: 100,
    is_active: true,
    destination_workspace_id: 'hvac-workspace-id',
    conditions: {
      industries: ['HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Home Improvement', 'Heating & Cooling'],
      us_states: [],
      company_sizes: [],
      revenue_ranges: [],
      countries: ['US'],
      regions: ['Midwest', 'Southeast', 'Southwest']
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email', 'slack'],
      tag_with: ['home-services', 'midwest-south']
    }
  },

  // Rule 6: HVAC in all other US states (Priority 80)
  {
    id: 'rule-hvac-other',
    workspace_id: 'master-workspace-id',
    rule_name: 'HVAC - Other States',
    priority: 80,
    is_active: true,
    destination_workspace_id: 'hvac-workspace-id',
    conditions: {
      industries: ['HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Home Improvement'],
      us_states: [],
      company_sizes: [],
      revenue_ranges: [],
      countries: ['US'],
      regions: []
    },
    actions: {
      assign_to_workspace: true,
      notify_via: ['email'],
      tag_with: ['home-services']
    }
  }
]

// ============================================================================
// TEST LEAD DATASET (50 leads with varied data)
// ============================================================================

const TEST_LEADS = [
  // Healthcare - High Demand States (Should match Rule 1)
  {
    id: 'lead-001',
    company_name: 'Glow Medical Spa',
    company_industry: 'Medical Spa',
    company_location: { city: 'Los Angeles', state: 'CA', country: 'US' },
    email: 'info@glowmedspa.com',
    phone: '+1-310-555-0100',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-002',
    company_name: 'Austin Wellness Center',
    company_industry: 'Wellness',
    company_location: { city: 'Austin', state: 'TX', country: 'US' },
    email: 'contact@austinwellness.com',
    phone: '+1-512-555-0200',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-003',
    company_name: 'Miami Cosmetic Surgery',
    company_industry: 'Cosmetic Surgery',
    company_location: { city: 'Miami', state: 'FL', country: 'US' },
    email: 'appointments@miamicosmeticsurgery.com',
    phone: '+1-305-555-0300',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },

  // Healthcare - Other States (Should match Rule 2)
  {
    id: 'lead-004',
    company_name: 'Seattle Dental Group',
    company_industry: 'Dental',
    company_location: { city: 'Seattle', state: 'WA', country: 'US' },
    email: 'info@seattledental.com',
    phone: null,
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-2'
  },
  {
    id: 'lead-005',
    company_name: 'Phoenix Health Clinic',
    company_industry: 'Healthcare',
    company_location: { city: 'Phoenix', state: 'AZ', country: 'US' },
    email: 'contact@phxhealth.com',
    phone: '+1-602-555-0500',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-2'
  },

  // Door-to-Door - Pacific Northwest (Should match Rule 3 - highest priority for these states)
  {
    id: 'lead-006',
    company_name: 'Sunpower Solar WA',
    company_industry: 'Solar',
    company_location: { city: 'Spokane', state: 'WA', country: 'US' },
    email: 'sales@sunpowerwa.com',
    phone: '+1-509-555-0600',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-pnw'
  },
  {
    id: 'lead-007',
    company_name: 'Portland Roofing Co',
    company_industry: 'Roofing',
    company_location: { city: 'Portland', state: 'OR', country: 'US' },
    email: 'info@portlandroofing.com',
    phone: null,
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-pnw'
  },

  // Door-to-Door - West Region (Should match Rule 4)
  {
    id: 'lead-008',
    company_name: 'Bay Area Security Systems',
    company_industry: 'Security Systems',
    company_location: { city: 'San Jose', state: 'CA', country: 'US' },
    email: 'contact@basecurity.com',
    phone: '+1-408-555-0800',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-009',
    company_name: 'Denver Pest Control',
    company_industry: 'Pest Control',
    company_location: { city: 'Denver', state: 'CO', country: 'US' },
    email: 'service@denverpest.com',
    phone: '+1-720-555-0900',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },

  // HVAC - Midwest + South (Should match Rule 5)
  {
    id: 'lead-010',
    company_name: 'Chicago HVAC Pros',
    company_industry: 'HVAC',
    company_location: { city: 'Chicago', state: 'IL', country: 'US' },
    email: 'info@chicagohvac.com',
    phone: '+1-312-555-1000',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-011',
    company_name: 'Atlanta Plumbing Services',
    company_industry: 'Plumbing',
    company_location: { city: 'Atlanta', state: 'GA', country: 'US' },
    email: 'service@atlantaplumbing.com',
    phone: null,
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-012',
    company_name: 'Dallas Electrical Co',
    company_industry: 'Electrical',
    company_location: { city: 'Dallas', state: 'TX', country: 'US' },
    email: 'contact@dallaselectric.com',
    phone: '+1-214-555-1200',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },

  // HVAC - Other States (Should match Rule 6)
  {
    id: 'lead-013',
    company_name: 'Boston Landscaping',
    company_industry: 'Landscaping',
    company_location: { city: 'Boston', state: 'MA', country: 'US' },
    email: 'info@bostonlandscaping.com',
    phone: '+1-617-555-1300',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-other'
  },

  // Missing State (Should fallback to default workspace)
  {
    id: 'lead-014',
    company_name: 'Unknown Location HVAC',
    company_industry: 'HVAC',
    company_location: { city: 'Unknown', state: null, country: 'US' },
    email: 'info@unknownhvac.com',
    phone: null,
    expected_workspace: 'default-workspace-id',
    expected_rule: null
  },

  // Missing Industry (Should fallback to default workspace)
  {
    id: 'lead-015',
    company_name: 'Generic Company LLC',
    company_industry: null,
    company_location: { city: 'New York', state: 'NY', country: 'US' },
    email: 'info@genericco.com',
    phone: '+1-212-555-1500',
    expected_workspace: 'default-workspace-id',
    expected_rule: null
  },

  // Unmatched Industry (Should fallback to default workspace)
  {
    id: 'lead-016',
    company_name: 'Tech Startup Inc',
    company_industry: 'Software',
    company_location: { city: 'San Francisco', state: 'CA', country: 'US' },
    email: 'hello@techstartup.com',
    phone: '+1-415-555-1600',
    expected_workspace: 'default-workspace-id',
    expected_rule: null
  },

  // More test leads to reach 50...
  {
    id: 'lead-017',
    company_name: 'Tampa Medical Spa',
    company_industry: 'Medical Spa',
    company_location: { city: 'Tampa', state: 'FL', country: 'US' },
    email: 'bookings@tampamedsp a.com',
    phone: '+1-813-555-1700',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-018',
    company_name: 'Nashville Wellness',
    company_industry: 'Wellness',
    company_location: { city: 'Nashville', state: 'TN', country: 'US' },
    email: 'info@nashvillewellness.com',
    phone: null,
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-2'
  },
  {
    id: 'lead-019',
    company_name: 'Vegas Solar Solutions',
    company_industry: 'Solar',
    company_location: { city: 'Las Vegas', state: 'NV', country: 'US' },
    email: 'sales@vegassolar.com',
    phone: '+1-702-555-1900',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-020',
    company_name: 'Minneapolis Home Improvement',
    company_industry: 'Home Improvement',
    company_location: { city: 'Minneapolis', state: 'MN', country: 'US' },
    email: 'contact@mplshome.com',
    phone: '+1-612-555-2000',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },

  // Additional 30 leads for comprehensive testing...
  {
    id: 'lead-021',
    company_name: 'San Diego Dental',
    company_industry: 'Dental',
    company_location: { city: 'San Diego', state: 'CA', country: 'US' },
    email: 'appointments@sddental.com',
    phone: '+1-619-555-2100',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-022',
    company_name: 'Houston Cosmetic',
    company_industry: 'Cosmetic Surgery',
    company_location: { city: 'Houston', state: 'TX', country: 'US' },
    email: 'info@houstoncosmetic.com',
    phone: null,
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-023',
    company_name: 'Orlando Health Center',
    company_industry: 'Healthcare',
    company_location: { city: 'Orlando', state: 'FL', country: 'US' },
    email: 'contact@orlandohealth.com',
    phone: '+1-407-555-2300',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-024',
    company_name: 'Portland Security',
    company_industry: 'Security Systems',
    company_location: { city: 'Portland', state: 'OR', country: 'US' },
    email: 'sales@portlandsecurity.com',
    phone: '+1-503-555-2400',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-pnw'
  },
  {
    id: 'lead-025',
    company_name: 'Seattle Roofing',
    company_industry: 'Roofing',
    company_location: { city: 'Seattle', state: 'WA', country: 'US' },
    email: 'info@seattleroofing.com',
    phone: null,
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-pnw'
  },
  {
    id: 'lead-026',
    company_name: 'Phoenix Solar',
    company_industry: 'Solar',
    company_location: { city: 'Phoenix', state: 'AZ', country: 'US' },
    email: 'contact@phxsolar.com',
    phone: '+1-602-555-2600',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-027',
    company_name: 'Salt Lake Pest Control',
    company_industry: 'Pest Control',
    company_location: { city: 'Salt Lake City', state: 'UT', country: 'US' },
    email: 'service@slcpest.com',
    phone: '+1-801-555-2700',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-028',
    company_name: 'Detroit HVAC',
    company_industry: 'HVAC',
    company_location: { city: 'Detroit', state: 'MI', country: 'US' },
    email: 'info@detroithvac.com',
    phone: '+1-313-555-2800',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-029',
    company_name: 'Memphis Plumbing',
    company_industry: 'Plumbing',
    company_location: { city: 'Memphis', state: 'TN', country: 'US' },
    email: 'service@memphisplumbing.com',
    phone: null,
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-030',
    company_name: 'Kansas City Electrical',
    company_industry: 'Electrical',
    company_location: { city: 'Kansas City', state: 'MO', country: 'US' },
    email: 'contact@kcelectric.com',
    phone: '+1-816-555-3000',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-031',
    company_name: 'Charlotte Landscaping',
    company_industry: 'Landscaping',
    company_location: { city: 'Charlotte', state: 'NC', country: 'US' },
    email: 'info@charlottelandscaping.com',
    phone: '+1-704-555-3100',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-032',
    company_name: 'Philadelphia Home Services',
    company_industry: 'Home Improvement',
    company_location: { city: 'Philadelphia', state: 'PA', country: 'US' },
    email: 'contact@phillyhome.com',
    phone: '+1-215-555-3200',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-other'
  },
  {
    id: 'lead-033',
    company_name: 'Baltimore HVAC',
    company_industry: 'HVAC',
    company_location: { city: 'Baltimore', state: 'MD', country: 'US' },
    email: 'info@baltimorehvac.com',
    phone: null,
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-other'
  },
  {
    id: 'lead-034',
    company_name: 'Richmond Medical Spa',
    company_industry: 'Medical Spa',
    company_location: { city: 'Richmond', state: 'VA', country: 'US' },
    email: 'bookings@richmondmedspa.com',
    phone: '+1-804-555-3400',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-2'
  },
  {
    id: 'lead-035',
    company_name: 'Columbus Wellness',
    company_industry: 'Wellness',
    company_location: { city: 'Columbus', state: 'OH', country: 'US' },
    email: 'info@columbuswellness.com',
    phone: '+1-614-555-3500',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-2'
  },
  {
    id: 'lead-036',
    company_name: 'Albuquerque Solar',
    company_industry: 'Solar',
    company_location: { city: 'Albuquerque', state: 'NM', country: 'US' },
    email: 'sales@abqsolar.com',
    phone: '+1-505-555-3600',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-037',
    company_name: 'Boise Roofing',
    company_industry: 'Roofing',
    company_location: { city: 'Boise', state: 'ID', country: 'US' },
    email: 'info@boiseroofing.com',
    phone: null,
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-038',
    company_name: 'Milwaukee HVAC',
    company_industry: 'HVAC',
    company_location: { city: 'Milwaukee', state: 'WI', country: 'US' },
    email: 'contact@milwaukeehvac.com',
    phone: '+1-414-555-3800',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-039',
    company_name: 'St Louis Plumbing',
    company_industry: 'Plumbing',
    company_location: { city: 'St Louis', state: 'MO', country: 'US' },
    email: 'service@stlplumbing.com',
    phone: '+1-314-555-3900',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-040',
    company_name: 'Oklahoma City Electrical',
    company_industry: 'Electrical',
    company_location: { city: 'Oklahoma City', state: 'OK', country: 'US' },
    email: 'info@okcelectric.com',
    phone: '+1-405-555-4000',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-041',
    company_name: 'Sacramento Healthcare',
    company_industry: 'Healthcare',
    company_location: { city: 'Sacramento', state: 'CA', country: 'US' },
    email: 'contact@sachealth.com',
    phone: null,
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-042',
    company_name: 'San Antonio Dental',
    company_industry: 'Dental',
    company_location: { city: 'San Antonio', state: 'TX', country: 'US' },
    email: 'appointments@sadental.com',
    phone: '+1-210-555-4200',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-043',
    company_name: 'Jacksonville Med Spa',
    company_industry: 'Medical Spa',
    company_location: { city: 'Jacksonville', state: 'FL', country: 'US' },
    email: 'info@jaxmedspa.com',
    phone: '+1-904-555-4300',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-1'
  },
  {
    id: 'lead-044',
    company_name: 'Reno Security Systems',
    company_industry: 'Security Systems',
    company_location: { city: 'Reno', state: 'NV', country: 'US' },
    email: 'sales@renosecurity.com',
    phone: '+1-775-555-4400',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-045',
    company_name: 'Indianapolis HVAC',
    company_industry: 'HVAC',
    company_location: { city: 'Indianapolis', state: 'IN', country: 'US' },
    email: 'info@indyhvac.com',
    phone: '+1-317-555-4500',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-046',
    company_name: 'Louisville Landscaping',
    company_industry: 'Landscaping',
    company_location: { city: 'Louisville', state: 'KY', country: 'US' },
    email: 'contact@louisvillelandscaping.com',
    phone: null,
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-047',
    company_name: 'New Orleans Home Services',
    company_industry: 'Home Improvement',
    company_location: { city: 'New Orleans', state: 'LA', country: 'US' },
    email: 'service@nolahome.com',
    phone: '+1-504-555-4700',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  },
  {
    id: 'lead-048',
    company_name: 'Raleigh Wellness',
    company_industry: 'Wellness',
    company_location: { city: 'Raleigh', state: 'NC', country: 'US' },
    email: 'info@raleighwellness.com',
    phone: '+1-919-555-4800',
    expected_workspace: 'healthcare-workspace-id',
    expected_rule: 'rule-healthcare-2'
  },
  {
    id: 'lead-049',
    company_name: 'Tucson Solar',
    company_industry: 'Solar',
    company_location: { city: 'Tucson', state: 'AZ', country: 'US' },
    email: 'sales@tucsonsolar.com',
    phone: '+1-520-555-4900',
    expected_workspace: 'doortodoor-workspace-id',
    expected_rule: 'rule-d2d-west'
  },
  {
    id: 'lead-050',
    company_name: 'Omaha Plumbing',
    company_industry: 'Plumbing',
    company_location: { city: 'Omaha', state: 'NE', country: 'US' },
    email: 'contact@omahaplumbing.com',
    phone: '+1-402-555-5000',
    expected_workspace: 'hvac-workspace-id',
    expected_rule: 'rule-hvac-midwest-south'
  }
]

// ============================================================================
// ROUTING SIMULATION
// ============================================================================

interface RoutingResult {
  leadId: string
  companyName: string
  industry: string | null
  state: string | null
  actualWorkspace: string
  expectedWorkspace: string
  actualRule: string | null
  expectedRule: string | null
  isCorrect: boolean
  routingReason: string
}

/**
 * Mock the routing service methods for testing
 */
class MockLeadRoutingService {
  private rules = MOCK_ROUTING_RULES
  private workspaces = MOCK_WORKSPACES

  /**
   * Find matching rule for a lead (mimics real routing logic)
   */
  private findMatchingRule(lead: any): any | null {
    // Sort rules by priority (descending)
    const sortedRules = [...this.rules]
      .filter(r => r.is_active)
      .sort((a, b) => b.priority - a.priority)

    for (const rule of sortedRules) {
      if (this.doesLeadMatchRule(lead, rule)) {
        return rule
      }
    }

    return null
  }

  /**
   * Check if lead matches rule conditions
   */
  private doesLeadMatchRule(lead: any, rule: any): boolean {
    const conditions = rule.conditions

    // Check industry
    if (conditions.industries.length > 0) {
      if (!lead.company_industry || !conditions.industries.includes(lead.company_industry)) {
        return false
      }
    }

    // Check state
    if (conditions.us_states.length > 0) {
      if (!lead.company_location?.state || !conditions.us_states.includes(lead.company_location.state)) {
        return false
      }
    }

    // Check region
    if (conditions.regions.length > 0) {
      const state = lead.company_location?.state
      if (!state) return false

      const region = this.getStateRegion(state)
      if (!region || !conditions.regions.includes(region)) {
        return false
      }
    }

    // Check country
    if (conditions.countries.length > 0) {
      if (!lead.company_location?.country || !conditions.countries.includes(lead.company_location.country)) {
        return false
      }
    }

    return true
  }

  /**
   * Map state to region
   */
  private getStateRegion(state: string): string | null {
    const regionMap: Record<string, string> = {
      // Northeast
      'CT': 'Northeast', 'ME': 'Northeast', 'MA': 'Northeast', 'NH': 'Northeast',
      'RI': 'Northeast', 'VT': 'Northeast', 'NJ': 'Northeast', 'NY': 'Northeast', 'PA': 'Northeast',

      // Southeast
      'DE': 'Southeast', 'FL': 'Southeast', 'GA': 'Southeast', 'MD': 'Southeast',
      'NC': 'Southeast', 'SC': 'Southeast', 'VA': 'Southeast', 'WV': 'Southeast',
      'AL': 'Southeast', 'KY': 'Southeast', 'MS': 'Southeast', 'TN': 'Southeast',
      'AR': 'Southeast', 'LA': 'Southeast',

      // Midwest
      'IL': 'Midwest', 'IN': 'Midwest', 'MI': 'Midwest', 'OH': 'Midwest',
      'WI': 'Midwest', 'IA': 'Midwest', 'KS': 'Midwest', 'MN': 'Midwest',
      'MO': 'Midwest', 'NE': 'Midwest', 'ND': 'Midwest', 'SD': 'Midwest',

      // Southwest
      'AZ': 'Southwest', 'NM': 'Southwest', 'OK': 'Southwest', 'TX': 'Southwest',

      // West
      'CO': 'West', 'ID': 'West', 'MT': 'West', 'NV': 'West', 'UT': 'West',
      'WY': 'West', 'AK': 'West', 'CA': 'West', 'HI': 'West', 'OR': 'West', 'WA': 'West'
    }

    return regionMap[state] || null
  }

  /**
   * Route a single lead
   */
  async routeLead(lead: any): Promise<{ workspaceId: string; ruleId: string | null; reason: string }> {
    // Try to find matching rule
    const matchedRule = this.findMatchingRule(lead)

    if (matchedRule) {
      return {
        workspaceId: matchedRule.destination_workspace_id,
        ruleId: matchedRule.id,
        reason: `Matched rule: ${matchedRule.rule_name} (priority ${matchedRule.priority})`
      }
    }

    // Fallback to default workspace
    return {
      workspaceId: 'default-workspace-id',
      ruleId: null,
      reason: 'No matching rule found - routed to default workspace'
    }
  }
}

/**
 * Run routing simulation on all test leads
 */
export async function runRoutingSimulation(): Promise<{
  results: RoutingResult[]
  summary: {
    total: number
    correct: number
    incorrect: number
    accuracy: number
    byWorkspace: Record<string, number>
    byRule: Record<string, number>
    conflicts: Array<{ leadId: string; issue: string }>
  }
}> {
  const service = new MockLeadRoutingService()
  const results: RoutingResult[] = []
  const conflicts: Array<{ leadId: string; issue: string }> = []

  // Route each test lead
  for (const lead of TEST_LEADS) {
    const routingResult = await service.routeLead(lead)

    const isCorrect = routingResult.workspaceId === lead.expected_workspace &&
      (routingResult.ruleId === lead.expected_rule || (!routingResult.ruleId && !lead.expected_rule))

    results.push({
      leadId: lead.id,
      companyName: lead.company_name,
      industry: lead.company_industry,
      state: lead.company_location?.state || null,
      actualWorkspace: routingResult.workspaceId,
      expectedWorkspace: lead.expected_workspace,
      actualRule: routingResult.ruleId,
      expectedRule: lead.expected_rule,
      isCorrect,
      routingReason: routingResult.reason
    })

    // Track conflicts
    if (!isCorrect) {
      conflicts.push({
        leadId: lead.id,
        issue: `Expected workspace ${lead.expected_workspace} (rule ${lead.expected_rule}), got ${routingResult.workspaceId} (rule ${routingResult.ruleId})`
      })
    }
  }

  // Calculate summary stats
  const correct = results.filter(r => r.isCorrect).length
  const incorrect = results.filter(r => !r.isCorrect).length
  const accuracy = (correct / results.length) * 100

  const byWorkspace: Record<string, number> = {}
  const byRule: Record<string, number> = {}

  results.forEach(r => {
    byWorkspace[r.actualWorkspace] = (byWorkspace[r.actualWorkspace] || 0) + 1
    if (r.actualRule) {
      byRule[r.actualRule] = (byRule[r.actualRule] || 0) + 1
    }
  })

  return {
    results,
    summary: {
      total: results.length,
      correct,
      incorrect,
      accuracy,
      byWorkspace,
      byRule,
      conflicts
    }
  }
}

/**
 * Format results as readable text
 */
export function formatRoutingResults(data: Awaited<ReturnType<typeof runRoutingSimulation>>): string {
  const { results, summary } = data

  let output = ''

  // Header
  output += '═══════════════════════════════════════════════════════════════\n'
  output += '           LEAD ROUTING SIMULATION RESULTS\n'
  output += '═══════════════════════════════════════════════════════════════\n\n'

  // Summary Statistics
  output += '📊 SUMMARY STATISTICS\n'
  output += '─────────────────────────────────────────────────────────────\n'
  output += `Total Leads Tested:    ${summary.total}\n`
  output += `Correct Routing:       ${summary.correct} ✅\n`
  output += `Incorrect Routing:     ${summary.incorrect} ❌\n`
  output += `Accuracy:              ${summary.accuracy.toFixed(2)}%\n\n`

  // Distribution by Workspace
  output += '📂 DISTRIBUTION BY WORKSPACE\n'
  output += '─────────────────────────────────────────────────────────────\n'
  Object.entries(summary.byWorkspace)
    .sort((a, b) => b[1] - a[1])
    .forEach(([workspaceId, count]) => {
      const workspace = MOCK_WORKSPACES.find(w => w.id === workspaceId)
      output += `${workspace?.name || workspaceId}: ${count} leads\n`
    })
  output += '\n'

  // Distribution by Rule
  output += '📏 DISTRIBUTION BY RULE\n'
  output += '─────────────────────────────────────────────────────────────\n'
  Object.entries(summary.byRule)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ruleId, count]) => {
      const rule = MOCK_ROUTING_RULES.find(r => r.id === ruleId)
      output += `${rule?.rule_name || ruleId} (Priority ${rule?.priority}): ${count} leads\n`
    })
  output += '\n'

  // Conflicts (if any)
  if (summary.conflicts.length > 0) {
    output += '⚠️  ROUTING CONFLICTS DETECTED\n'
    output += '─────────────────────────────────────────────────────────────\n'
    summary.conflicts.forEach(conflict => {
      const result = results.find(r => r.leadId === conflict.leadId)
      output += `\n${result?.companyName} (${result?.industry}, ${result?.state})\n`
      output += `  Issue: ${conflict.issue}\n`
    })
    output += '\n'
  }

  // Detailed Results
  output += '📋 DETAILED ROUTING RESULTS\n'
  output += '─────────────────────────────────────────────────────────────\n\n'

  results.forEach((result, index) => {
    const status = result.isCorrect ? '✅' : '❌'
    const workspace = MOCK_WORKSPACES.find(w => w.id === result.actualWorkspace)
    const rule = MOCK_ROUTING_RULES.find(r => r.id === result.actualRule)

    output += `${index + 1}. ${status} ${result.companyName}\n`
    output += `   Industry: ${result.industry || 'N/A'} | State: ${result.state || 'N/A'}\n`
    output += `   → Routed to: ${workspace?.name || result.actualWorkspace}\n`
    output += `   → Rule: ${rule?.rule_name || 'No rule (fallback)'}\n`
    output += `   → Reason: ${result.routingReason}\n`

    if (!result.isCorrect) {
      const expectedWorkspace = MOCK_WORKSPACES.find(w => w.id === result.expectedWorkspace)
      const expectedRule = MOCK_ROUTING_RULES.find(r => r.id === result.expectedRule)
      output += `   ⚠️  Expected: ${expectedWorkspace?.name} via ${expectedRule?.rule_name || 'fallback'}\n`
    }

    output += '\n'
  })

  // Footer
  output += '═══════════════════════════════════════════════════════════════\n'
  output += '                    END OF SIMULATION\n'
  output += '═══════════════════════════════════════════════════════════════\n'

  return output
}

/**
 * Main execution function
 */
export async function main() {
  console.log('Starting lead routing simulation...\n')

  const simulationData = await runRoutingSimulation()
  const formattedOutput = formatRoutingResults(simulationData)

  console.log(formattedOutput)

  // Write to file
  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(process.cwd(), 'routing-simulation-results.txt')
  fs.writeFileSync(outputPath, formattedOutput)

  console.log(`\n✅ Results saved to: ${outputPath}\n`)

  return simulationData
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}
