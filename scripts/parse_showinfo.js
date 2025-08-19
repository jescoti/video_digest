import fs from 'fs';
const log = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const times = [];
for (const line of log) {
  const m = line.match(/pts_time:([0-9.]+)/);
  if (m) times.push(parseFloat(m[1]));
}
process.stdout.write(JSON.stringify(times));
