#!/usr/bin/env node

// script to detect js files uncommented by @Flow

const flowDetect = require('./flowDetect');

const main = async () => {
  await flowDetect();
};

main();
