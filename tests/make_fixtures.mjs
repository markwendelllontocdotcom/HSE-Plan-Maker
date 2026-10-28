// PQP Maker project file (as the Library saves it) and a Library link, made up for the import tests.
import { writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
const project = {
  id: 'p1', P01: 'Sample Library Tower', P02: 'DXB-777', P04: 'Dubai', P05: 'Plot 333-444, Sample Area', P07: 'All MEP Scope of Works',
  P08: ['HVAC', 'Electrical'], P13: 'B+G+12+R', R01: 'Library Client LLC', R02: 'Library Consultants', R03: 'Library Main Contractor LLC', R04: 'OXYPRO ELECTROMECHANICAL WORK LLC',
  R05: 'MEP Subcontractor', K01: { name: 'PM Sample', email: '', phone: '' }, K07: { name: 'PD Sample', email: '', phone: '' }, K06: [{ role: 'HSE Manager', name: 'HSE Sample', email: '', phone: '' }],
};
const file = { format: 'pqp-maker-project', version: 1, app: 'Oxypro Project Library', source: { library: 'P777' }, project };
writeFileSync('tests/fixtures/library-sample.pqp.json', JSON.stringify(file, null, 1));
const z = deflateRawSync(Buffer.from(JSON.stringify(file))).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
writeFileSync('tests/fixtures/library-link.txt', 'https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/#library=' + z);
console.log('ok', z.length);
