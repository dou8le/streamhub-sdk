var StreamhubShareButton = require('streamhub-share');

function ShareButton() {
    StreamhubShareButton.apply(this, arguments);

}

var proto  = function(){}
proto.prototype = StreamhubShareButton.prototype

ShareButton.prototype = new proto();
ShareButton.prototype.constructor = ShareButton;

ShareButton.prototype.template = function () {
    return this._label;
}

ShareButton.prototype.elClassPrefix = 'hub';

module.exports = ShareButton

