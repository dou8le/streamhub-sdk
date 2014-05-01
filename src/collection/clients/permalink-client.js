'use strict'
var LivefyreHttpClient = require('streamhub-sdk/collection/clients/http-client');
var inherits = require('inherits');

/**
 * A Client for requesting Livefyre's Stream Service
 * @exports streamhub-sdk/collection/clients/stream-client
 */
var LivefyrePermalinkClient = function (opts) {
    opts = opts || {};
    opts.serviceName = 'bootstrap';
    LivefyreHttpClient.call(this, opts);
};
inherits(LivefyrePermalinkClient, LivefyreHttpClient);

LivefyrePermalinkClient.prototype._serviceName = 'bootstrap';

/**
 * Get a permalink for a specific comment.
 * @param opts {Object} Options to help build URL.
 * @param opts.collectionId {string}
 * @param opts.messageId {string}
 * @param {function()} callback
 */
LivefyrePermalinkClient.prototype.getPermalink = function (opts, callback) {
    var self = this;
    opts.dataType = 'jsonp';//???????????
    var clbk = function (err, data) {
        callback(err, self._adaptPermalink(data));
    };
    this._request({
        data: {
            collection_id: opts.collectionId
        },
        url: this._getMessageUrl(opts, '/permalink/')
    }, clbk);
};

/**
 * Get a message URL.
 * @param opts {Object} Options to help build URL.
 * @param opts.messageId {string}
 * @param postfix {string} Remainder of URL to add at the end.
 * @return {string}
 * @private
 */
LivefyrePermalinkClient.prototype._getMessageUrl = function (opts, postfix) {
    var url = [
        this._getUrlBase(opts),
        '/api/v3.0/message/',
        opts.messageId
    ].join('');
    return url + postfix;
};

/**
 * Adapt the successful response into a permalink string
 * @protected
 */
LivefyrePermalinkClient.prototype._adaptPermalink = function (opt_data) {
    if (!opt_data) {
        return null;
    }
    var permalink = opt_data[BootstrapKeys.DATA][BootstrapKeys.URL];
    if (permalink.indexOf('http://') !== 0) {
        permalink = 'http://' + permalink;
    }
    return permalink;
};

var BootstrapKeys = {
    ANCHORS: 'anchors',
    ANNOTATION: 'annotation',
    AUTHORS: 'authors',
    AUTHOR_ID: 'authorId',
    BLOCK_ID: 'blockId',
    BODY_HTML: 'bodyHtml',
    CONTENT: 'content',
    CREATED_AT: 'createdAt',
    DATA: 'data',
    EREFS: 'erefs',
    HINTS: 'hints',
    ID: 'id',
    INDEX: 'index',
    MESSAGES: 'messages',
    META: 'meta',
    MODERATOR: 'moderator',
    NUM_ANNOTATIONS: 'num_annotations',
    NUM_VISIBLE: 'numVisible',
    PARENT_ID: 'parentId',
    SIMHASH: 'simhash',
    STATES: 'states',
    URL: 'url',
    VOTE: 'vote'
};

module.exports = LivefyrePermalinkClient;
