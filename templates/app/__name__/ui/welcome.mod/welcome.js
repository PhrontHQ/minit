{{#copyright}}/* {{{copyright}}} */

{{/copyright}}/**
 * @module ui/welcome.mod
 * @requires mod/ui/component
 */
var Component = require("mod/ui/component").Component;

/**
 * @class Welcome
 * @extends Component
 */
exports.Welcome = Component.specialize(/** @lends Welcome# */ {

    constructor: {
        value: function Welcome() {
            this.super();
        }
    }

});
