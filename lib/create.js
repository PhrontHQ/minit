/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

const { logger, setLoggerLevel } = require("./logger");
const { MinitError } = require("./error");
const path = require("path");
const fs = require("fs");

/**
 * Main create function that generates files from templates
 * @param {string} templateName - Name of the template to use
 * @param {object} config - Configuration object containing settings
 * @param {object} templateModule - Optional template module to use instead of loading from files
 * @returns {Promise} Promise that resolves with the config object
 */
const create = (module.exports = function (templateName, config, templateModule) {
    // Set up logger level
    setLoggerLevel(config.level);

    // Store template name in config for later use
    config.templateName = templateName;

    // Load template module if not provided
    if (!templateModule) {
        templateModule = require("../templates/" + config.templateName);
    }

    const Template = templateModule.Template;

    // Use template's default destination if none specified
    if (!config.destination) {
        config.destination = Template.destination;
    }

    // Set up paths differently if this is a child template
    if (!config.parent) {
        config.minitHome = path.join(__dirname, "..");
        config.templatesDir = path.join(config.minitHome, "templates");
    } else {
        config.minitHome = config.parent.minitHome;
        config.templatesDir = path.join(config.minitHome, "templates");
    }

    // Create and process template
    const aTemplate = Template.newWithDirectory(path.join(config.templatesDir, templateName));

    return aTemplate.process(config).then(() => {
        // Construct the final output path for the generated file
        config.resultPath = path.join(
            config.packageHome || "",
            config.destination || "",
            config.name + "." + config.extensionName
        );

        return config;
    });
});

exports.create = create;

/**
 * Adds template-specific commands to the CLI program
 * @param {object} program - The commander program instance
 * @returns {object} The modified program with added commands
 */
exports.addCommandsTo = create.addCommandsTo = function (program) {
    const templatesDir = path.join(program.minitHome, "templates");
    // Get list of all templates in templates directory
    const fileNames = fs.readdirSync(templatesDir);

    // For each template directory, create a corresponding CLI command
    fileNames.forEach((filename) => {
        var stats = fs.statSync(path.join(templatesDir, filename));

        if (stats.isDirectory()) {
            const templateModule = require("../templates/" + filename);

            // Create a command like 'create:templatename'
            const command = program
                .command("create:" + filename)
                .description(templateModule.Template.commandDescription)
                .action((_env) => {
                    exports
                        .create(filename, command, templateModule)
                        .fail((error) => {
                            // Handle MinitErrors differently than other errors
                            if (error instanceof MinitError) {
                                console.error(error.message);
                            } else {
                                throw error;
                            }
                        })
                        .done();
                });

            // Add template-specific options
            templateModule.Template.addOptions(command);
        }
    });

    return program;
};
