import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Use Vite's existing compiler to test the actual TypeScript modules without a new runner.
const root = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({
  stdin: {
    contents: "export { api, resetDemoData } from './src/services/api'; export { visitSession, clearLegacyBrowserData } from './src/services/visitSession'; export { offlineStorage } from './src/services/offlineStorage';",
    loader: 'ts', resolveDir: root,
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const loadVisit = suffix => import(`${moduleUrl}#${suffix}`);
const patient = { email: 'ramakrishna.demo@carenest.ai', password: 'DemoPassword123!' };

await test('fresh visits require login and isolate demo changes', async t => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls++;
    return new Response(JSON.stringify({ detail: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const { api, visitSession, resetDemoData, offlineStorage } = await loadVisit('first');
    await t.test('no private request can run before sign-in', async () => {
      assert.equal(visitSession.token, null);
      await assert.rejects(api.medicines.list(), /sign in/i);
      await assert.rejects(api.prescriptions.confirm([]), /sign in/i);
      assert.equal(fetchCalls, 0);
    });
    await t.test('incorrect credentials never silently become a demo login', async () => {
      await assert.rejects(api.auth.login({ ...patient, password: 'wrong-password' }), /incorrect/i);
      await assert.rejects(api.auth.login({ email: 'unknown@example.invalid', password: 'wrong-password' }), /Invalid credentials/);
      assert.equal(visitSession.token, null);
      assert.equal(fetchCalls, 1);
    });
    await t.test('explicit sample sign-in and dose writes stay off the server', async () => {
      visitSession.start(await api.auth.login(patient));
      assert.equal(visitSession.isDemo, true);
      const slots = await api.schedules.getToday();
      assert.equal(slots.length, 4);
      const slot = slots[0];
      await api.events.recordSnooze(slot.medicine_id, slot.scheduled_time);
      await api.events.recordTaken(slot.medicine_id, slot.scheduled_time);
      await api.events.recordTaken(slot.medicine_id, slot.scheduled_time);
      assert.equal((await api.events.getHistory()).length, 2);
      assert.equal((await api.events.getHistory('taken')).length, 1);
      assert.equal((await api.events.getHistory('snoozed')).length, 1);
      assert.equal((await api.schedules.getToday()).find(item => item.medicine_id === slot.medicine_id && item.scheduled_time === slot.scheduled_time).status, 'taken');
      assert.equal((await api.caregiver.listPatients())[0].today_adherence_percent, 25);
      const alert = await api.sos.trigger('Sample-only test');
      assert.equal(alert.external_notified, false);
      assert.match(alert.notice, /not configured/i);
      assert.equal((await api.sos.getEvents()).length, 1);
      assert.equal(fetchCalls, 1);
    });
    await t.test('demo medicine edits work within the visit and reset to the seed', async () => {
      const created = await api.medicines.create({ name: 'Visit-only sample', scheduled_times: '08:00' });
      await api.medicines.update(created.id, { name: 'Edited sample' });
      assert.equal((await api.medicines.list('Edited sample')).length, 1);
      assert.equal((await api.medicines.list()).length, 4);
      await api.medicines.delete(created.id);
      const replacement = await api.medicines.create({ name: 'Replacement sample', scheduled_times: '09:00' });
      assert.notEqual(replacement.id, created.id);
      resetDemoData();
      assert.equal((await api.medicines.list()).length, 3);
      assert.equal((await api.events.getHistory()).length, 0);
      assert.equal((await api.sos.getEvents()).length, 0);
      assert.equal((await api.caregiver.listPatients())[0].today_adherence_percent, 0);
    });
    await t.test('visit-only offline cache preserves simultaneous doses and clears', async () => {
      const slots = await api.schedules.getToday();
      await offlineStorage.cacheTodaySchedule(slots);
      assert.equal((await offlineStorage.getCachedTodaySchedule()).length, 4);
      await offlineStorage.updateLocalSlotStatus(slots[0].medicine_id, slots[0].scheduled_time, 'taken');
      assert.equal((await offlineStorage.getCachedTodaySchedule()).filter(slot => slot.status === 'taken').length, 1);
      await offlineStorage.enqueueAction('event', 'sample', 'create', { status: 'taken' });
      assert.equal((await offlineStorage.getPendingQueue()).length, 1);
      await offlineStorage.clearAll();
      assert.deepEqual(await offlineStorage.getCachedTodaySchedule(), []);
      assert.deepEqual(await offlineStorage.getPendingQueue(), []);
    });
    await t.test('a new document has no auth, preferences, edits or history from the previous one', async () => {
      await api.auth.updateMe({ preferred_language: 'te', text_size: 'xlarge' });
      await api.medicines.create({ name: 'Not carried over', scheduled_times: '09:00' });
      const fresh = await loadVisit('second');
      assert.equal(fresh.visitSession.token, null);
      await assert.rejects(fresh.api.schedules.getToday(), /sign in/i);
      const auth = await fresh.api.auth.login(patient);
      assert.equal(auth.user.preferred_language, 'en');
      assert.equal(auth.user.text_size, 'large');
      fresh.visitSession.start(auth);
      assert.equal((await fresh.api.medicines.list()).length, 3);
      assert.equal((await fresh.api.events.getHistory()).length, 0);
      assert.deepEqual(await fresh.offlineStorage.getCachedTodaySchedule(), []);
      fresh.visitSession.end();
      await assert.rejects(fresh.api.events.getHistory(), /sign in/i);
    });
  } finally { globalThis.fetch = originalFetch; }
});

await test('legacy cleanup only removes CareNest browser keys', async () => {
  const { clearLegacyBrowserData } = await loadVisit('cleanup');
  const makeStorage = () => {
    const values = new Map([['carenest_token', 'old-sample-token'], ['carenest_mock_meds', 'old-sample-data'], ['unrelated-preference', 'keep']]);
    return { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null, removeItem: key => values.delete(key), values };
  };
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  let deletedDatabase = null;
  globalThis.window = { localStorage, sessionStorage, indexedDB: { deleteDatabase: name => { deletedDatabase = name; } } };
  try {
    clearLegacyBrowserData();
    assert.deepEqual([...localStorage.values], [['unrelated-preference', 'keep']]);
    assert.deepEqual([...sessionStorage.values], [['unrelated-preference', 'keep']]);
    assert.equal(deletedDatabase, 'carenest_local_db');
  } finally { delete globalThis.window; }
});
