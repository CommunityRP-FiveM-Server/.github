const fs = require("fs");
const path = require('path');
const replace = require('replace-in-file');

const version = process.env.TGT_RELEASE_VERSION;
const newVersion = version.replace("v", "");
const defaultFolderPath = process.env.GITHUB_WORKSPACE;
const targetFile = 'fxmanifest.lua';
const allResults = [];

const containsBrackets = (name) => {
  return name.includes('[') && name.includes(']');
};

const replaceInFiles = (folderPath) => {
  fs.readdir(folderPath, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error(err);
      return;
    }

    entries.forEach(entry => {
      const entryPath = path.join(folderPath, entry.name);
      
      if (entry.isDirectory() && containsBrackets(entry.name)) {
        replaceInFiles(entryPath);
      } else if (entry.isFile() && entry.name === targetFile) {
        const options = {
          files: entryPath,
          from: /\bversion\s+(.*)$/gm,
          to: `version '${newVersion}'`,
        };

        try {
          const results = replace.sync(options);
          results.forEach(result => {
            if (result.hasChanged) {
              allResults.push(result);
            }
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
  });
};

replaceInFiles(defaultFolderPath);

process.on('exit', () => {
  const changedFiles = allResults.map(result => result.file);
  console.log(changedFiles)
  console.log(defaultFolderPath)
  if (changedFiles.length > 0) {
    console.log(`echo "FXMANIFEST_FILE_CHANGES=${JSON.stringify(changedFiles)}" >> $GITHUB_ENV`);
  } else {
    console.log('No changes!');
  }
});
