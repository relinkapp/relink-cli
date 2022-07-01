#!/usr/bin/env node

const { Command } = require('commander');
const { validate } = require('jsonschema');
const { readFileSync } = require('fs');
const { join } = require('path');
const { lookup } = require('mime-types');
const chalk = require('chalk');
const { exit } = require('process');

const error = chalk.bold.red;
const warning = chalk.yellow;

const meta = JSON.parse(readFileSync(join(__dirname, 'package.json')));
const schema = JSON.parse(readFileSync(join(__dirname, 'schema.json')));

const program = new Command();

program
  .name(meta.name)
  .description(meta.description)
  .version(meta.version);

program.command('bundle')
  .description('Bundle a valid Relink extension for users')
  .argument('<file>', 'JSON file that is a valid Relink extension')
  .action((file) => {
    let extension;

    try {
      if (lookup(file) !== 'application/json') {
        throw Error('File must be JSON');
      }

      let err = false;

      try {
        extension = readFileSync(file);
      } catch {
        err = true;
      }

      if (err) throw Error(`File does not exist at path ${file}`);

      try {
        extension = JSON.parse(extension);
      } catch {
        err = true;
      }

      if (err) throw Error('File is not valid JSON');
    } catch (e) {
      console.log(error(e));
      exit(1);
    }

    const validation = validate(extension, schema).errors;

    if (validation.length) {
      validation.forEach((e) => {
        console.log(warning(Error(e.stack)));
      });

      exit(1);
    }
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
