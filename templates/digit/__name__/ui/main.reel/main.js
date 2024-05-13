{{#copyright}}/* {{{copyright}}} */

{{/copyright}}/**
 * @module ui/main.mod
 * @requires mod/ui/component
 */
var Component = require("mod/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    }
});
