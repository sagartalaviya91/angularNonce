const fs = require('fs');
const path = require('path');

// Function to generate a unique variable name for validators
function generateVariableName(functionName, index) {
    return `var${functionName}${index}`;
}

// Function to process a file
function processFile(filePath, outputDirectory) {
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            return console.log(`Error reading file: ${filePath}`, err);
        }

        console.log(`Processing file: ${filePath}`);

        // Regex to match both standalone and looped addValidators calls
        const addValidatorRegex = /(\w+\.get\('.*?'\))\?\.\s*addValidators\((\w+)\((.*?)\s*,\s*"(.*?)"\)\);/g;
        let match;
        let replacements = data;
        let counter = 0;

        // Array to hold the new variable declarations
        let newDeclarations = '';

        // Find each `addValidators(func(arg, "message"))` call
        while ((match = addValidatorRegex.exec(data)) !== null) {
            const control = match[1];        // The control (e.g., service.get("cptCode"))
            const functionName = match[2];   // The function name (e.g., CPTCodeRejectP1946)
            const functionArgs = match[3];   // The first argument (e.g., batch.gatewayPayerId.toUpperCase())
            const errorMessage = match[4];   // The error message (e.g., "*CPT code cannot be SQE01 for AMR sites when Payer Id is P1946")

            // Generate a unique variable name
            const variableName = generateVariableName(functionName, counter);

            // Create the new variable declaration
            const variableDeclaration = `const ${variableName} = ${functionName}(${functionArgs}, "${errorMessage}");\n`;

            // Append the new declaration to the top
            newDeclarations += variableDeclaration;

            // Replace the original call with the variable
            const originalCall = `${control}?.addValidators(${functionName}(${functionArgs}, "${errorMessage}"));`;
            const replacementCall = `${control}?.addValidators(${variableName});`;
            replacements = replacements.replace(originalCall, replacementCall);

            counter++;
        }

        // Prepend the new declarations at the top of the file
        replacements = newDeclarations + replacements;

        // Create the new file in the output directory
        const outputFilePath = path.join(outputDirectory, path.basename(filePath));
        console.log(`Writing file to: ${outputFilePath}`);

        fs.writeFile(outputFilePath, replacements, 'utf8', function (err) {
            if (err) return console.log(`Error writing file: ${outputFilePath}`, err);
            console.log(`Processed file successfully: ${outputFilePath}`);
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
            } else {
                console.log(`Skipping non-TypeScript file: ${file}`);
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
