export type AdviceLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'U';

export type QuestionSet = 'female' | 'male' | 'both' | 'unspecified';
export type StageType = 'thinking_ahead' | 'preparing' | 'trying' | 'something_else' | 'prefer_not';

export interface ProfileInput {
  questionSet: QuestionSet;
  pathway: StageType;
  ageYears?: number;
  birthYear?: number;
  birthMonth?: number; // 1-12
}

export interface LabResultInput {
  id: string;
  testType: 'AMH' | 'FSH' | 'semen_concentration' | 'semen_motility' | string;
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  date: string; // ISO date
  source: 'self-reported' | 'lab-reported' | 'recalled' | 'lab-uploaded-unverified';
  confirmed?: boolean;
}

export interface CheckInInput {
  asOfDate?: string; // ISO date, defaults to today
  profile: ProfileInput;
  answers: Record<string, any>;
  answerTimestamps?: Record<string, string>; // ISO date when each answer was recorded (for D6 6m expiry)
  results?: LabResultInput[];
  ownWordsNote?: string;
  completedVisit?: boolean;
}

export interface DataGap {
  id: string;
  kind: 'needed' | 'would-sharpen' | 'good-context';
  reason: string;
  howToFill: string;
}

export interface EvaluationOutput {
  level: AdviceLevel;
  headline: string;
  reason: string;
  firedRules: string[];
  whatCanChange: string[];
  whatCantChange: string[];
  gaps: DataGap[];
  confidence: 'Fairly confident' | 'Some gaps' | 'Limited information';
  primaryAction: {
    id: string;
    label: string;
  };
  secondaryActions: Array<{ id: string; label: string }>;
  recheckInDays: number;
  followUpDueDays: number | null;
  cautiousAgeUsed: boolean;
}

const LEVEL_RANK: Record<AdviceLevel, number> = {
  L0: 0,
  U: 1,
  L1: 2,
  L2: 3,
  L3: 4,
};

export function computeEffectiveAge(
  profile: ProfileInput,
  asOfIso: string
): { ageYears: number | null; cautiousAgeUsed: boolean } {
  if (typeof profile.ageYears === 'number') {
    return { ageYears: profile.ageYears, cautiousAgeUsed: false };
  }
  if (!profile.birthYear || !profile.birthMonth) {
    return { ageYears: null, cautiousAgeUsed: false };
  }
  const ref = new Date(asOfIso);
  const totalMonths =
    (ref.getUTCFullYear() - profile.birthYear) * 12 +
    (ref.getUTCMonth() + 1 - profile.birthMonth);
  const exactYears = totalMonths / 12;

  // Within 1 month of 35 (419 months) or 40 (479 months), use cautious band
  if (totalMonths === 419) {
    return { ageYears: 35, cautiousAgeUsed: true };
  }
  if (totalMonths === 479) {
    return { ageYears: 40, cautiousAgeUsed: true };
  }
  return { ageYears: Math.floor(exactYears), cautiousAgeUsed: false };
}

function monthsBetween(dateIso: string, asOfIso: string): number {
  const d1 = new Date(dateIso);
  const d2 = new Date(asOfIso);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  return (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12 + (d2.getUTCMonth() - d1.getUTCMonth());
}

export function isPlausibleLabValue(testType: string, value: number): boolean {
  if (Number.isNaN(value) || value < 0) return false;
  switch (testType) {
    case 'AMH':
      return value <= 40;
    case 'FSH':
      return value <= 200;
    case 'semen_concentration':
      return value <= 500;
    case 'semen_motility':
      return value >= 0 && value <= 100;
    default:
      return value <= 10000;
  }
}

export function evaluateCheckIn(input: CheckInInput): EvaluationOutput {
  const asOfIso = input.asOfDate || new Date().toISOString().slice(0, 10);
  const { ageYears, cautiousAgeUsed } = computeEffectiveAge(input.profile, asOfIso);

  // D6: Expire carried-forward answers older than 6 months
  const activeAnswers: Record<string, any> = {};
  const expiredAnswerKeys: string[] = [];
  for (const [k, v] of Object.entries(input.answers || {})) {
    if (v === undefined || v === null || v === 'skipped' || v === '') continue;
    const recordedAt = input.answerTimestamps?.[k];
    if (recordedAt && monthsBetween(recordedAt, asOfIso) > 6) {
      expiredAnswerKeys.push(k);
      continue;
    }
    activeAnswers[k] = v;
  }

  // X4: Explicitly never read relationship_status, partner_status, or orientation
  delete activeAnswers['relationship_status'];
  delete activeAnswers['partner_status'];
  delete activeAnswers['orientation'];

  const fired: Array<{ id: string; level: AdviceLevel; reason: string; fixedFactor?: string; modifiableFactor?: string }> = [];
  const whatCanChange: string[] = [];
  const whatCantChange: string[] = [];
  const gaps: DataGap[] = [];

  const pathway =
    input.profile.pathway === 'something_else' && activeAnswers['currently_trying'] === 'yes'
      ? 'trying'
      : input.profile.pathway;
  const isTrying = pathway === 'trying';
  const isPreparingOrTrying = pathway === 'preparing' || pathway === 'trying';

  const tryingMonths =
    typeof activeAnswers['trying_duration_months'] === 'number'
      ? activeAnswers['trying_duration_months']
      : undefined;

  // X1: Planned or recent medical treatment that may affect fertility -> L3
  if (activeAnswers['upcoming_fertility_affecting_treatment'] === 'yes') {
    fired.push({
      id: 'X1',
      level: 'L3',
      reason: 'A planned or recent medical treatment may affect fertility, so speaking with your care team promptly keeps preservation options open.',
      fixedFactor: 'Planned or recent treatment that can affect reproductive potential.',
    });
  }

  // Timing rules T1 - T5
  if (isTrying) {
    if (ageYears !== null && ageYears >= 40) {
      fired.push({
        id: 'T3',
        level: 'L2',
        reason: 'At age 40 or over while trying to conceive, guidelines suggest earlier clinical advice without waiting.',
        fixedFactor: 'Age 40 or over plays a direct role in timing guidance.',
      });
    } else if (ageYears !== null && ageYears >= 35 && ageYears <= 39) {
      if (typeof tryingMonths === 'number' && tryingMonths >= 6) {
        fired.push({
          id: 'T2',
          level: 'L2',
          reason: `At age ${ageYears} and trying for ${tryingMonths} months, guidelines suggest an evaluation after 6 months.`,
          fixedFactor: 'Age 35 to 39 shifts the suggested check-in window to 6 months of trying.',
        });
      } else if (typeof tryingMonths === 'number' && tryingMonths >= 4 && tryingMonths < 6) {
        fired.push({
          id: 'T5',
          level: 'L1',
          reason: 'You are approaching the 6-month mark of trying at age 35 or over, when a routine conversation is helpful.',
          modifiableFactor: 'Planning a visit before reaching the 6-month mark can save waiting time.',
        });
      }
    } else if (ageYears !== null && ageYears < 35) {
      if (typeof tryingMonths === 'number' && tryingMonths >= 12) {
        fired.push({
          id: 'T1',
          level: 'L2',
          reason: `Trying for ${tryingMonths} months meets the 12-month guideline for speaking with a clinician.`,
          modifiableFactor: 'Booking an assessment now helps both partners get clear answers.',
        });
      } else if (typeof tryingMonths === 'number' && tryingMonths >= 10 && tryingMonths < 12) {
        fired.push({
          id: 'T5',
          level: 'L1',
          reason: 'You are approaching 12 months of trying, when a routine assessment is usually suggested.',
          modifiableFactor: 'Preparing questions for a routine visit now can reduce delay.',
        });
      }
    }
  } else if (pathway === 'preparing' && ageYears !== null && ageYears >= 35) {
    fired.push({
      id: 'T4',
      level: 'L1',
      reason: 'When preparing for a family at age 35 or over, an early conversation can help tailor your timeline.',
      fixedFactor: 'Age 35 or over is a non-modifiable factor that shapes timing.',
    });
  }

  const includeFemale =
    input.profile.questionSet === 'female' || input.profile.questionSet === 'both';
  const includeMale =
    input.profile.questionSet === 'male' || input.profile.questionSet === 'both';

  // Female rules F1 - F6
  if (includeFemale) {
    if (activeAnswers['periods_stopped_3m'] === 'yes') {
      fired.push({
        id: 'F2',
        level: 'L2',
        reason: 'Periods stopping for 3 months or more is worth discussing with a clinician soon.',
        modifiableFactor: 'Identifying why cycles paused can often open straightforward care options.',
      });
    }
    if (
      activeAnswers['cycles_outside_range_12m'] === 'three_or_more' ||
      activeAnswers['cycles_outside_range_12m'] === 'irregular'
    ) {
      fired.push({
        id: 'F1',
        level: 'L1',
        reason: 'Having three or more cycles outside the typical 21 to 35 day range is worth mentioning at a routine visit.',
        modifiableFactor: 'Tracking cycle lengths over the next few months gives your clinician clearer context.',
      });
    }
    if (activeAnswers['disruptive_Global_pain'] === 'yes' || activeAnswers['disruptive_pain'] === 'yes') {
      fired.push({
        id: 'F3',
        level: 'L1',
        reason: 'Pelvic or period pain that disrupts daily life deserves a calm conversation with a clinician.',
        modifiableFactor: 'Describing when pain happens and how it affects your day helps guide evaluation.',
      });
    }
    const hasFemaleCondition =
      Array.isArray(activeAnswers['diagnosed_conditions'])
        ? activeAnswers['diagnosed_conditions'].some((c: string) =>
            ['pcos', 'endometriosis', 'thyroid'].includes(c.toLowerCase())
          )
        : ['pcos', 'endometriosis', 'thyroid', 'yes'].includes(
            String(activeAnswers['diagnosed_conditions'] || '').toLowerCase()
          );
    if (hasFemaleCondition && isPreparingOrTrying) {
      const f4Level: AdviceLevel =
        isTrying && typeof tryingMonths === 'number' && tryingMonths >= 6 ? 'L2' : 'L1';
      fired.push({
        id: 'F4',
        level: f4Level,
        reason:
          f4Level === 'L2'
            ? 'With a known condition such as PCOS, endometriosis or thyroid history and 6 or more months of trying, speaking to a clinician soon is recommended.'
            : 'Because you have a known condition and are planning or trying, an earlier routine conversation can be helpful.',
        fixedFactor: 'Existing reproductive or endocrine history shapes when earlier advice is useful.',
      });
    }
    if (activeAnswers['pelvic_history'] === 'yes') {
      fired.push({
        id: 'F5',
        level: 'L1',
        reason: 'Past pelvic surgery or infection is useful context to review with a clinician.',
        fixedFactor: 'Past pelvic surgery or infection history cannot be changed, but early awareness helps.',
      });
    }
    if (activeAnswers['cycle_compare_last_year'] === 'less_regular') {
      fired.push({
        id: 'F6',
        level: 'L1',
        reason: 'Noticing that your cycles feel less regular than a year ago is a helpful signal to discuss.',
        modifiableFactor: 'Sharing recent cycle changes helps a clinician decide if simple checks are worthwhile.',
      });
    }
  }

  // Male rules M1 - M5
  if (includeMale) {
    if (activeAnswers['testicular_history'] === 'yes' && isPreparingOrTrying) {
      const m1Level: AdviceLevel =
        isTrying && typeof tryingMonths === 'number' && tryingMonths >= 6 ? 'L2' : 'L1';
      fired.push({
        id: 'M1',
        level: m1Level,
        reason:
          m1Level === 'L2'
            ? 'With a past testicular history and 6 or more months of trying, an earlier check with a clinician is recommended.'
            : 'Past testicular history is worth reviewing with a clinician as you prepare or try.',
        fixedFactor: 'Past testicular history is non-modifiable context worth sharing early.',
      });
    }
    if (activeAnswers['sexual_function_difficulty'] === 'yes') {
      fired.push({
        id: 'M2',
        level: 'L1',
        reason: 'Ongoing sexual function difficulty is a practical reason for a routine, private conversation with a clinician.',
        modifiableFactor: 'Many factors affecting sexual function can be addressed once discussed.',
      });
    }
    if (
      isTrying &&
      typeof tryingMonths === 'number' &&
      ((ageYears !== null && ageYears >= 35 && tryingMonths >= 6) || tryingMonths >= 12)
    ) {
      fired.push({
        id: 'M4',
        level: 'L2',
        reason: 'Because fertility involves both partners, a male evaluation is recommended alongside any partner check at this timing mark.',
        modifiableFactor: 'Checking male factors early avoids one-sided delays.',
      });
    }
    if (activeAnswers['testosterone_use'] === 'yes') {
      fired.push({
        id: 'M5',
        level: 'L1',
        reason: 'External testosterone or similar products can affect sperm production. Don\'t stop prescribed medication without your prescriber.',
        modifiableFactor: 'Speak with your prescriber before changing any testosterone or hormone product.',
      });
    }
  }

  // X2: Smoking or heavy alcohol NEVER changes the level, only adds educational action
  if (
    activeAnswers['habits_smoking_alcohol'] === 'yes' ||
    (Array.isArray(activeAnswers['habits_smoking_alcohol']) &&
      activeAnswers['habits_smoking_alcohol'].some((h: string) => h !== 'none'))
  ) {
    whatCanChange.push(
      'Cutting back on tobacco, vaping or heavy alcohol supports overall reproductive health (rule X2).'
    );
  }

  // X3: Family history while preparing or trying -> L1
  if (activeAnswers['family_history_fertility'] === 'yes' && isPreparingOrTrying) {
    fired.push({
      id: 'X3',
      level: 'L1',
      reason: 'A close family history of early menopause or fertility difficulty is worth mentioning at a routine visit.',
      fixedFactor: 'Family history is a background factor that cannot be changed.',
    });
  }

  // Lab results & Data quality D3, D4, M3
  for (const res of input.results || []) {
    if (!isPlausibleLabValue(res.testType, res.value) && !res.confirmed) {
      gaps.push({
        id: `unconfirmed_${res.id}`,
        kind: 'would-sharpen',
        reason: `Your ${res.testType} entry looked unusual and was excluded until confirmed.`,
        howToFill: 'Review and confirm the lab value',
      });
      continue;
    }
    const ageInMonths = res.date ? monthsBetween(res.date, asOfIso) : 0;
    if (ageInMonths > 6) {
      // D3: Result older than 6 months becomes partial gap, never lowers a level
      gaps.push({
        id: `old_result_${res.id}`,
        kind: 'would-sharpen',
        reason: `Your ${res.testType} result is more than 6 months old, so a newer test could sharpen the picture.`,
        howToFill: 'Add a newer lab result if available',
      });
    }
    const isBelowRange = typeof res.refLow === 'number' && res.value < res.refLow;
    const isAboveRange = typeof res.refHigh === 'number' && res.value > res.refHigh;
    if (isBelowRange || isAboveRange) {
      if (
        includeMale &&
        (res.testType === 'semen_concentration' || res.testType === 'semen_motility') &&
        isBelowRange
      ) {
        fired.push({
          id: 'M3',
          level: 'L1',
          reason: `A semen result below the lab's own reference range is worth reviewing with a clinician.`,
          modifiableFactor: 'Semen measurements naturally vary over time and can be re-checked with a clinician.',
        });
      }
      fired.push({
        id: 'D4',
        level: 'L1',
        reason: `Your ${res.testType} value is outside the lab's stated reference range and is worth discussing with a clinician.`,
        modifiableFactor: 'Bringing the full lab report and reference range to a visit adds helpful context.',
      });
    }
  }

  // Key question check for D1
  const missingKeys: DataGap[] = [];
  if (ageYears === null && isPreparingOrTrying) {
    missingKeys.push({
      id: 'missing_age',
      kind: 'needed',
      reason: 'Age helps apply the right timing guideline.',
      howToFill: 'Add your birth month and year',
    });
  }
  if (isTrying && typeof tryingMonths !== 'number') {
    missingKeys.push({
      id: 'missing_trying_months',
      kind: 'needed',
      reason: 'Knowing how many months you have been trying is needed for timing guidance.',
      howToFill: 'Answer how long you have been trying',
    });
  }
  if (includeFemale && !activeAnswers['cycles_outside_range_12m']) {
    missingKeys.push({
      id: 'missing_cycle_pattern',
      kind: 'needed',
      reason: 'Your recent cycle pattern is a key detail for understanding direction.',
      howToFill: 'Answer the cycle pattern question',
    });
  }
  if (includeMale && !activeAnswers['testicular_history']) {
    missingKeys.push({
      id: 'missing_testicular_history',
      kind: 'needed',
      reason: 'Relevant testicular health history is a key detail for the male check-in.',
      howToFill: 'Answer the testicular history question',
    });
  }
  if (!activeAnswers['upcoming_fertility_affecting_treatment']) {
    missingKeys.push({
      id: 'missing_treatment_check',
      kind: 'needed',
      reason: 'Knowing whether you have an upcoming medical treatment that could affect fertility is essential.',
      howToFill: 'Answer the medical treatment question',
    });
  }

  // D5 & D6: Skipped non-key answers and expired carried-forward answers become gaps
  if (includeFemale && !activeAnswers['disruptive_pain'] && !activeAnswers['disruptive_Global_pain']) {
    gaps.push({
      id: 'gap_pain',
      kind: 'would-sharpen',
      reason: 'Sharing whether period or pelvic pain disrupts your day would sharpen this picture.',
      howToFill: 'Answer the pain question',
    });
  }
  if (!activeAnswers['family_history_fertility']) {
    gaps.push({
      id: 'gap_family_history',
      kind: 'good-context',
      reason: 'Adding family history gives helpful background context.',
      howToFill: 'Answer the family history question',
    });
  }
  if (expiredAnswerKeys.length > 0) {
    gaps.unshift({
      id: 'gap_expired_answers',
      kind: 'would-sharpen',
      reason: 'Some answers carried forward from more than 6 months ago expired and were not counted.',
      howToFill: 'Refresh your earlier answers',
    });
  }

  // Combine gaps: needed first, max 3 shown on Result Card
  const allGaps = [...missingKeys, ...gaps].slice(0, 3);

  // D2 & D1 assembly: take highest level; if nothing fired and a key is missing -> U; else L0
  let finalLevel: AdviceLevel = 'L0';
  const firedRuleIds: string[] = [];

  if (fired.length > 0) {
    for (const item of fired) {
      if (!firedRuleIds.includes(item.id)) {
        firedRuleIds.push(item.id);
      }
      if (LEVEL_RANK[item.level] > LEVEL_RANK[finalLevel]) {
        finalLevel = item.level;
      }
      if (item.modifiableFactor && !whatCanChange.includes(item.modifiableFactor)) {
        whatCanChange.push(item.modifiableFactor);
      }
      if (item.fixedFactor && !whatCantChange.includes(item.fixedFactor)) {
        whatCantChange.push(item.fixedFactor);
      }
    }
  } else if (missingKeys.length > 0) {
    finalLevel = 'U';
    firedRuleIds.push('D1');
  } else {
    finalLevel = 'L0';
  }

  // Ensure default plain-language cards are populated calmly
  if (whatCanChange.length === 0) {
    whatCanChange.push('Keeping notes on any changes in your health or timeline helps you notice shifts early.');
  }
  if (whatCantChange.length === 0) {
    whatCantChange.push(
      ageYears !== null
        ? `Your current age (${ageYears}) and past medical history set the baseline context.`
        : 'Your age and past medical history set the baseline context.'
    );
  }

  // Pick primary reason from the highest severity fired rule
  const highestFired = fired.find((f) => f.level === finalLevel);
  const reason =
    highestFired?.reason ||
    (finalLevel === 'U'
      ? 'One or more key questions were skipped, so we hold off on giving a direction until you add what is missing.'
      : 'Based on what you shared today, nothing indicates an urgent concern.');

  const headlineMap: Record<AdviceLevel, string> = {
    L0: 'Things look steady right now.',
    L1: 'A few details are worth discussing at a routine visit.',
    L2: 'Timing or symptoms suggest speaking with a clinician soon.',
    L3: "Speak with your care team before treatment begins.",
    U: 'We need a few key details before giving a clear direction.',
  };

  const primaryActionMap: Record<AdviceLevel, { id: string; label: string }> = {
    L0: { id: 'set-recheck', label: 'Set my re-check' },
    L1: { id: 'plan-routine-visit', label: 'Plan a routine visit' },
    L2: { id: 'book-visit-soon', label: 'Book a visit soon' },
    L3: { id: 'contact-care-team', label: 'Contact your care team' },
    U: { id: 'add-missing', label: "Add what's missing" },
  };

  const recheckDaysMap: Record<AdviceLevel, number> = {
    L0: 180,
    U: 14,
    L1: 90,
    L2: 28,
    L3: 14,
  };

  const followUpDaysMap: Record<AdviceLevel, number | null> = {
    L0: null,
    U: null,
    L1: 21,
    L2: 7,
    L3: 2,
  };

  const confidence: EvaluationOutput['confidence'] =
    missingKeys.length > 0
      ? 'Limited information'
      : allGaps.length > 0
      ? 'Some gaps'
      : 'Fairly confident';

  return {
    level: finalLevel,
    headline: headlineMap[finalLevel],
    reason,
    firedRules: firedRuleIds,
    whatCanChange,
    whatCantChange,
    gaps: allGaps,
    confidence,
    primaryAction: primaryActionMap[finalLevel],
    secondaryActions: [
      { id: 'add-result', label: 'Add a result' },
      { id: 'share-doctor', label: 'Share with a doctor' },
    ],
    recheckInDays: recheckDaysMap[finalLevel],
    followUpDueDays: followUpDaysMap[finalLevel],
    cautiousAgeUsed,
  };
}
