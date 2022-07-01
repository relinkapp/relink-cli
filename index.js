#!/usr/bin/env node

const { Command } = require('commander');
const { readFileSync } = require('fs');
const { join } = require('path');

const meta = JSON.parse(readFileSync(join(__dirname, 'package.json')));
const program = new Command();

program
  .name(meta.name)
  .description(meta.description)
  .version(meta.version);

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
