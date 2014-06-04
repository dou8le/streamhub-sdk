define([
    'streamhub-sdk/collection/clients/http-client',
    'inherits'],
function(LivefyreHttpClient, inherits) {
    'use strict';

    /**
     * A Client for requesting Livefyre's Quill/Write Service
     * @exports streamhub-sdk/collection/clients/write-client
     */
    var LivefyreWriteClient = function (opts) {
        opts = opts || {};
        opts.serviceName = 'quill';
        LivefyreHttpClient.call(this, opts);
    };

    inherits(LivefyreWriteClient, LivefyreHttpClient);

    /**
     * Posts a piece of content to a Livefyre collection.
     * @param opts {Object} The livefyre collection options.
     * @param opts.network {string} The name of the network in the livefyre platform
     * @param opts.collectionId {string} The livefyre collectionId for the conversation
     * @param opts.lftoken {string} The livefyre user auth token
     * @param opts.body {string} The content's body html with the following allowed tags:
     *     a, img, span, label, p, br, strong, em, u, blockquote, ul, li, ol, pre
     * @param opts.title {string} The content's title
     * @param opts.media {array} An Array of oEmbed JSON Objects to attach to the posted Content
     * @param callback {function} A callback that is called upon success/failure of the
     *     write request. Callback signature is "function(error, data)".
     */
    LivefyreWriteClient.prototype.postContent = function (opts, callback) {
        opts = opts || {};
        callback = callback || function() {};
        var url = [
            this._getUrlBase(opts),
            "/api/v3.0/collection/",
            opts.collectionId,
            "/post/"
        ].join("");

        var postData = {
            body: opts.body,
            title: opts.title,
            lftoken: opts.lftoken
        };

        if (opts.parent_id) {
            postData.parent_id = opts.parent_id;
        }

        if (opts.media) {
            postData.attachments = JSON.stringify(opts.media);
        }

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.updateContent = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            "/api/v3.0/message/",
            opts.contentId,
            "/edit/"
        ].join("");

        var postData = {
            'body': opts.body,
            'collection_id': opts.collectionId,
            'site_id': opts.siteId,
            lftoken: opts.lftoken
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };    

    LivefyreWriteClient.prototype.trashContent = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            "/api/v3.0/message/",
            opts.contentId,
            "/hide/"
        ].join("");

        var postData = {
            'collection_id': opts.collectionId,
            'site_id': opts.siteId,
            lftoken: opts.lftoken
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.bozoContent = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/message/',
            opts.contentId,
            '/bozo/'
        ].join("");

        var postData = {
            collection_id: opts.collectionId,
            site_id: opts.siteId,
            lftoken: opts.lftoken
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    /**
     * Posts a tweet to a Livefyre collection.
     * @param opts {Object} The livefyre collection options.
     * @param opts.network {string} The name of the network in the livefyre platform
     * @param opts.collectionId {string} The livefyre collectionId for the conversation
     * @param opts.lftoken {string} The livefyre user auth token
     * @param opts.tweetId {string} The Tweet ID of the tweet to add to the Collection
     * @param callback {function} A callback that is called upon success/failure of the
     *     write request. Callback signature is "function(error, data)".
     */
    LivefyreWriteClient.prototype.postTweet = function (opts, callback) {
        opts = opts || {};
        callback = callback || function() {};
        var url = [
            this._getUrlBase(opts),
            "/api/v3.0/collection/",
            opts.collectionId,
            "/post/tweet/"
        ].join("");

        var postData = {tweet_id: opts.tweetId, lftoken: opts.lftoken};

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.follow = function (opts, callback) {
        opts = opts || {};
        callback = callback || function() {};
        var url = [
            this._getUrlBase(opts),
            "/api/v3.0/collection/",
            opts.collectionId,
            "/follow/"
        ].join("");

        var postData = {lftoken: opts.lftoken};

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.unfollow = function (opts, callback) {
        opts = opts || {};
        callback = callback || function() {};
        var url = [
            this._getUrlBase(opts),
            "/api/v3.0/collection/",
            opts.collectionId,
            "/unfollow/"
        ].join("");

        var postData = {lftoken: opts.lftoken};

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.like = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/message/',
            opts.contentId,
            '/like/'
        ].join("");

        var postData = {
            lftoken: opts.lftoken,
            collection_id:  opts.collectionId
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.unlike = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/message/',
            opts.contentId,
            '/unlike/'
        ].join("");

        var postData = {
            lftoken: opts.lftoken,
            collection_id:  opts.collectionId
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.flag = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/message/',
            opts.contentId,
            '/flag/',
            opts.flagType,
            '/'
        ].join("");

        var postData = {
            lftoken: opts.lftoken,
            collection_id:  opts.collectionId
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.feature = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/collection/',
            opts.collectionId,
            '/feature/',
            opts.contentId,
            '/'
        ].join("");

        var postData = {
            lftoken: opts.lftoken
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.unfeature = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};
        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/collection/',
            opts.collectionId,
            '/unfeature/',
            opts.contentId,
            '/'
        ].join("");

        var postData = {
            lftoken: opts.lftoken
        };

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.banUser = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};

        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/author/',
            opts.authorId,
            '/ban/'
        ].join("");

        var postData = {
            lftoken: opts.lftoken,
            retroactive: opts.retroactive
        };
        // Must include either "network" or "sites" as a param: http://docs.livefyre.com/developers/api-reference/#flex-ban
        if(opts.network) { postData.network = opts.network; }
        if(opts.sites) { postData.sites = opts.sites; }

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    LivefyreWriteClient.prototype.unbanUser = function (opts, callback) {
        opts = opts || {};
        callback = callback || function () {};

        var url = [
            this._getUrlBase(opts),
            '/api/v3.0/author/',
            opts.authorId,
            '/unban/'
        ].join("");

        var postData = {
            lftoken: opts.lftoken,
            retroactive: opts.retroactive
        };
        // Must include either "network" or "sites" as a param: http://docs.livefyre.com/developers/api-reference/#flex-unban
        if(opts.network) { postData.network = opts.network; }
        if(opts.sites) { postData.sites = opts.sites; }

        this._request({
            method: 'POST',
            url: url,
            data: postData
        }, callback);
    };

    return LivefyreWriteClient;
});
