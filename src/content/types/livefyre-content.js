define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/content',
    'streamhub-sdk/content/annotator',
    'streamhub-sdk/content/types/livefyre-opine',
    'inherits'],
function($, Content, Annotator, LivefyreOpine, inherits) {
    'use strict';

    /**
     * Base class for any piece of Livefyre content. Extracts the details of the content
     * from the json object passed in via the Livefyre stream.
     * @param json {!Object} An object obtained via a Livefyre stream that represents the
     *        state of the content.
     * @param json.body {!string}
     * @param json.id {!number}
     * @param opts {object}
     * @param opts.annotator {Annotator}
     * @exports streamhub-sdk/content/types/livefyre-content
     * @constructor
     */
    var LivefyreContent = function(json, opts) {
        opts = opts || {};
        Content.call(this);
        if ( ! json) {
            return this;
        }
        json.content = json.content || {};
        json.content.annotations = json.content.annotations || {};
        this.body = json.content.bodyHtml || "";
        this.title = json.content.title;
        this.source = LivefyreContent.SOURCES[json.source];
        this.id = json.content.id || json.id;
        this.author = json.author;
        this.createdAt = new Date(1000 * json.content.createdAt);
        this.updatedAt = new Date(1000 * json.content.updatedAt);
        this.visibility = Content.enums.visibility[json.vis];
        this.parentId = json.content.parentId;
        this.meta = json;

        this._likes = 0;
        this._annotator = opts.annotator || this._createAnnotator();
        this._annotator.annotate(this, {
            added: json.content.annotations
        }, true);  // Silently add b/c this is new Content.
    };
    inherits(LivefyreContent, Content);

    /**
     * Overridable annotator instantiator
     */
    LivefyreContent.prototype._createAnnotator = function() {
        return new Annotator();
    };

    /**
     * Attach an Oembed to the Content while first checking for an existing attachment.
     * @param obj {Oembed} An Oembed Content instance to attach
     * @fires Content#attachment
     */
    LivefyreContent.prototype.addAttachment = function(obj) {
        var found = false;
        if (obj.id) {
            for (var i in this.attachments) {
                if (this.attachments[i].id === obj.id) {
                    found = true;
                }
            }
        }
        if (!found) {
            this.attachments.push(obj);
            this.emit('attachment', obj);
        }
    };

    /**
     * Add a reply to the Content while first checking for an existing reply.
     * @param obj {Content} A piece of Content in reply to this one
     * @fires Content#reply
     */
    LivefyreContent.prototype.addReply = function(obj) {
        var found = false;
        if (obj.id) {
            for (var i in this.replies) {
                if (this.replies[i].id === obj.id) {
                    found = true;
                }
            }
        }
        if (!found) {
            this.replies.push(obj);
            this.emit('reply', obj);
        }
    };

    LivefyreContent.prototype.addLike = function (authorId) {
        var opine = LivefyreOpine.adaptLikedBy(authorId, this);
        this.addOpine(opine);
    };

    LivefyreContent.prototype.removeLike = function (authorId) {
        var opine = LivefyreOpine.adaptLikedBy(authorId, this);
        this.removeOpine(opine);
    };

    /**
     * Add a opine to the Content while first checking for an existing opine.
     * Using v3.0 api, so any opine is assumed to be a Like.
     * @param obj {Content} A piece of Content in reply to this one
     * @fires Content#opine
     */
    LivefyreContent.prototype.addOpine = function(obj) {
        if (obj.vis === 0) {
            this.removeOpine(obj);
            return;
        }

        var found = false;
        if (obj.id) {
            for (var i in this.opines) {
                if (this.opines[i].id === obj.id) {
                    found = true;
                }
            }
        } else {
            for (var i in this.opines) {
                if (this.opines[i].content.id === obj.content.id) {
                    found = true;
                }
            }
        }

        if (!found) {
            this.opines.push(obj);
            if (obj.relType === LivefyreOpine.enums.type.indexOf('LIKE')) {
                this._likes++;
            }
            this.emit('opine', obj);
        }
    };

    /**
     * Remove an Opine from the LivefyreContent
     * Using v3.0 api, so any opine is assumed to be a Like.
     * @param obj {Oembed} An LivefyreOpine instance to remove, or an id of one
     * @fires Content#removeOpine
     */
    LivefyreContent.prototype.removeOpine = function(objOrId) {
        var indexToRemove = null;
        var idToRemove = objOrId.id || objOrId;
        var removedObj;
        for (var i=0; i < this.opines.length; i++) {
            if (idToRemove === this.opines[i].id) {
                indexToRemove = i;
                break;
            }
        }
        if (indexToRemove === null) {
            return;
        }
        removedObj = this.opines.splice(indexToRemove, 1)[0];
        this._likes--;
        this.emit('removeOpine', removedObj);
    };

    LivefyreContent.prototype.getLikeCount = function () {
        return this._likes;
    };

    LivefyreContent.prototype.isLiked = function (authorId) {
        for (var i=0; i < this.opines.length; i++) {
            if (authorId === this.opines[i].author.id) {
                return true;
            }
        }
        return false;
    };

    LivefyreContent.prototype.getLikes = function() {
        var likes = [],
            typeId = LivefyreOpine.enums.type.indexOf('LIKE');
        for (var i=0; i < this.opines.length; i++) {
            if(this.opines[i].relType === typeId) { likes.push(this.opines[i]); }
        }
        return likes;
    };

    /**
     * Return whether this Content is featured in a StreamHub Collection
     * @return {boolean}
     */
    LivefyreContent.prototype.isFeatured = function () {
        return Boolean(this.featured);
    };

    /**
     * Return the featured value for this Content, if it is featured
     * @return {Number|undefined} The featured value, if featured, else undefined
     */
    LivefyreContent.prototype.getFeaturedValue = function () {
        if (!this.isFeatured()) {
            return undefined;
        }
        return this.featured.value;
    };

    /**
     * The set of sources as defined by Livefyre's Stream API
     */
    LivefyreContent.SOURCES = [
        "livefyre",    // 0
        "twitter",     // 1
        "twitter",     // 2
        "facebook",    // 3
        "livefyre",    // 4
        "livefyre",    // 5
        "facebook",    // 6
        "twitter",     // 7
        "livefyre",    // 8
        "unknown",
        "unknown",
        "unknown",
        "unknown",
        "feed",        // 13
        "facebook",    // 14
        "unknown",
        "unknown",
        "unknown",
        "unknown",
        "instagram"    // 19
    ];

    return LivefyreContent;
});
