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

const { progressBar } = require("./progress-bar");
const Path = require("path");
const FS = require("fs");
const Q = require("q");
const qfs = require("q-io/fs");
const os = require("os");
const process = require('process');
const { logger } = require("./logger");
const Mustache = require("mustache");

// We're interpolating inside Javascript and CSS, and so do not want the
// default HTML escaping
Mustache.escape = function (string) {
    return string;
};

var MinitError = require("./error").MinitError;

var FILENAME_VARIABLE_START = "__";
var FILENAME_VARIABLE_END = "__";

exports.TemplateBase = Object.create(Object.prototype, {

    addOptions: {
        value: function (command) {
            command.option("-v, --verbose", "Enable verbose logging");
            command.option("-l, --level [level]", "Log level (default: info)", "info");
            command.option('-p, --package-home [path]',"absolute path to the package's home directory", this.validatePackageHome, this.defaultPackageHome());
            command.option('-d, --destination [path]', this.destinationOptionDescription, Path.join);
            return command;
        }
    },

    destinationOptionDescription: {
        value: 'where the template will be expanded relative to the package-home'
    },

    newWithDirectory: {
        value: function(directory) {
            const newTemplate = Object.create(this);
            newTemplate.directory = directory;

            return newTemplate;
        }
    },

    validatePackageHome: {
        value: function (value) {
            return String(value);
        }
    },

    defaultPackageHome: {
        value: function () {
            let packageHome = process.cwd();
            let root = qfs.root();

            if (root === "") {
                root = "/";
            }

            while (true) {
                if (FS.existsSync(Path.join(packageHome, "package.json"))) {
                    break;
                }
                packageHome = Path.resolve(Path.join(packageHome, ".."));
                if (packageHome === root) {
                    packageHome = process.cwd();
                    break;
                }
            }
            return packageHome;
        }
    },

    directory: {
        value: null,
        writable: true
    },

    buildDir: {
        value: null,
        writable: true
    },

    // The output destination relative to the package root
    destination: {
        value: null
    },

    process: {
        value: function(options) {
            this.options = options;

            if (typeof this.didSetOptions === "function") {
                this.didSetOptions(options);
            }
         
            const mainBuildDir = Path.join(os.tmpdir(), "build");
            this.buildDir = Path.join(mainBuildDir, this.options.templateName);
            const self = this;

            if (this.options.verbose) {
                logger.info(`Template Processing: [${this.options.templateName}]`);
                logger.info(`Source directory: ${this.directory}`);
                logger.info(`Destination directory: ${this.finalDestination}`);
                logger.info(`Build directory: ${this.buildDir}`);
                logger.info('Processing template');
            } else {
                progressBar.render({ step: `Building Template` });
            }
            
            return qfs.exists(mainBuildDir).then(function(exists) {
                let promise;

                if (exists) {
                    if (self.options.verbose) {
                        logger.debug(`Build directory already exists. Removing it.`);
                    }

                    promise = qfs.removeTree(mainBuildDir).then(function() {
                        if (self.options.verbose) {
                            logger.debug('Build directory removed');
                            logger.debug(`Creating build directory: ${mainBuildDir}`);
                        }

                        return qfs.makeDirectory(mainBuildDir);
                    });
                } else {
                    if (self.options.verbose) {
                        logger.debug(`Creating build directory: ${mainBuildDir}`);
                    }
                    
                    promise = qfs.makeDirectory(mainBuildDir);
                }

                return promise.then(function() {
                    if (self.options.verbose) {
                        logger.debug(`Copying template from: ${self.directory} to: ${self.buildDir}`);
                    }

                    return qfs.copyTree(self.directory, self.buildDir);
                })
                .then(() => self.processBuildDirectory(self.buildDir));
            });
        }
    },

    finalDestination: {
        get: function() {
            return Path.join(this.options.packageHome || "", this.options.destination || "");
        }
    },


    finish: {
        value: function() {
            var self = this;
            
            if (this.options.verbose) {
                logger.info(`Moving build to: ${this.finalDestination}`);
            }

            //TODO need to gracefully handle when the destination exists already right now we just fail.
            return qfs.makeTree(this.finalDestination).then(function() {
                return qfs.list(self.buildDir, function(_path, stat) {
                    return stat.isFile() || stat.isDirectory();
                }).then(function(filenames) {
                    filenames = filenames.filter((name) => !name.startsWith("."));

                    return Q.all(filenames.map(function(name) {
                        var destination = Path.join(self.finalDestination, name);

                        return qfs.exists(destination)
                            .then(function(destinationExists) {
                                if(!destinationExists) {
                                    return qfs.move(Path.join(self.buildDir, name), destination);
                                } else {
                                    if (self.options.verbose) {
                                        logger.error(`Destination already exists: ${destination}`);
                                    }

                                    throw new MinitError("Cannot overwrite " + destination);
                                }
                            });
                    }));
                });
            });
         }
    },

    _finish: {
        value: function() {           
            return this.finish(this.finalDestination).then(() => {
                if (this.options.verbose) {
                    logger.debug(`Finished processing template: ${this.options.templateName}`);
                    logger.debug(`Removing temporary build directory: ${this.buildDir}`);
                }

                return qfs.removeTree(this.buildDir).catch((error) => {
                    logger.error(`Error removing temporary build directory: ${error}`);
                    throw new MinitError(`Error removing temporary build directory: ${error}`);
                });
            });
        }
    },

    processDirectory: {
        value: function processDirectory(dirname) {
            var self = this;

            return this.rename(dirname).then(function (dirname) {
                if (self.options.verbose) {
                    logger.debug(`Processing files in directory: ${dirname}`);
                }

                return qfs.list(dirname, function(_path, stat) {
                    return stat.isFile() || stat.isDirectory();
                }).then(function(filenames) {
                    return Q.all(filenames.map(function(name) {
                        const path = Path.join(dirname, name);

                        return qfs.stat(path).then(function(stat) {
                            let promise;

                            if (stat.isFile() && /\.(html|json|js|css|markdown|md)$/.test(name)) {
                                promise = self.processFile(path);
                            } else if (stat.isDirectory()){
                                promise = self.processDirectory(path);
                            }

                            return promise;
                        });
                    }));
                });
            });
        }
    },

    processBuildDirectory: {
        value: function processDirectory(dirname) {
            return this.processDirectory(dirname).then(() => this._finish());
        }
    },

    processFile: {
        value: function processFile(filename) {
            var self = this;

            if (this.options.verbose) {
                logger.debug(`Processing file: ${filename}`);
            }

            return qfs.read(filename).then(function(data) {
                data = data.toString();

                if (self.options.verbose) {
                    logger.debug(`Applying transformation to: ${filename}`);
                }

                var newContents = self.applyTransform(data, self.options);

                if (self.options.verbose) {
                    logger.debug(`Writing transformed content to: ${filename}`);
                }

                return qfs.write(filename, newContents).then(function () {
                    return self.rename(filename);
                }).fail(function (error) {
                    logger.error(`Error writing to ${filename}: ${error}`);
                    throw new MinitError(`Error writing to ${filename}`);
                });
            });
        }
    },

    applyTransform: {
        value: function(content, vars) {
            return Mustache.render(content, vars);
        }
    },

    rename: {
        value: function(filename) {
            var newName = filename,
                options = this.options;
            for (var name in options) {
                if (options.hasOwnProperty(name) && typeof options[name] === "string") {
                    newName = newName.replace(
                        FILENAME_VARIABLE_START + name + FILENAME_VARIABLE_END,
                        options[name]
                    );
                }
            }
            if(newName === filename) {
                return Q.resolve(filename);
            } else {
                var done = Q.defer();
                qfs.move(filename, newName).then(function () {
                    done.resolve(newName);
                }).done();
                return done.promise;
            }
        }
    }

});
