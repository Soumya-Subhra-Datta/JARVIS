const { exec } = require('child_process');
const path = require('path');

const LOCAL_ENABLED = process.env.ENABLE_LOCAL_AUTOMATION === 'true';
const IS_LOCAL = process.env.NODE_ENV !== 'production' || process.env.HOST === 'localhost';

const appCommands = {
  vscode: { win: 'code', mac: 'open -a "Visual Studio Code"', linux: 'code' },
  terminal: { win: 'cmd', mac: 'open -a Terminal', linux: 'x-terminal-emulator' },
  browser: { win: 'start chrome', mac: 'open -a "Google Chrome"', linux: 'google-chrome' },
  chrome: { win: 'start chrome', mac: 'open -a "Google Chrome"', linux: 'google-chrome' },
  firefox: { win: 'start firefox', mac: 'open -a Firefox', linux: 'firefox' },
  explorer: { win: 'explorer', mac: 'open .', linux: 'xdg-open .' },
  notepad: { win: 'notepad', mac: 'open -a TextEdit', linux: 'gedit' },
  calculator: { win: 'calc', mac: 'open -a Calculator', linux: 'gnome-calculator' },
  spotify: { win: 'start spotify', mac: 'open -a Spotify', linux: 'spotify' },
  slack: { win: 'start slack', mac: 'open -a Slack', linux: 'slack' }
};

const getOS = () => {
  const platform = process.platform;
  if (platform === 'win32') return 'win';
  if (platform === 'darwin') return 'mac';
  return 'linux';
};

const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    const child = exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        reject(new Error(`Command failed: ${error.message}`));
      } else {
        resolve(stdout || stderr || 'Command executed successfully');
      }
    });
    child.on('error', reject);
  });
};

const openApplication = async (appName) => {
  if (!LOCAL_ENABLED) {
    return {
      success: false,
      message: 'Local automation is disabled. Set ENABLE_LOCAL_AUTOMATION=true to enable.'
    };
  }

  const os = getOS();
  const appKey = appName.toLowerCase().replace(/\s+/g, '');

  const commandMap = appCommands[appKey];
  if (!commandMap) {
    return {
      success: false,
      message: `Unknown application: ${appName}. Try: vscode, terminal, chrome, browser, notepad, calculator, explorer, spotify, slack, firefox`
    };
  }

  const cmd = commandMap[os];
  if (!cmd) {
    return {
      success: false,
      message: `Opening ${appName} is not supported on this operating system.`
    };
  }

  try {
    await executeCommand(cmd);
    return { success: true, message: `Opened ${appName}.` };
  } catch (err) {
    return { success: false, message: `Failed to open ${appName}: ${err.message}` };
  }
};

const openFile = async (filePath) => {
  if (!LOCAL_ENABLED) {
    return {
      success: false,
      message: 'Local automation is disabled. Set ENABLE_LOCAL_AUTOMATION=true to enable.'
    };
  }

  const os = getOS();
  const resolved = path.resolve(filePath.replace(/^['"]|['"]$/g, ''));

  let cmd;
  if (os === 'win') cmd = `start "" "${resolved}"`;
  else if (os === 'mac') cmd = `open "${resolved}"`;
  else cmd = `xdg-open "${resolved}"`;

  try {
    await executeCommand(cmd);
    return { success: true, message: `Opened file: ${resolved}` };
  } catch (err) {
    return { success: false, message: `Failed to open file: ${err.message}` };
  }
};

const openFolder = async (folderPath) => {
  if (!LOCAL_ENABLED) {
    return {
      success: false,
      message: 'Local automation is disabled. Set ENABLE_LOCAL_AUTOMATION=true to enable.'
    };
  }

  return openFile(folderPath);
};

const executeSystemCommand = async (command) => {
  if (!LOCAL_ENABLED) {
    return {
      success: false,
      message: 'Local automation is disabled. Set ENABLE_LOCAL_AUTOMATION=true to enable.'
    };
  }

  const safeCommands = ['echo', 'dir', 'ls', 'pwd', 'whoami', 'date', 'time', 'systeminfo', 'ipconfig', 'ifconfig', 'netstat', 'tasklist', 'ps'];

  const cmdName = command.trim().split(/\s+/)[0].toLowerCase();
  if (!safeCommands.includes(cmdName)) {
    return {
      success: false,
      message: `Command '${cmdName}' is not allowed for security reasons.`
    };
  }

  try {
    const output = await executeCommand(command);
    return { success: true, output };
  } catch (err) {
    return { success: false, message: `Command failed: ${err.message}` };
  }
};

module.exports = { openApplication, openFile, openFolder, executeSystemCommand, LOCAL_ENABLED };
