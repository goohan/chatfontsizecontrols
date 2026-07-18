'use strict';

const vscode = require('vscode');
const { ACTIONS, calculateFontSizes } = require('./fontSize');

const COMMANDS = Object.freeze({
  increase: 'chatfontsizecontrols.increase',
  decrease: 'chatfontsizecontrols.decrease',
  reset: 'chatfontsizecontrols.reset'
});

function activate(context) {
  let updateQueue = Promise.resolve();

  const enqueue = (action) => {
    updateQueue = updateQueue
      .catch(() => undefined)
      .then(() => applyFontSize(action))
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Unable to change chat font size: ${message}`);
      });

    return updateQueue;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.increase, () => enqueue(ACTIONS.increase)),
    vscode.commands.registerCommand(COMMANDS.decrease, () => enqueue(ACTIONS.decrease)),
    vscode.commands.registerCommand(COMMANDS.reset, () => enqueue(ACTIONS.reset))
  );
}

async function applyFontSize(action) {
  const controls = vscode.workspace.getConfiguration('chatFontSizeControls');
  const chat = vscode.workspace.getConfiguration('chat');
  const resetValue = controls.get('resetValue', 13);
  const sizes = calculateFontSizes(chat.get('fontSize', resetValue), action, {
    minimum: controls.get('minimum', 12),
    maximum: controls.get('maximum', 16),
    step: controls.get('step', 0.5),
    resetValue,
    codeBlockOffset: controls.get('codeBlockOffset', 1)
  });

  await chat.update('fontSize', sizes.chatFontSize, vscode.ConfigurationTarget.Global);
  await chat.update('editor.fontSize', sizes.codeBlockFontSize, vscode.ConfigurationTarget.Global);

  vscode.window.setStatusBarMessage(
    `Chat font: ${sizes.chatFontSize} | Code blocks: ${sizes.codeBlockFontSize}`,
    1500
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
