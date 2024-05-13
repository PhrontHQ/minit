{{#copyright}}/* {{{copyright}}} */

{{/copyright}}/**
 * @module {{#destination}}{{destination}}/{{/destination}}{{name}}.mod
 * @requires {{extendsModuleId}}
 */
var {{extendsName}} = require("{{extendsModuleId}}").{{extendsName}};

/**
 * @class {{exportedName}}
 * @extends {{extendsName}}
 */
exports.{{exportedName}} = {{extendsName}}.specialize(/** @lends {{exportedName}}# */ {
    constructor: {
        value: function {{exportedName}}() {
            this.super();
        }
    }
});
