const Store = require('electron-store');
const electron = require('electron');
const os = require('os');
const { join, dirname } = require('path');
const { pathExists } = require('fs-extra');

const { app } = electron;


const defaults = {
  captureFormat: 'jpeg',
  customOutDir: undefined,
  keyframeCut: true,
  autoMerge: false,
  autoDeleteMergedSegments: true,
  timecodeFormat: 'timecodeWithDecimalFraction',
  invertCutSegments: false,
  autoExportExtraStreams: true,
  exportConfirmEnabled: true,
  askBeforeClose: false,
  enableAskForImportChapters: true,
  enableAskForFileOpenAction: true,
  playbackVolume: 1,
  autoSaveProjectFile: true,
  wheelSensitivity: 0.2,
  language: undefined,
  ffmpegExperimental: false,
  preserveMovData: false,
  movFastStart: true,
  avoidNegativeTs: 'make_zero',
  hideNotifications: undefined,
  autoLoadTimecode: false,
  segmentsToChapters: false,
  preserveMetadataOnMerge: false,
  simpleMode: true,
  outSegTemplate: undefined,
  keyboardSeekAccFactor: 1.03,
  keyboardNormalSeekSpeed: 1,
  enableTransferTimestamps: true,
  outFormatLocked: undefined,
  safeOutputFileName: true,
  windowBounds: undefined,
  enableAutoHtml5ify: true,
};

// For portable app: https://github.com/mifi/lossless-cut/issues/645
async function getCustomStoragePath() {
  try {
    const isWindows = os.platform() === 'win32';
    if (!isWindows || process.windowsStore) return undefined;

    // https://github.com/mifi/lossless-cut/issues/645#issuecomment-1001363314
    // https://stackoverflow.com/questions/46307797/how-to-get-the-original-path-of-a-portable-electron-app
    // https://github.com/electron-userland/electron-builder/blob/master/docs/configuration/nsis.md
    const customStorageDir = process.env.PORTABLE_EXECUTABLE_DIR || dirname(app.getPath('exe'));
    const customConfigPath = join(customStorageDir, 'config.json');
    if (await pathExists(customConfigPath)) return customStorageDir;
    return undefined;
  } catch (err) {
    console.error('Failed to get custom storage path', err);
    return undefined;
  }
}

let store;

async function init() {
  const customStoragePath = await getCustomStoragePath();
  if (customStoragePath) console.log('customStoragePath', customStoragePath);

  for (let i = 0; i < 5; i += 1) {
    try {
      store = new Store({ defaults, cwd: customStoragePath });
      return;
    } catch (err) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 2000));
      console.error('Failed to create config store, retrying', err);
    }
  }

  throw new Error('Timed out while creating config store');
}

function get(key) {
  return store.get(key);
}

function set(key, val) {
  if (val === undefined) store.delete(key);
  else store.set(key, val);
}

function reset(key) {
  set(key, defaults[key]);
}

module.exports = {
  init,
  get,
  set,
  reset,
};
