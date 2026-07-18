'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ACTIONS, calculateFontSizes } = require('../fontSize');

test('increases both font sizes by the configured relationship', () => {
  assert.deepEqual(calculateFontSizes(13, ACTIONS.increase), {
    chatFontSize: 13.5,
    codeBlockFontSize: 14.5
  });
});

test('decreases from the current value instead of command-local state', () => {
  assert.deepEqual(calculateFontSizes(13.5, ACTIONS.decrease), {
    chatFontSize: 13,
    codeBlockFontSize: 14
  });
});

test('clamps increases and decreases at hard limits', () => {
  assert.equal(calculateFontSizes(16, ACTIONS.increase).chatFontSize, 16);
  assert.equal(calculateFontSizes(12, ACTIONS.decrease).chatFontSize, 12);
});

test('resets chat and code block fonts to their defaults', () => {
  assert.deepEqual(calculateFontSizes(15.5, ACTIONS.reset), {
    chatFontSize: 13,
    codeBlockFontSize: 14
  });
});

test('supports customized limits, step, reset, and offset', () => {
  const options = {
    minimum: 10,
    maximum: 20,
    step: 1,
    resetValue: 14,
    codeBlockOffset: 2
  };

  assert.deepEqual(calculateFontSizes(14, ACTIONS.increase, options), {
    chatFontSize: 15,
    codeBlockFontSize: 17
  });
  assert.deepEqual(calculateFontSizes(19, ACTIONS.reset, options), {
    chatFontSize: 14,
    codeBlockFontSize: 16
  });
});

test('rejects unknown actions', () => {
  assert.throws(
    () => calculateFontSizes(13, 'sideways'),
    /Unknown font size action/
  );
});
