/**
 * @module ui/version.mod
 * @requires mod/ui/component
 */
var Component = require("mod/ui/component").Component;

/**
 * @class Version
 * @extends Component
 */
exports.Version = Component.specialize(/** @lends Version# */ {
    constructor: {
        value: function Version() {
            this.super();
        }
    },

    montageDescription: {
        get: function() {
            return montageRequire.packageDescription;
        }
    }
});
