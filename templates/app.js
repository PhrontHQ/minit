var PackageTemplate = require("./package").Template;
var ArgumentError = require("../lib/error.js").ArgumentError;
var fs = require('fs');
var removeDiacritics = require("diacritics").remove;
const process = require('process');


var _fromCamelToDashes = function(name) {
    var s1 = name.replace(/([A-Z])/g, function (g) { return "-"+g.toLowerCase(); });
    s1 = s1.replace(/--/g, "-").replace(/^-/, "");
    return s1;
};
var _fromDashesToCamel = function(name) {
    var s1 = name.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    s1 = s1[0].toUpperCase() + s1.slice(1);
    return s1;
};

exports.Template = Object.create(PackageTemplate, {

    commandDescription: {
        value: "application"
    },

    addOptions: {
        value:function (command) {
            command = PackageTemplate.addOptions.call(this, command);
            command.option('-n, --name <name>', 'application name (required)');
            command.option('-d, --desc <desc>', 'application description (optional)');
            command.option('-c, --copyright [path]', 'copyright file');
            return command;
        }
    },

    didSetOptions: {
        value:function (options) {
            if (options.name) {
                options.originalName = options.name;
                options.name = this.validateName(options.name);
            } else {
                throw new ArgumentError("Required name option missing");
            }
            if (options.desc) {
                options.desc = this.validateDescription(options.desc);
            } else {
                options.desc = options.originalName + " Application";
            }
            if (options.copyright) {
                options.copyright = this.validateCopyright(options.copyright);
            }
        }
    },

    validateName: {
        value: function(name) {
            name = name.replace(/ /g, "-");
            // convert to camelcase
            name =  _fromDashesToCamel(name);
            // convert back from camelcase to dashes and ensure names are safe to use as npm package names
            return removeDiacritics(_fromCamelToDashes(name));
        }
    },

    validateDescription: {
        value: function(desc) {
            // ensure names are safe to use as npm package names
            return removeDiacritics(desc);
        }
    },

    validateCopyright: {
        value: function(path) {
            return fs.readFileSync(path, "utf-8");
        }
    },

    defaultPackageHome: {
        value: function () {
            return process.cwd();
        }
    }
});
