define([
    'streamhub-sdk/content/types/livefyre-content',
    'streamhub-sdk/content/types/livefyre-twitter-content',
    'streamhub-sdk/content/types/livefyre-facebook-content',
    'streamhub-sdk/content/types/oembed',
    'streamhub-sdk/content/types/livefyre-oembed',
    'streamhub-sdk/content/types/livefyre-opine',
    'streamhub-sdk/content/types/livefyre-instagram-content',
    'streamhub-sdk/content/types/livefyre-url-content',
    'streamhub-sdk/storage',
    'streamhub-sdk/debug',
    'stream/transform',
    'inherits'
], function (LivefyreContent, LivefyreTwitterContent, LivefyreFacebookContent,
Oembed, LivefyreOembed, LivefyreOpine, LivefyreInstagramContent, LivefyreUrlContent,
Storage, debug, Transform, inherits) {
    'use strict';

    var log = debug('streamhub-sdk/content/state-to-content');

    var getContentStorageKey = Storage.keys.content;
    var getContentChildrenStorageKey = Storage.keys.contentChildren;

    /**
     * An Object that transforms state objects from Livefyre APIs
     * into streamhub-sdk Content instances
     * @param [opts.authors] {object} A mapping of authorIds to author information
     * @param [opts.collection] {Collection}
     * @param [opts.replies=false] {boolean} Whether to read out reply Content
     * @param [opts.storage] {Storage} A storage mechanism that supports get/set functions.
     */
    var StateToContent = function (opts) {
        opts = opts || {};
        this.setAuthors(opts.authors || {});
        this._replies = opts.replies;
        this._collection = opts.collection;
        this._storage = opts.storage || Storage;
        Transform.call(this, opts);
    };

    inherits(StateToContent, Transform);


    StateToContent.prototype._transform = function (state, done) {
        var contents;
        try {
            contents = this.transform(state, this._authors, {
                replies: this._replies,
                collection: this._collection
            });
        } catch (err) {
            this.emit('error transforming state-to-content', err);
            log('StateToContent.transform threw', err);
        }
        if (contents && contents.length) {
            this.push.apply(this, contents);
        }
        done();
    };


    /**
     * Creates the correct content type given the supplied "state".
     * @param state {Object} The livefyre content "state" as received by the
     *     client.
     * @param authors {Object} A mapping of authorIds to author information
     * @param opts {Object}
     * @param opts.createContent {Function}
     * @return {LivefyreContent[]} An Array containing a Content that represents
     *     the passed state, if it was top-level. If opts.replies, then any
     *     reply Content that was transformed will be returned
     *     (including potentially many descendants)
     */
    StateToContent.prototype.transform = function (state, authors, opts) {
        opts = opts || {};

        var isPublic = (typeof state.vis === 'undefined') || (state.vis === 1),
            isReply = state.content.parentId,
            type = StateToContent.enums.type[state.type],
            isAttachment = ('OEMBED' === type),
            isContent = ('CONTENT' === type),
            isOpine = ('OPINE' === type),
            childStates = state.childContent || [],
            content,
            childContent = [],
            descendantContent = [];

        if ( ! (isAttachment || isContent || isOpine)) {
            return;
        }

        content = this._createContent(state, authors);

        if (content && opts.collection) {
            content.collection = opts.collection;
        }

        // Store content with IDs in case we later get
        // replies or attachments targeting it
        if (content && content.id) {
            var stored = this._storage.get(getContentStorageKey(content));
            if (stored) {
                // If existing content, update properties on existing instance
                // only if the update is newer than the current content or if it is a visibility update
                if (isContent && (!isValidDate(stored.updatedAt) || ((content.updatedAt > stored.updatedAt)) || !isValidDate(content.updatedAt))) {
                    // This could be a delete state, so only update
                    // properties that are actually set
                    stored.set(this._getUpdatedProperties(content));
                }

                //Store to prevent old data from rendering, but
                //don't return a content to be rendered if this
                //update shouldn't be visible
                if (!isPublic || !content.body) {
                    return;
                }

                // Use the stored object, now that its properties have been
                // updated
                content = stored;
                // Don't handle attachment updating.
            } else {
                //This is an update to something that is
                //no longer in the collection. Skip it.
                if (content.updatedBy) {
                    return;
                }
                this._storage.set(getContentStorageKey(content), content);
            }
        }

        // Get child states (replies and attachments)
        childStates = state.childContent || [];
        // Transform child states (replies and attachments)
        // This will put them in Storage
        for (var i=0, numChildren=childStates.length; i < numChildren; i++) {
            var thisReplyAndDescendants = this.transform(childStates[i], authors, opts);
            descendantContent.push.apply(descendantContent, thisReplyAndDescendants || []);
        }

        // Add any children that are awaiting the new content
        childContent = this._storage.get(getContentChildrenStorageKey(content)) || [];
        if (childContent.length) {
            this._addChildren(content, childContent);
        }

        // At this point, all content and children (recursively)
        // Are stored by ID
        // Attach attachments to their target, or store for later
        if (isAttachment) {
            this._attachOrStore(content, state.content.targetId);
        }
        // Add replies to their parent, or store for later
        if (isReply) {
            this._addReplyOrStore(content, state.content.parentId);
        }
        // Add opines to their parent, or store for later
        if (isOpine) {
            this._addOpineOrStore(content, state.content.targetId);
        }

        // Never return non-Content items or non-public items
        // But note, this is at the end of the recursive function,
        // so these items are still walked/processed, just not returned
        if ( ! isContent) {
            return this._handleNonContent(content);
        }

        if ( ! isPublic) {
            return this._handleNonPublic(content);
        }

        // Don't return replies if not explicitly specified
        if (isReply && ! opts.replies) {
            return;
        }

        if (opts.collection) {
            content.collection = opts.collection;
        }

        if (opts.replies) {
            return [content].concat(descendantContent);
        }

        return [content];
    };

    // Keep static for legacy API compatibility.
    StateToContent.transform = function (state, authors, opts) {
        var instance = new StateToContent();
        return instance.transform(state, authors, opts);
    };

    StateToContent.prototype.setAuthors = function (authors) {
        this._authors = authors;
    };

    StateToContent.prototype._addChildren = function (content, children) {
        var child;
        for (var i=0, numChildren=children.length; i < numChildren; i++) {
            child = children[i];
            if (child instanceof Oembed) {
                content.addAttachment(child);
            } else if (child instanceof LivefyreContent) {
                content.addReply(child);
            } else if (child instanceof LivefyreOpine) {
                content.addOpine(child);
            }
        }
    };
    // Keep static for legacy API compatibility.
    StateToContent._addChildren = StateToContent.prototype._addChildren;


    StateToContent.prototype._createContent = function (state, authors) {
        var sourceName = StateToContent.enums.source[state.source],
            ContentType;

        state.author = authors ? authors[state.content.authorId] : state.content.author;

        if ('OEMBED' === StateToContent.enums.type[state.type]) {
            return new LivefyreOembed(state);
        } else if ('OPINE' === StateToContent.enums.type[state.type]) {
            return new LivefyreOpine(state);
        } else if (sourceName === 'twitter') {
            return new LivefyreTwitterContent(state);
        } else if (sourceName === 'url') {
            return new LivefyreUrlContent(state);
        } else if (sourceName === 'facebook') {
            return new LivefyreFacebookContent(state);
        } else if (sourceName === 'instagram') {
            return new LivefyreInstagramContent(state);
        } else if (sourceName === 'feed') {
            ContentType = LivefyreContent;
            // Use specific Content type for states from instagram RSS feeds
            if (isInstagramState(state)) {
                ContentType = LivefyreInstagramContent;
            }
            return new ContentType(state);
        } else if (sourceName === 'livefyre') {
            return new LivefyreContent(state);
        } else {
            log("StateToContent could not create content for state", state);
        }
    };
    // Keep static for legacy API compatibility.
    StateToContent._createContent = StateToContent.prototype._createContent;


    function isInstagramState (state) {
        var pattern = /\/\/instagram\.com/i;
        try {
            return state.content.feedEntry.channelId.match(pattern);
        } catch (err) {
            return false;
        }
    }

    function isValidDate (date) {
        return !isNaN(date.getTime());
    }


    /**
     * For a piece of Content, get the the properties and values that should
     * be used to update a previous version of that piece of Content
     * @param content {Content} A new version of a piece of Content,
     *     possible generated from a delete state, so it may not have a truthy
     *     .body and .attachments
     * @return {Object} A dict containing updated properties and their new value
     */
    StateToContent.prototype._getUpdatedProperties = function(content) {
        var updatedProperties = {
            visibility: content.visibility
        };

        if (content.attachments && content.attachments.length) {
            updatedProperties.attachments = content.attachments;
        }
        if (content.body) {
            updatedProperties.body = content.body;
        }
        if (content.author) {
            updatedProperties.author = content.author;
        }
        if (content.createdAt && isValidDate(content.createdAt)) {
            updatedProperties.createdAt = content.createdAt;
        }
        if (content.updatedAt && isValidDate(content.createdAt)) {
            updatedProperties.updatedAt = content.updatedAt;
        }
        return updatedProperties;
    };
    // Keep static for legacy API compatibility
    StateToContent._getUpdatedProperties = StateToContent.prototype._getUpdatedProperties;


    StateToContent.prototype._attachOrStore = function (attachment, targetId) {
        var target = this._storage.get(getContentStorageKey({
            id: targetId,
            collection: attachment.collection
        }));
        if (target) {
            log('attaching attachment', arguments);
            target.addAttachment(attachment);
        } else {
            log('storing attachment', arguments);
            this._storeChild(attachment, targetId);
        }
    };
    // Keep static for legacy API compatibility
    StateToContent._attachOrStore = StateToContent.prototype._attachOrStore;

    StateToContent.prototype._addReplyOrStore = function (reply, parentId) {
        var parentKey = getContentStorageKey({
            id: parentId,
            collection: reply.collection
        });
        var parent = this._storage.get(parentKey);
        if (parent) {
            log('adding reply', arguments);
            parent.addReply(reply);
        } else {
            log('storing reply', arguments);
            this._storeChild(reply, parentId);
        }
    };
    // Keep static for legacy API compatibility
    StateToContent._addReplyOrStore = StateToContent.prototype._addReplyOrStore;

    StateToContent.prototype._addOpineOrStore = function (opine, targetId) {
        var target = this._storage.get(targetId);
        if (target) {
            log('attaching attachment', arguments);
            target.addOpine(opine);
        } else {
            log('storing attachment', arguments);
            this._storeChild(opine, targetId);
        }
    };

    StateToContent.prototype._storeChild = function (child, parentId) {
        //TODO (joao) Make this smart enough to not push duplicates
        var childrenKey = getContentChildrenStorageKey({
            id: parentId,
            collection: child.collection
        });
        var children = this._storage.get(childrenKey) || [];
        children.push(child);
        this._storage.set(childrenKey, children);
    };

    // Keep static for legacy API compatibility
    StateToContent._storeChild = StateToContent.prototype._storeChild;

    StateToContent.prototype._handleNonPublic = function(content) {
        return;
    };

    StateToContent.prototype._handleNonContent = function(content) {
        return;
    };

    StateToContent.enums = {};


    StateToContent.enums.source = LivefyreContent.SOURCES;


     /**
     * The StreamHub APIs use enumerations to define
     * the type of message sent down the wire. All types
     * should be in this enumeration.
     * @enum types
     * @property {string} types.CONTENT - The good stuff. Juicy Content
     * like comments
     * @property {string} types.OPINE - A user's opinion or something
     * @property {string} types.SHARE - TODO: I don't know yet.
     * @property {string} types.OEMBED - A new attachment
     */
    StateToContent.enums.type = [
        'CONTENT',
        'OPINE',
        'SHARE',
        'OEMBED'
    ];


    StateToContent.Storage = Storage;
    return StateToContent;
});
