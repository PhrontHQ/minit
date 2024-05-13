var Montage = require("mod/core/core").Montage;

describe("test/{{#destination}}{{destination}}/{{/destination}}{{^destination}}{{/destination}}{{name}}-spec", function() {
    describe("{{title}}", function() {
        it("should be true", function() {
            expect(true).toBeTruthy();
        });
    });
});
