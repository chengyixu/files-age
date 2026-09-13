#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const HELP = `files-age — show file ages in human-readable format

Usage:
  files-age [options] [paths...]

Options:
  -s, --sort        Sort by age (newest first)
  -r, --reverse     Sort by age (oldest first)
  -d, --dir <dir>   List files in a directory (non-recursive)
  -j, --json        Output as JSON
  -h, --help        Show this help

Examples:
  files-age                  Show ages for all files in current directory
  files-age *.log            Show ages for matching files
  files-age -s -d /var/log   Show log files sorted newest first
  files-age -j *.txt         JSON output for scripting
`;

function parseArgs(argv) {
  const opts = { sort: false, reverse: false, dir: null, json: false, paths: [] };
  const args = argv.slice(2);
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '-h' || a === '--help') {
      opts.help = true;
    } else if (a === '-s' || a === '--sort') {
      opts.sort = true;
    } else if (a === '-r' || a === '--reverse') {
      opts.reverse = true;
    } else if (a === '-j' || a === '--json') {
      opts.json = true;
    } else if (a === '-d' || a === '--dir') {
      opts.dir = args[++i];
    } else if (a.startsWith('-')) {
      // pass
    } else {
      opts.paths.push(a);
    }
    i++;
  }
  return opts;
}

function humanAge(ms) {
  const abs = Math.abs(ms);
  const sec = abs / 1000;
  if (sec < 5) return 'just now';
  if (sec < 60) return Math.floor(sec) + 's ago';
  const min = sec / 60;
  if (min < 60) {
    const m = Math.floor(min);
    return m + (m === 1 ? ' min ago' : ' mins ago');
  }
  const hrs = min / 60;
  if (hrs < 24) {
    const h = Math.floor(hrs);
    return h + (h === 1 ? ' hour ago' : ' hours ago');
  }
  const days = hrs / 24;
  if (days < 30) {
    const d = Math.floor(days);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }
  const months = days / 30;
  if (months < 12) {
    const m = Math.floor(months);
    return m + (m === 1 ? ' month ago' : ' months ago');
  }
  const years = months / 12;
  const y = Math.floor(years);
  return y + (y === 1 ? ' year ago' : ' years ago');
}

function fmtDate(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  let files = [];

  if (opts.dir) {
    try {
      const entries = fs.readdirSync(opts.dir, { withFileTypes: true });
      files = entries
        .filter((e) => e.isFile())
        .map((e) => path.join(opts.dir, e.name));
    } catch (err) {
      process.stderr.write('files-age: ' + err.message + '\n');
      process.exit(1);
    }
  }

  if (opts.paths.length > 0) {
    for (const p of opts.paths) {
      try {
        const st = fs.statSync(p);
        if (st.isFile()) {
          files.push(p);
        } else if (st.isDirectory()) {
          const entries = fs.readdirSync(p, { withFileTypes: true });
          for (const e of entries) {
            if (e.isFile()) {
              files.push(path.join(p, e.name));
            }
          }
        }
      } catch {
        // skip files that don't exist (e.g., glob with no results falls through as literal)
      }
    }
  }

  // Default: current directory if nothing specified
  if (files.length === 0 && !opts.dir && opts.paths.length === 0) {
    try {
      const entries = fs.readdirSync('.', { withFileTypes: true });
      files = entries
        .filter((e) => e.isFile())
        .map((e) => e.name);
    } catch (err) {
      process.stderr.write('files-age: ' + err.message + '\n');
      process.exit(1);
    }
  }

  if (files.length === 0) {
    process.exit(0);
  }

  // Gather stats
  const now = Date.now();
  const results = [];
  for (const f of files) {
    const st = fs.statSync(f);
    results.push({
      file: f,
      mtime: st.mtimeMs,
      age: now - st.mtimeMs,
      birthtime: st.birthtimeMs,
      size: st.size,
    });
  }

  // Sort
  if (opts.sort || opts.reverse) {
    results.sort((a, b) => {
      const diff = opts.reverse ? b.age - a.age : a.age - b.age;
      return diff;
    });
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify(results.map((r) => ({
      file: r.file,
      age: humanAge(r.age),
      mtime: new Date(r.mtime).toISOString(),
      size: r.size,
    })), null, 2) + '\n');
    process.exit(0);
  }

  // Table output
  // Determine padding
  let nameWidth = 4; // 'File'
  for (const r of results) {
    if (r.file.length > nameWidth) nameWidth = r.file.length;
  }
  nameWidth = Math.min(nameWidth, 60);

  const header = 'File'.padEnd(nameWidth) + '  Age             Last Modified';
  process.stdout.write(header + '\n');
  process.stdout.write('─'.repeat(header.length) + '\n');

  for (const r of results) {
    const name = r.file.length > 60 ? '...' + r.file.slice(-57) : r.file;
    process.stdout.write(
      name.padEnd(nameWidth) + '  ' +
      humanAge(r.age).padEnd(16) +
      fmtDate(r.mtime) + '\n'
    );
  }

  process.stdout.write('\n' + results.length + ' file' + (results.length !== 1 ? 's' : '') + '\n');
}

main();
