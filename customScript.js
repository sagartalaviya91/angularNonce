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
        const addValidatorRegex = /(\w+)\??\.addValidator\((\w+)\("([^"]+)"\)\)/g;
        let match;
        let declarations = '';
        let replacements = data;
        let counter = 0;
        let alreadyDeclared = new Set(); // To track already declared variables

        // Find each instance of addValidator with custom validators and messages
        while ((match = addValidatorRegex.exec(data)) !== null) {
            const control = match[1];
            const functionName = match[2];
            const errorMessage = match[3];

            // Generate a unique variable name
            const variableName = generateVariableName(functionName, errorMessage, counter);

            // If this validator+message combination is already declared, don't declare again
            if (!alreadyDeclared.has(variableName)) {
                declarations += `const ${variableName} = ${functionName}("${errorMessage}");\n`;
                alreadyDeclared.add(variableName);
                counter++;
            }

            // Replace the function call with the generated variable
            const originalCall = `${control}?.addValidator(${functionName}("${errorMessage}"))`;
            const replacementCall = `${control}?.addValidator(${variableName})`;

            // Replace in the content
            replacements = replacements.replace(originalCall, replacementCall);
        }

        // Prepend the variable declarations to the top of the file
        if (declarations) {
            replacements = declarations + '\n' + replacements;
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
const directoryPath = './';
// Path to the directory where the modified files will be saved
const outputDirectory = './output';

// Start processing the directory
processDirectory(directoryPath, outputDirectory);
