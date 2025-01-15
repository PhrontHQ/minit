const ProgressBar = require("progress");

class MinitProgressBar {
    constructor(total) {
        this.bar = new ProgressBar("# :step  [:bar] :percent", {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: total
        });
    }

    tick(tokens) {
        this.bar.tick(tokens);
    }

    render(tokens) {
        this.bar.render(tokens);
    }
}

exports.progressBar = new MinitProgressBar(3);
