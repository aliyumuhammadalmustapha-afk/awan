import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  EvaluationOutput,
  LabResultInput,
  evaluateCheckIn,
} from '../engine/evaluator';

export type WhoForOption = 'female' | 'male' | 'topics' | 'something_else' | 'prefer_not';
export type StageOption = 'thinking_ahead' | 'preparing' | 'trying' | 'something_else' | 'prefer_not';
export type ReminderFrequency = '3m' | '6m' | 'manual' | 'off';
export type DemoPersonaId = 'layla' | 'ahmed' | 'priya' | 'tariq';

export interface ConsentSwitches {
  results: boolean;
  notes: boolean;
  recalled: boolean;
  doctorPass: boolean;
  anonymousCounts: boolean;
}

export interface SavedCheckInRecord {
  id: string;
  date: string;
  output: EvaluationOutput;
  answers: Record<string, any>;
  results: LabResultInput[];
  ownWordsNote: string;
  includeNoteInPass: boolean;
}

export interface DoctorPassEntry {
  id: string;
  token: string;
  keyFragment: string;
  createdAt: string;
  expiresAt: string;
  durationLabel: '24 hours' | '7 days' | '30 days';
  status: 'Active' | 'Expired' | 'Revoked';
  scopes: {
    answers: boolean;
    results: boolean;
    attachments: boolean;
    ownWordsNote: boolean;
  };
  accessLog: Array<{ timestamp: string; event: string }>;
}

export interface CheckInState {
  answers: Record<string, any>;
  lastAnswered: Record<string, number>;
  setAnswer: (id: string, value: any) => void;
  resetAnswers: () => void;

  // Onboarding & Profile state (P1 - P17)
  welcomePlayed: boolean;
  setWelcomePlayed: (played: boolean) => void;
  phoneCountry: string;
  phoneNumber: string;
  setPhone: (country: string, number: string) => void;
  nickname: string;
  setNickname: (name: string) => void;
  pinCode: string;
  setPinCode: (pin: string) => void;
  whoFor: WhoForOption | '';
  whoCustomText: string;
  setWhoFor: (who: WhoForOption, customText?: string) => void;
  topics: string[];
  toggleTopic: (topicId: string) => void;
  stage: StageOption | '';
  stageCustomText: string;
  setStage: (stage: StageOption, customText?: string) => void;
  birthMonth: number;
  birthYear: number;
  birthPreferNot: boolean;
  setBirth: (month: number, year: number, preferNot?: boolean) => void;
  saveCheckIns: boolean | null;
  setSaveCheckIns: (save: boolean | null) => void;
  consents: ConsentSwitches;
  consentDates: Record<string, string>;
  setConsent: (key: keyof ConsentSwitches, val: boolean) => void;
  discreetNotifications: boolean;
  setDiscreetNotifications: (val: boolean) => void;
  reminderFrequency: ReminderFrequency;
  setReminderFrequency: (freq: ReminderFrequency) => void;
  customReminderDate: string;
  setCustomReminderDate: (date: string) => void;
  preferredTime: string;
  setPreferredTime: (t: string) => void;
  autoLockTimer: 'immediate' | '1m' | '5m';
  setAutoLockTimer: (val: 'immediate' | '1m' | '5m') => void;
  lockOnBackground: boolean;
  setLockOnBackground: (val: boolean) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (done: boolean) => void;

  // Phase 2: Check-in, Lab Results, Own Words, History (P18 - P25)
  results: LabResultInput[];
  addResult: (result: LabResultInput) => void;
  removeResult: (id: string) => void;
  ownWordsNote: string;
  includeNoteInPass: boolean;
  setOwnWordsNote: (note: string) => void;
  setIncludeNoteInPass: (include: boolean) => void;
  checkInHistory: SavedCheckInRecord[];
  latestEvaluation: EvaluationOutput | null;
  finalizeCheckIn: () => EvaluationOutput;
  followUpReminderEnabled: boolean;
  setFollowUpReminderEnabled: (enabled: boolean) => void;

  // Phase 3 & 4: Doctor Passes & Demo Personas
  activeAccountKey: string;
  passesByAccount: Record<string, DoctorPassEntry[]>;
  passes: DoctorPassEntry[];
  revokeAllPasses: () => void;
  revokePass: (id: string) => void;
  addPass: (pass: DoctorPassEntry) => void;
  loadDemoPersona: (persona: DemoPersonaId) => void;

  // Lock screen state (P17)
  isLocked: boolean;
  setLocked: (locked: boolean) => void;
  failedPinAttempts: number;
  lockCooldownSeconds: number;
  recordFailedPin: () => void;
  clearFailedPin: () => void;
  resetAllData: () => void;
}

const ENCRYPTED_PASS_STORAGE_KEY = 'awan-encrypted-passes';

function markEncryptedPassesRevoked(tokens: string[]) {
  if (tokens.length === 0) return;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(ENCRYPTED_PASS_STORAGE_KEY);
      if (raw) {
        const map = JSON.parse(raw);
        let changed = false;
        for (const token of tokens) {
          if (map[token]) {
            map[token].revoked = true;
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(ENCRYPTED_PASS_STORAGE_KEY, JSON.stringify(map));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  if (typeof fetch === 'function') {
    fetch('/api/passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens }),
    }).catch(() => {
      // Ignore offline/local dev errors
    });
  }
}

const DEFAULT_CONSENTS: ConsentSwitches = {
  results: false,
  notes: false,
  recalled: false,
  doctorPass: false,
  anonymousCounts: false,
};

const INITIAL_PASSES: DoctorPassEntry[] = [
  {
    id: 'pass-demo-1',
    token: 'awan-7f3a9c',
    keyFragment: 'k9X2mP4vQ8nL1zR5',
    createdAt: '19 Nov 2026, 09:30',
    expiresAt: '26 Nov 2026, 09:30',
    durationLabel: '7 days',
    status: 'Active',
    scopes: {
      answers: true,
      results: true,
      attachments: false,
      ownWordsNote: true,
    },
    accessLog: [
      { timestamp: '19 Nov 2026, 09:30', event: 'Pass created on this phone' },
      { timestamp: '19 Nov 2026, 14:15', event: 'Viewed via clinician link' },
    ],
  },
  {
    id: 'pass-demo-2',
    token: 'awan-2b8e1d',
    keyFragment: 'm3T8pL0wX6vK9cQ2',
    createdAt: '01 Oct 2026, 11:00',
    expiresAt: '02 Oct 2026, 11:00',
    durationLabel: '24 hours',
    status: 'Expired',
    scopes: {
      answers: true,
      results: false,
      attachments: false,
      ownWordsNote: false,
    },
    accessLog: [
      { timestamp: '01 Oct 2026, 11:00', event: 'Pass created on this phone' },
    ],
  },
];

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set, get) => ({
      answers: {
        upcoming_fertility_affecting_treatment: 'no',
        cycles_outside_range_12m: 'three_or_more',
        periods_stopped_3m: 'no',
        disruptive_pain: 'no',
        diagnosed_conditions: ['pcos'],
        pelvic_history: 'no',
        cycle_compare_last_year: 'less_regular',
        family_history_fertility: 'no',
        habits_smoking_alcohol: 'no',
      },
      lastAnswered: {},
      setAnswer: (id, value) =>
        set((state) => ({
          answers: { ...state.answers, [id]: value },
          lastAnswered: { ...state.lastAnswered, [id]: Date.now() },
        })),
      resetAnswers: () => set({ answers: {}, lastAnswered: {} }),

      welcomePlayed: false,
      setWelcomePlayed: (played) => set({ welcomePlayed: played }),
      phoneCountry: '+234',
      phoneNumber: '801 234 5678',
      setPhone: (country, number) =>
        set({ phoneCountry: country, phoneNumber: number }),
      nickname: 'Layla',
      setNickname: (name) => set({ nickname: name }),
      pinCode: '1234',
      setPinCode: (pin) => set({ pinCode: pin }),
      whoFor: 'female',
      whoCustomText: '',
      setWhoFor: (who, customText = '') =>
        set({ whoFor: who, whoCustomText: customText }),
      topics: ['cycles', 'timing'],
      toggleTopic: (topicId) =>
        set((state) => ({
          topics: state.topics.includes(topicId)
            ? state.topics.filter((t) => t !== topicId)
            : [...state.topics, topicId],
        })),
      stage: 'preparing',
      stageCustomText: '',
      setStage: (stage, customText = '') =>
        set({ stage, stageCustomText: customText }),
      birthMonth: 5,
      birthYear: 1998,
      birthPreferNot: false,
      setBirth: (month, year, preferNot = false) =>
        set({ birthMonth: month, birthYear: year, birthPreferNot: preferNot }),
      saveCheckIns: null,
      setSaveCheckIns: (save) => set({ saveCheckIns: save }),
      consents: { ...DEFAULT_CONSENTS },
      consentDates: {
        results: '19 Nov 2026',
        notes: '19 Nov 2026',
        recalled: '19 Nov 2026',
        doctorPass: '19 Nov 2026',
        anonymousCounts: '19 Nov 2026',
      },
      setConsent: (key, val) =>
        set((state) => ({
          consents: { ...state.consents, [key]: val },
          consentDates: {
            ...state.consentDates,
            [key]: '19 Nov 2026',
          },
        })),
      discreetNotifications: true,
      setDiscreetNotifications: (val) => set({ discreetNotifications: val }),
      reminderFrequency: '3m',
      setReminderFrequency: (freq) => set({ reminderFrequency: freq }),
      customReminderDate: '2027-02-19',
      setCustomReminderDate: (date) => set({ customReminderDate: date }),
      preferredTime: '09:00',
      setPreferredTime: (t) => set({ preferredTime: t }),
      autoLockTimer: '1m',
      setAutoLockTimer: (val) => set({ autoLockTimer: val }),
      lockOnBackground: true,
      setLockOnBackground: (val) => set({ lockOnBackground: val }),
      onboardingComplete: false,
      setOnboardingComplete: (done) =>
        set((state) => {
          if (done && state.activeAccountKey === 'layla' && state.nickname.trim().toLowerCase() !== 'layla') {
            const customKey = `user:${state.nickname.trim().toLowerCase()}`;
            return {
              onboardingComplete: true,
              activeAccountKey: customKey,
              passes: state.passesByAccount[customKey] || [],
            };
          }
          return { onboardingComplete: done };
        }),

      results: [
        {
          id: 'res-seed-1',
          testType: 'AMH',
          value: 1.9,
          unit: 'ng/mL',
          refLow: 1.0,
          refHigh: 4.5,
          date: '2026-10-15',
          source: 'lab-reported',
          confirmed: true,
        },
      ],
      addResult: (result) =>
        set((state) => ({
          results: [...state.results.filter((r) => r.id !== result.id), result],
        })),
      removeResult: (id) =>
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
        })),
      ownWordsNote: 'Cycles have been 38 to 42 days over the past four months.',
      includeNoteInPass: true,
      setOwnWordsNote: (note) => set({ ownWordsNote: note }),
      setIncludeNoteInPass: (include) => set({ includeNoteInPass: include }),
      checkInHistory: [],
      latestEvaluation: null,
      finalizeCheckIn: () => {
        const st = get();
        const qSet =
          st.whoFor === 'male'
            ? 'male'
            : st.whoFor === 'female'
            ? 'female'
            : 'both';
        const pathway = st.stage || 'thinking_ahead';
        const output = evaluateCheckIn({
          profile: {
            questionSet: qSet,
            pathway,
            birthYear: st.birthPreferNot ? undefined : st.birthYear,
            birthMonth: st.birthPreferNot ? undefined : st.birthMonth,
          },
          answers: st.answers,
          results: st.results,
          ownWordsNote: st.ownWordsNote,
        });
        const record: SavedCheckInRecord = {
          id: `chk-${Date.now()}`,
          date: '19 Nov 2026',
          output,
          answers: { ...st.answers },
          results: [...st.results],
          ownWordsNote: st.ownWordsNote,
          includeNoteInPass: st.includeNoteInPass,
        };
        set((prev) => ({
          latestEvaluation: output,
          checkInHistory:
            prev.saveCheckIns === false
              ? prev.checkInHistory
              : [record, ...prev.checkInHistory],
        }));
        return output;
      },
      followUpReminderEnabled: true,
      setFollowUpReminderEnabled: (enabled) =>
        set({ followUpReminderEnabled: enabled }),

      activeAccountKey: 'layla',
      passesByAccount: {
        layla: INITIAL_PASSES,
        ahmed: [],
        priya: [],
        tariq: [],
        custom: [],
      },
      passes: INITIAL_PASSES,
      revokeAllPasses: () =>
        set((state) => {
          const revokedTokens = state.passes
            .filter((p) => p.status === 'Active')
            .map((p) => p.token);
          markEncryptedPassesRevoked(revokedTokens);
          const nextPasses = state.passes.map((p) =>
            p.status === 'Active'
              ? {
                  ...p,
                  status: 'Revoked' as const,
                  accessLog: [
                    ...p.accessLog,
                    { timestamp: '19 Nov 2026, 18:50', event: 'Revoked by user' },
                  ],
                }
              : p
          );
          return {
            passes: nextPasses,
            passesByAccount: {
              ...state.passesByAccount,
              [state.activeAccountKey]: nextPasses,
            },
          };
        }),
      revokePass: (id) =>
        set((state) => {
          const target = state.passes.find((p) => p.id === id);
          if (target) {
            markEncryptedPassesRevoked([target.token]);
          }
          const nextPasses = state.passes.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'Revoked' as const,
                  accessLog: [
                    ...p.accessLog,
                    { timestamp: '19 Nov 2026, 18:50', event: 'Revoked by user' },
                  ],
                }
              : p
          );
          return {
            passes: nextPasses,
            passesByAccount: {
              ...state.passesByAccount,
              [state.activeAccountKey]: nextPasses,
            },
          };
        }),
      addPass: (pass) =>
        set((state) => {
          const nextPasses = [pass, ...state.passes];
          return {
            passes: nextPasses,
            passesByAccount: {
              ...state.passesByAccount,
              [state.activeAccountKey]: nextPasses,
            },
          };
        }),

      loadDemoPersona: (persona) => {
        const personaPasses = get().passesByAccount[persona] || [];
        if (persona === 'layla') {
          const out = evaluateCheckIn({
            profile: { questionSet: 'female', pathway: 'thinking_ahead', ageYears: 28 },
            answers: {
              upcoming_fertility_affecting_treatment: 'no',
              cycles_outside_range_12m: 'three_or_more',
              cycle_compare_last_year: 'less_regular',
            },
          });
          set({
            activeAccountKey: 'layla',
            passes: personaPasses,
            nickname: 'Layla',
            whoFor: 'female',
            stage: 'thinking_ahead',
            birthYear: 1998,
            birthMonth: 5,
            saveCheckIns: true,
            checkInHistory: [],
            ownWordsNote: '',
            latestEvaluation: out,
          });
        } else if (persona === 'ahmed') {
          const out = evaluateCheckIn({
            profile: { questionSet: 'male', pathway: 'preparing', ageYears: 32 },
            answers: {
              upcoming_fertility_affecting_treatment: 'no',
              testicular_history: 'no',
              habits_smoking_alcohol: 'yes',
            },
          });
          set({
            activeAccountKey: 'ahmed',
            passes: personaPasses,
            nickname: 'Ahmed',
            whoFor: 'male',
            stage: 'preparing',
            birthYear: 1994,
            birthMonth: 3,
            saveCheckIns: true,
            results: [],
            checkInHistory: [],
            ownWordsNote: '',
            latestEvaluation: out,
          });
        } else if (persona === 'priya') {
          const out = evaluateCheckIn({
            profile: { questionSet: 'female', pathway: 'trying', ageYears: 35 },
            answers: {
              upcoming_fertility_affecting_treatment: 'no',
              trying_duration_months: 5,
              cycles_outside_range_12m: 'three_or_more',
              diagnosed_conditions: ['pcos'],
            },
          });
          set({
            activeAccountKey: 'priya',
            passes: personaPasses,
            nickname: 'Priya',
            whoFor: 'female',
            stage: 'trying',
            birthYear: 1991,
            birthMonth: 6,
            saveCheckIns: true,
            results: [],
            checkInHistory: [],
            ownWordsNote: '',
            latestEvaluation: out,
          });
        } else if (persona === 'tariq') {
          const out = evaluateCheckIn({
            profile: { questionSet: 'male', pathway: 'thinking_ahead', ageYears: 29 },
            answers: {
              upcoming_fertility_affecting_treatment: 'yes',
              testicular_history: 'no',
            },
          });
          set({
            activeAccountKey: 'tariq',
            passes: personaPasses,
            nickname: 'Tariq',
            whoFor: 'male',
            stage: 'thinking_ahead',
            birthYear: 1997,
            birthMonth: 8,
            saveCheckIns: true,
            results: [],
            checkInHistory: [],
            ownWordsNote: '',
            latestEvaluation: out,
          });
        }
      },

      isLocked: false,
      setLocked: (locked) => set({ isLocked: locked }),
      failedPinAttempts: 0,
      lockCooldownSeconds: 0,
      recordFailedPin: () =>
        set((state) => {
          const next = state.failedPinAttempts + 1;
          return {
            failedPinAttempts: next,
            lockCooldownSeconds: next >= 5 ? 30 : 0,
          };
        }),
      clearFailedPin: () =>
        set({ failedPinAttempts: 0, lockCooldownSeconds: 0, isLocked: false }),
      resetAllData: () =>
        set({
          answers: {},
          lastAnswered: {},
          phoneNumber: '',
          nickname: 'Layla',
          pinCode: '1234',
          whoFor: 'female',
          whoCustomText: '',
          topics: [],
          stage: 'thinking_ahead',
          stageCustomText: '',
          birthMonth: 5,
          birthYear: 1998,
          birthPreferNot: false,
          saveCheckIns: null,
          consents: { ...DEFAULT_CONSENTS },
          discreetNotifications: true,
          reminderFrequency: '3m',
          onboardingComplete: false,
          results: [],
          ownWordsNote: '',
          includeNoteInPass: false,
          checkInHistory: [],
          latestEvaluation: null,
          activeAccountKey: 'custom',
          passes: [],
          passesByAccount: {
            layla: INITIAL_PASSES,
            ahmed: [],
            priya: [],
            tariq: [],
            custom: [],
          },
          isLocked: false,
          failedPinAttempts: 0,
          lockCooldownSeconds: 0,
        }),
    }),
    {
      name: 'awan-checkin-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
