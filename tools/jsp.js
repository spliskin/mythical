#!/usr/bin/env -S node --abort-on-uncaught-exception --

const jspp = require('./jspp.js');
jspp(process.argv.slice(2));
