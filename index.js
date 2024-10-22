const fs = require('fs');
const path = require('path');

// Regex for addValidators and imports
const regex = /addValidators\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
const importRegex = /^import.*;$/gm; // Matches all import statements
const exportRegex = /^(export\s+(function|class|const|let|var|interface)\s+)/gm; // Matches export declarations

function extractAndDeclareVariables(content) {
  const matches = content.matchAll(regex);

  const variables = [];
  let newContent = content;

  for (const match of matches) {
    const validatorArgs = match[1]; // Extract the entire argument passed into addValidators

    const variableName = `varAddValidator${variables.length}`; // Unique variable name for each call
    const variableDeclaration = `const ${variableName} = ${validatorArgs};`;

    // Replace the entire addValidators call with the variable reference
    newContent = newContent.replace(match[0], `addValidators(${variableName})`);

    variables.push({
      name: variableName,
      args: validatorArgs,
    });
  }

  // Prepare the variable declarations
  const variableDeclarations = variables.map(({ name, args }) => `const ${name} = ${args};`).join('\n');
  
  // Find the last import line
  const lastImportMatch = [...newContent.matchAll(importRegex)].pop();
  const lastImportIndex = lastImportMatch ? lastImportMatch.index + lastImportMatch[0].length : 0;
  
  // Find the first export statement
  const firstExportMatch = newContent.match(exportRegex);
  const exportIndex = firstExportMatch ? firstExportMatch.index : newContent.length;

  // Insert the variable declarations after the import statements and before the export statement
  const beforeExports = newContent.slice(0, exportIndex);
  const afterExports = newContent.slice(exportIndex);

  // Construct new content
  newContent = beforeExports.slice(0, lastImportIndex) + '\n' + beforeExports.slice(lastImportIndex) + '\n' + variableDeclarations + '\n' + afterExports;
  
  return newContent;
}

function processFiles(directory, outputDirectory) {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    files.forEach(file => {
      const filePath = path.join(directory, file);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}: ${err}`);
          return;
        }

        const newContent = extractAndDeclareVariables(data);
        const newFilePath = path.join(outputDirectory, file); // Preserve the same file name in the output directory
        fs.writeFile(newFilePath, newContent, 'utf8', err => {
          if (err) {
            console.error(`Error writing file ${newFilePath}: ${err}`);
          } else {
            console.log(`Processed file ${newFilePath}`);
          }
        });
      });
    });
  });
}

const directoryPath = './'; // Replace with your input directory path
const outputDirectoryPath = './output'; // Replace with your output directory path
processFiles(directoryPath, outputDirectoryPath);
