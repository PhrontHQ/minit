const { TemplateBase } = require("../lib/template-base.js");
const { progressBar } = require("../lib/progress-bar");
const { logger } = require("../lib/logger");
const process = require("process");
const util = require("util");
const path = require("path");
const fs = require("fs");

const exec = util.promisify(require("child_process").exec);

exports.Template = Object.create(TemplateBase, {
    commandDescription: {
        value: "package"
    },

    addOptions: {
        value: function (command) {
            command = TemplateBase.addOptions.call(this, command);
            command.option("-n, --name <name>", "package name");
            command.option("-c, --copyright [path]", "copyright file");
            return command;
        }
    },

    didSetOptions: {
        value: function (options) {
            if (options.copyright) {
                options.copyright = this.validateCopyright(options.copyright);
            }
        }
    },

    validateCopyright: {
        value: function (path) {
            return fs.readFileSync(path, "utf-8");
        }
    },

    finish: {
        value: function (destination) {
            const { name: packageName } = this.options;

            return TemplateBase.finish
                .call(this)
                .then(() => {
                    const packageLocation = path.join(destination, packageName);
                    return this.installDependencies(packageLocation);
                })
                .then(() => {
                    if (this.options.verbose) {
                        logger.info("Dependencies Installed");
                        logger.info(`${this.options.name} created and installed with production dependencies`);
                    } else {
                        progressBar.tick({ step: "Done" });
                        console.log("#");
                        console.log(`# ${this.options.name} created and installed with production dependencies, run`);
                        console.log("# > npm install .");
                        console.log("# to set up the testing dependencies");
                        console.log("#");
                    }
                });
        }
    },

    installDependencies: {
        value: async function (packageLocation) {
            if (this.options.verbose) {
                logger.info("Installing Dependencies...");
            } else {
                progressBar.tick({ step: "Installing Dependencies" });
            }

            const execOptions = { cwd: packageLocation };

            return exec(`npm install --production  --loglevel=warn`, execOptions);
        }
    },

    defaultPackageHome: {
        value: function () {
            return process.cwd();
        }
    }
});
