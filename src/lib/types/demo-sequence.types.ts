/**
 * Demo Nurture Sequence Types
 * Cursive Platform
 *
 * Type definitions for the 6-email demo nurture sequence
 */

export type DemoSequenceEmailType =
  | 'demo-confirmation'
  | 'demo-1day-reminder'
  | 'demo-2hour-reminder'
  | 'demo-followup'
  | 'demo-checkin'
  | 'demo-breakup';

export interface DemoSequenceTokens {
  // Lead info
  firstName: string;
  lastName?: string;
  companyName: string;
  leadId: string;

  // Demo details
  demoDate: string; // Formatted: "Monday, February 10th, 2026"
  demoTime: string; // Formatted: "2:00 PM"
  timezone: string; // e.g., "EST", "PST"
  demoDateRaw: Date; // Raw date object for calculations

  // Demo owner info
  demoOwner: string;
  demoOwnerTitle: string;
  demoOwnerEmail: string;
  demoOwnerPhone?: string;

  // Links
  calendarLink: string;
  rescheduleLink: string;
  meetingLink: string;

  // Email 4 specific
  customFeature?: string;
  customFeatureDescription?: string;
  estimatedVisitors?: string;
  monthlyTraffic?: string;
  estimatedLeads?: string;
  proposalLink?: string;
  caseStudyLink?: string;
  similarCompany?: string;
  caseStudyResult?: string;
  trialLink?: string;
  implementationCallLink?: string;
  personalNote?: string;

  // Email 5 specific
  caseStudyCompany?: string;

  // Email 6 specific
  checkBackLink?: string;
  unsubscribeLink?: string;
}

export interface DemoSequenceEmail {
  id: string;
  type: DemoSequenceEmailType;
  stepOrder: number;
  subjectLines: {
    variantA: string;
    variantB: string;
    variantC: string;
    recommended: 'A' | 'B' | 'C';
  };
  previewText: string;
  bodyHtml: string;
  bodyText: string;
  timing: {
    delayAmount: number;
    delayUnit: 'minutes' | 'hours' | 'days';
    description: string;
  };
  successMetrics: {
    openRateTarget: string;
    clickThroughTarget?: string;
    replyRateTarget?: string;
    conversionTarget?: string;
  };
}

export interface DemoSequenceConfig {
  id: string;
  name: string;
  description: string;
  emails: DemoSequenceEmail[];
  entryCriteria: {
    demoBooked: boolean;
  };
  exitConditions: {
    onReply: boolean;
    onTrialSignup: boolean;
    onMeetingBooked: boolean;
    onUnsubscribe: boolean;
  };
  totalDuration: string; // e.g., "7-8 days"
}

export interface DemoSequenceMetrics {
  sequenceId: string;
  workspaceId: string;

  // Overall metrics
  totalEnrolled: number;
  totalCompleted: number;
  totalExited: number;

  // Conversion metrics
  demoShowRate: number;
  replyRate: number;
  trialSignupRate: number;
  conversionRate: number;
  unsubscribeRate: number;

  // Email-level metrics
  emailMetrics: {
    [key in DemoSequenceEmailType]: {
      sent: number;
      opened: number;
      clicked: number;
      replied: number;
      openRate: number;
      clickRate: number;
      replyRate: number;
    };
  };

  // Revenue metrics
  pipelineGenerated: number;
  averageDealSize: number;
  timeToClose: number; // in days
  roi: number;
}

export interface DemoSequenceEnrollmentData {
  enrollmentId: string;
  sequenceId: string;
  leadId: string;
  workspaceId: string;
  demoDate: Date;
  demoTime: string;
  timezone: string;
  demoOwner: string;
  demoOwnerEmail: string;
  status: 'active' | 'completed' | 'exited';
  currentStep: number;
  exitReason?: string;
}
