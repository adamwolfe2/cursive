// Autoresearch System Types
// Karpathy-style autonomous email optimization loop

// ---------------------------------------------------------------------------
// Program Config (stored as JSONB in autoresearch_programs.config)
// ---------------------------------------------------------------------------

export interface ProgramConfig {
  readonly targetNiche: string
  readonly targetPersona: string
  readonly maxVariantsPerExperiment: number
  readonly testDurationHours: number
  readonly minSampleSize: number
  readonly successMetric: 'positive_reply_rate' | 'reply_rate' | 'open_rate'
  readonly maxConcurrentExperiments: number
  readonly autoApplyWinner: boolean
  readonly elementRotation: ElementType[]
  readonly qualityConstraints: QualityConstraints
}

export interface QualityConstraints {
  readonly maxWordCount: number
  readonly minWordCount: number
  readonly maxSubjectLength: number
  readonly requirePersonalization: boolean
}

// ---------------------------------------------------------------------------
// Element types (what the experiment tests)
// ---------------------------------------------------------------------------

export type ElementType =
  | 'subject'
  | 'opening_line'
  | 'body'
  | 'cta'
  | 'angle'
  | 'full_template'
  | 'send_time'

// ---------------------------------------------------------------------------
// Program statuses
// ---------------------------------------------------------------------------

export type ProgramStatus = 'draft' | 'active' | 'paused' | 'completed'

export type ExperimentStatus =
  | 'generating'
  | 'active'
  | 'waiting'
  | 'evaluating'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type ResultStatus =
  | 'winner_found'
  | 'no_winner'
  | 'insufficient_data'
  | 'extended'
  | 'baseline_kept'

// ---------------------------------------------------------------------------
// Autoresearch Program
// ---------------------------------------------------------------------------

export interface AutoresearchProgram {
  readonly id: string
  readonly workspace_id: string
  readonly client_id: string | null
  readonly name: string
  readonly status: ProgramStatus
  readonly config: ProgramConfig
  readonly baseline_subject: string | null
  readonly baseline_body: string | null
  readonly baseline_positive_reply_rate: number
  readonly baseline_updated_at: string | null
  readonly emailbison_campaign_id: string | null
  readonly campaign_id: string | null
  readonly total_experiments_run: number
  readonly total_sends: number
  readonly total_wins: number
  readonly current_experiment_id: string | null
  readonly last_element_tested: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type AutoresearchProgramInsert = Omit<
  AutoresearchProgram,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'total_experiments_run'
  | 'total_sends'
  | 'total_wins'
  | 'current_experiment_id'
  | 'last_element_tested'
  | 'baseline_updated_at'
>

export type AutoresearchProgramUpdate = Partial<
  Pick<
    AutoresearchProgram,
    | 'name'
    | 'status'
    | 'config'
    | 'baseline_subject'
    | 'baseline_body'
    | 'baseline_positive_reply_rate'
    | 'baseline_updated_at'
    | 'emailbison_campaign_id'
    | 'campaign_id'
    | 'total_experiments_run'
    | 'total_sends'
    | 'total_wins'
    | 'current_experiment_id'
    | 'last_element_tested'
  >
>

// ---------------------------------------------------------------------------
// Autoresearch Experiment
// ---------------------------------------------------------------------------

export interface AutoresearchExperiment {
  readonly id: string
  readonly program_id: string
  readonly workspace_id: string
  readonly experiment_number: number
  readonly hypothesis: string
  readonly element_tested: ElementType
  readonly status: ExperimentStatus
  readonly ab_experiment_id: string | null
  readonly control_variant_id: string | null
  readonly challenger_variant_ids: string[]
  readonly started_at: string | null
  readonly evaluation_at: string | null
  readonly completed_at: string | null
  readonly winner_variant_id: string | null
  readonly result_status: ResultStatus | null
  readonly result_summary: Record<string, unknown>
  readonly lift_percent: number | null
  readonly confidence_level: number | null
  readonly generation_prompt: string | null
  readonly variant_copies: Record<string, unknown>
  readonly created_at: string
  readonly updated_at: string
}

export type AutoresearchExperimentInsert = Omit<
  AutoresearchExperiment,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'completed_at'
  | 'winner_variant_id'
  | 'result_status'
  | 'result_summary'
  | 'lift_percent'
  | 'confidence_level'
>

export type AutoresearchExperimentUpdate = Partial<
  Pick<
    AutoresearchExperiment,
    | 'status'
    | 'ab_experiment_id'
    | 'control_variant_id'
    | 'challenger_variant_ids'
    | 'started_at'
    | 'evaluation_at'
    | 'completed_at'
    | 'winner_variant_id'
    | 'result_status'
    | 'result_summary'
    | 'lift_percent'
    | 'confidence_level'
    | 'generation_prompt'
    | 'variant_copies'
  >
>

// ---------------------------------------------------------------------------
// Autoresearch Result (per-variant metrics)
// ---------------------------------------------------------------------------

export interface AutoresearchResult {
  readonly id: string
  readonly experiment_id: string
  readonly variant_id: string
  readonly workspace_id: string
  readonly emails_sent: number
  readonly emails_delivered: number
  readonly emails_bounced: number
  readonly emails_opened: number
  readonly unique_opens: number
  readonly emails_replied: number
  readonly positive_replies: number
  readonly neutral_replies: number
  readonly negative_replies: number
  readonly unsubscribe_replies: number
  readonly ooo_replies: number
  readonly positive_reply_rate: number
  readonly total_reply_rate: number
  readonly open_rate: number
  readonly bounce_rate: number
  readonly meetings_booked: number
  readonly snapshot_at: string
  readonly is_final: boolean
}

export type AutoresearchResultInsert = Omit<
  AutoresearchResult,
  'id' | 'snapshot_at'
>

export type AutoresearchResultUpdate = Partial<
  Omit<AutoresearchResult, 'id' | 'experiment_id' | 'variant_id' | 'workspace_id'>
>

// ---------------------------------------------------------------------------
// Winning Pattern (Memory Silo)
// ---------------------------------------------------------------------------

export interface WinningPattern {
  readonly id: string
  readonly workspace_id: string
  readonly program_id: string | null
  readonly experiment_id: string | null
  readonly niche: string | null
  readonly persona: string | null
  readonly element_type: ElementType
  readonly pattern_description: string
  readonly winning_copy: string
  readonly baseline_copy: string | null
  readonly lift_percent: number | null
  readonly positive_reply_rate: number | null
  readonly confidence_level: number | null
  readonly sample_size: number | null
  readonly replication_count: number
  readonly last_replicated_at: string | null
  readonly tags: string[]
  readonly is_cross_client: boolean
  readonly created_at: string
  readonly updated_at: string
}

export type WinningPatternInsert = Omit<
  WinningPattern,
  'id' | 'created_at' | 'updated_at' | 'replication_count' | 'last_replicated_at'
>

// ---------------------------------------------------------------------------
// Autoresearch Sentiment (simplified for experiment tracking)
// ---------------------------------------------------------------------------

export type AutoresearchSentiment =
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'unsubscribe'
  | 'out_of_office'

// ---------------------------------------------------------------------------
// Variant Generation Types
// ---------------------------------------------------------------------------

export interface GeneratedVariant {
  readonly name: string
  readonly subject: string
  readonly body: string
  readonly hypothesis: string
}

export interface ExperimentPlan {
  readonly elementToTest: ElementType
  readonly hypothesis: string
  readonly variants: GeneratedVariant[]
  readonly controlSubject: string
  readonly controlBody: string
}

// ---------------------------------------------------------------------------
// Experiment Evaluation Types
// ---------------------------------------------------------------------------

export interface ExperimentEvaluation {
  readonly experimentId: string
  readonly resultStatus: ResultStatus
  readonly winnerVariantId: string | null
  readonly liftPercent: number | null
  readonly confidenceLevel: number | null
  readonly variantResults: AutoresearchResult[]
  readonly recommendation: string
}

// ---------------------------------------------------------------------------
// Program with relations (for UI)
// ---------------------------------------------------------------------------

export interface AutoresearchProgramWithExperiments extends AutoresearchProgram {
  readonly experiments: AutoresearchExperiment[]
  readonly winning_patterns: WinningPattern[]
}
