import { execSync } from 'child_process';

console.log('======================================================================');
console.log('LIFE OS — FULL PRE-CANARY PRODUCTION AUDIT VERIFICATION');
console.log('======================================================================\n');

const testSuites = [
  { name: 'Phase 2B Forensic Audit', cmd: 'npx tsx scripts/forensic_verify_phase2b.ts' },
  { name: 'Phase 2B Database Integrity', cmd: 'npx tsx scripts/verify_phase2b.ts' },
  { name: 'Phase 7 Production Acceptance', cmd: 'npx tsx -e "import(\'./src/server/tests/phase7_production_acceptance\').then(m => m.runPhase7ProductionAcceptance())"' },
  { name: 'Phase 8 Launch & Observability', cmd: 'npx tsx -e "import(\'./src/server/tests/phase8_launch_observability\').then(m => m.runPhase8LaunchObservability())"' },
  { name: 'Post-Phase 8 Disaster Recovery Audit', cmd: 'npx tsx -e "import(\'./src/server/tests/post_phase8_launch_audit\').then(m => m.runPostPhase8Audit())"' },
  { name: 'Pre-Canary Zero-Trust Security & Hardening Audit', cmd: 'npx tsx src/server/tests/pre_canary_hardening_audit.ts' },
  { name: 'Final Zero-Trust Canary Gate Audit', cmd: 'npx tsx scripts/final_canary_gate_audit.ts' },
];

let totalPassed = 0;
const start = Date.now();

for (const suite of testSuites) {
  console.log(`\n>>> EXECUTING SUITE: ${suite.name}...`);
  try {
    const output = execSync(suite.cmd, { stdio: 'inherit', env: process.env });
    totalPassed++;
  } catch (err: any) {
    console.error(`\nFAILED SUITE: ${suite.name}`);
    process.exit(1);
  }
}

const duration = ((Date.now() - start) / 1000).toFixed(2);
console.log('\n======================================================================');
console.log(`ALL ${totalPassed}/${testSuites.length} AUDIT SUITES PASSED FLAWLESSLY IN ${duration}s!`);
console.log('======================================================================\n');
