const fs = require('fs');
const path = require('path');

// Function to generate a unique variable name
function generateVariableName(functionName, errorMessage, index) {
    const sanitizedErrorMessage = errorMessage.replace(/[^a-zA-Z0-9]/g, '');
    return `${functionName.toLowerCase()}${sanitizedErrorMessage}Validator${index}`;
}

// Function to find and replace within a file dynamically and save to a new file
function processFile(filePath, outputDirectory) {
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }

        // Updated regex to match both `control.addValidator` and `control?.addValidator`
        const addValidatorRegex = /(\w+)\?.addValidator\((\w+)\(\[?([^)\]]+)\]?\s*,\s*"([^"]+)"\)\)/g;
        let match;
        let replacements = data;
        let counter = 0;

        // Track validator declarations for each function
        let declarations = {};
        let functionScopes = [];

        // Find each instance of addValidator with custom validators and messages
        while ((match = addValidatorRegex.exec(data)) !== null) {
            const control = match[1];
            const functionName = match[2];
            const validatorValues = match[3];
            const errorMessage = match[4];

            // Generate a unique variable name for the validator
            const variableName = generateVariableName(functionName, errorMessage, counter);

            // Find the function this validator is in
            const currentScope = functionScopes[functionScopes.length - 1] || 'global';

            if (!declarations[currentScope]) {
                declarations[currentScope] = new Set();
            }

            // If this validator+message combination is already declared in the current function, skip
            if (!declarations[currentScope].has(variableName)) {
                // Declare the variable at the start of the function
                const validatorDeclaration = `const ${variableName} = ${functionName}([${validatorValues}], "${errorMessage}");\n`;

                if (declarations[currentScope].size === 0) {
                    // Insert declaration at the start of the function (or global scope)
                    const functionStartIndex = replacements.indexOf('{', replacements.lastIndexOf(`function`));
                    replacements = [
                        replacements.slice(0, functionStartIndex + 1),
                        '\n' + validatorDeclaration,
                        replacements.slice(functionStartIndex + 1),
                    ].join('');
                } else {
                    // Insert subsequent declarations in the correct scope
                    replacements = validatorDeclaration + replacements;
                }

                declarations[currentScope].add(variableName);
            }

            // Replace the original validator call with the variable reference
            const originalCall = `${control}?.addValidator(${functionName}([${validatorValues}], "${errorMessage}"))`;
            const replacementCall = `${control}?.addValidator(${variableName})`;
            replacements = replacements.replace(originalCall, replacementCall);

            counter++;
        }

        // Create the new file in the output directory
        const outputFilePath = path.join(outputDirectory, path.basename(filePath));
        fs.writeFile(outputFilePath, replacements, 'utf8', function (err) {
            if (err) return console.log(err);
            console.log(`Processed file: ${outputFilePath}`);
        });
    });
}

// Function to process all TypeScript files in a directory and save them to a new directory
function processDirectory(directoryPath, outputDirectory) {
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        // Create the output directory if it doesn't exist
        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory);
        }

        // Iterate through each file in the directory
        files.forEach(function (file) {
            const filePath = path.join(directoryPath, file);

            // Check if it's a TypeScript file (.ts)
            if (filePath.endsWith('.ts')) {
                processFile(filePath, outputDirectory);
            }
        });
    });
}

// Path to the directory where your Angular project files are located
const directoryPath = '/path/to/your/angular/project';
// Path to the directory where the modified files will be saved
const outputDirectory = '/path/to/output/directory';

// Start processing the directory
processDirectory(directoryPath, outputDirectory);
