const pino = require("pino");

// Create logger instance
// TODO: the log level should be configurable
const logger = pino({
    level: "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true
        }
    },
    sync: true
});

exports.setLoggerLevel = function (level) {
    level = ["debug", "info"].includes(level) ? level : "info";
    logger.level = level;
};

exports.logger = logger;
