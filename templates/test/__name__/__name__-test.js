var TestController = require("mod/testing/test-controller").TestController;

exports.Test = TestController.specialize({
    constructor: {
        value: function {{name}}() {
            this.super();
        }
    }
});
