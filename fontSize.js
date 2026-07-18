'use strict';

const ACTIONS = Object.freeze({
  increase: 'increase',
  decrease: 'decrease',
  reset: 'reset'
});

function calculateFontSizes(currentValue, action, options = {}) {
  const minimum = toFiniteNumber(options.minimum, 12);
  const maximum = toFiniteNumber(options.maximum, 16);
  const lowerBound = Math.min(minimum, maximum);
  const upperBound = Math.max(minimum, maximum);
  const step = Math.max(toFiniteNumber(options.step, 0.5), Number.EPSILON);
  const resetValue = toFiniteNumber(options.resetValue, 13);
  const codeBlockOffset = toFiniteNumber(options.codeBlockOffset, 1);
  const current = clamp(toFiniteNumber(currentValue, resetValue), lowerBound, upperBound);

  let chatFontSize;
  switch (action) {
    case ACTIONS.increase:
      chatFontSize = clamp(current + step, lowerBound, upperBound);
      break;
    case ACTIONS.decrease:
      chatFontSize = clamp(current - step, lowerBound, upperBound);
      break;
    case ACTIONS.reset:
      chatFontSize = clamp(resetValue, lowerBound, upperBound);
      break;
    default:
      throw new Error(`Unknown font size action: ${action}`);
  }

  chatFontSize = round(chatFontSize);
  return {
    chatFontSize,
    codeBlockFontSize: round(chatFontSize + codeBlockOffset)
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

module.exports = {
  ACTIONS,
  calculateFontSizes
};
