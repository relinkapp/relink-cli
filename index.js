#!/usr/bin/env node

const { Command } = require('commander');
const { validate } = require('jsonschema');
const { deflateSync, inflateSync } = require('zlib');
const { readFileSync, writeFileSync } = require('fs');
const { join, extname } = require('path');
const { lookup } = require('mime-types');
const chalk = require('chalk');
const { exit } = require('process');

const error = chalk.bold.red;
const warning = chalk.yellow;
const success = chalk.green;

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
  .argument('<output>', 'Output file name')
  .action((file, output) => {
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

    const fields = extension.fields.map((field) => field.name);

    if (fields.length !== (new Set(fields)).size) {
      console.log(error(Error('Field names must be unique')));
      exit(1);
    }

    const buffer = deflateSync(JSON.stringify(extension));
    writeFileSync(`${output}.rex`, buffer);
    console.log(success(`Successfully created and wrote extension to ${output}.rex`));
  });

program.command('verify')
  .description('Verify a Relink extension file')
  .argument('<file>', 'A Relink extension file')
  .action((file) => {
    let extension;

    try {
      if (extname(file) !== '.rex') {
        throw Error('File must be a Relink extension file');
      }

      let err = false;

      try {
        extension = readFileSync(file);
      } catch {
        err = true;
      }

      if (err) throw Error(`File does not exist at path ${file}`);

      try {
        extension = inflateSync(extension);
      } catch {
        err = true;
      }

      if (err) throw Error('File could not be inflated');

      try {
        extension = JSON.parse(extension);
      } catch {
        err = true;
      }

      if (err) throw Error('Inflated file is not valid JSON');
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

    const fields = extension.fields.map((field) => field.name);

    if (fields.length !== (new Set(fields)).size) {
      console.log(error(Error('Field names must be unique')));
      exit(1);
    }

    console.log(success('File is a valid Relink extension'));
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
