var Montage = require("mod/core/core").Montage;
var TestPageLoader = require("mod/testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("{{name}}-test", function(testPage) {

    describe("test/{{#destination}}{{destination}}{{/destination}}{{^destination}}ui{{/destination}}/{{name}}/{{name}}-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("{{title}}", function() {
            it("can be created", function() {
                expect(testPage.test.{{propertyName}}).toBeDefined();
            });
        });
    });
});
