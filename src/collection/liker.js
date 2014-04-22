define([
    'streamhub-sdk/auth',
    'streamhub-sdk/collection/clients/write-client',
], function (Auth, LivefyreWriteClient) {
    'use strict';

    var Liker = function (opts) {
        opts = opts || {};
        this._writeClient = opts.writeClient || new LivefyreWriteClient();
    };

    Liker.prototype.like = function (content, callback) {
        this._writeClient.like({
            network: content.collection.network,
            siteId: content.collection.siteId,
            collectionId: content.collection.id,
            lftoken: Auth.getToken(),
            contentId: content.id
        }, callback);
    };

    Liker.prototype.unlike = function (content, callback) {
        this._writeClient.unlike({
            network: content.collection.network,
            siteId: content.collection.siteId,
            collectionId: content.collection.id,
            lftoken: Auth.getToken(),
            contentId: content.id
        }, callback);
    };

    return Liker;
});
