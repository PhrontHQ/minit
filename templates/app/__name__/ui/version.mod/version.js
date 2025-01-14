/**
 * @module ui/version.reel
 */
const { Component } = require("mod/ui/component");

/**
 * @class Version
 * @extends Component
 */
exports.Version = class Version extends Component {
    get packageDescription() {
        const pkgReq = typeof montageRequire !== "undefined" ? montageRequire : mr;
        return pkgReq.packageDescription;
    }
};
