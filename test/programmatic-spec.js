/*global xdescribe,describe,beforeEach,it,expect */
xdescribe("programmatic", function () {
    var minitCreate = require("../main").create;

    minitCreate("app", {
        name: "newFooApps",
        packageHome: "/Users/francois/declarativ/tools/minit_test/package"
    }).done();
});
