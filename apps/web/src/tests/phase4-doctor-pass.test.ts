import { describe, it, expect } from 'vitest';
import { encryptPassSnapshot, decryptPassSnapshot } from '../lib/cryptoPass';
import { ROUTE_CATALOG } from '../App';
import { en } from '../i18n';
import { extractPassTokenFromLocation } from '../screens/share/ShareAndClinicianScreens';
import { useCheckInStore } from '../lib/store';

describe('Phase 4 Doctor Pass Zero-Knowledge Encryption & Clinician View (P28, P29, P32)', () => {
  it('registers P28, P29, and P32 as WORKING + TESTED', () => {
    for (const code of ['P28', 'P29', 'P32']) {
      const found = ROUTE_CATALOG.find((r) => r.code === code);
      expect(found?.status).toBe('WORKING + TESTED');
    }
  });

  it('encrypts and decrypts Doctor Pass snapshot with AES-GCM and rejects wrong fragment key', async () => {
    const sample = {
      patientLabel: 'Layla',
      level: 'L1',
      firedRules: ['F1', 'F6'],
      note: 'Cycles 38-42 days',
    };
    const bundle = await encryptPassSnapshot(sample);
    expect(bundle.ciphertextB64).toBeTruthy();
    expect(bundle.keyFragment.length).toBeGreaterThan(20);

    const decoded = await decryptPassSnapshot<typeof sample>(
      bundle.ciphertextB64,
      bundle.ivB64,
      bundle.keyFragment
    );
    expect(decoded).toEqual(sample);

    // Tampered key must fail decryption
    const wrongKey = 'A' + bundle.keyFragment.slice(1);
    await expect(
      decryptPassSnapshot(bundle.ciphertextB64, bundle.ivB64, wrongKey)
    ).rejects.toThrow();
  });

  it('includes clinical boundary wording in en.json', () => {
    expect(en.app.notADiagnosis).toBe('Not a diagnosis');
    expect(en.app.decisionsStayWithClinician).toBe('Decisions stay with the clinician.');
    expect(en.clinicianView.unavailableTitle).toBe('This pass is no longer available.');
  });

  it('extracts pass token from both /p/:token share URLs and ?token= clinician URLs', () => {
    expect(extractPassTokenFromLocation('/p/awan-7f3a9c', '')).toBe('awan-7f3a9c');
    expect(extractPassTokenFromLocation('/clinician-view', '?token=awan-7f3a9c')).toBe('awan-7f3a9c');
    expect(extractPassTokenFromLocation('/clinician-view', '')).toBeNull();
  });

  it('marks an active pass as Revoked when revokePass is called', () => {
    const store = useCheckInStore.getState();
    const active = store.passes.find((p) => p.status === 'Active');
    expect(active).toBeDefined();
    if (active) {
      store.revokePass(active.id);
      const updated = useCheckInStore.getState().passes.find((p) => p.id === active.id);
      expect(updated?.status).toBe('Revoked');
    }
  });

  it('isolates Doctor Passes per account/persona and clears passes on resetAllData', () => {
    const store = useCheckInStore.getState();
    store.loadDemoPersona('ahmed');
    expect(useCheckInStore.getState().passes).toHaveLength(0);

    store.loadDemoPersona('layla');
    expect(useCheckInStore.getState().passes.length).toBeGreaterThan(0);

    store.resetAllData();
    expect(useCheckInStore.getState().passes).toHaveLength(0);
  });
});
