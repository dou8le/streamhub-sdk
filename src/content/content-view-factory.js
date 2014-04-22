define([
    'streamhub-sdk/content',
    'streamhub-sdk/content/types/livefyre-content',
    'streamhub-sdk/content/types/livefyre-twitter-content',
    'streamhub-sdk/content/types/livefyre-facebook-content',
    'streamhub-sdk/content/types/livefyre-instagram-content',
    'streamhub-sdk/content/types/twitter-content',
    'streamhub-sdk/content/views/content-view',
    'streamhub-sdk/content/views/tiled-attachment-list-view',
    'streamhub-sdk/content/views/livefyre-content-view',
    'streamhub-sdk/content/views/twitter-content-view',
    'streamhub-sdk/content/views/facebook-content-view',
    'streamhub-sdk/content/views/instagram-content-view',
    'streamhub-sdk/content/views/gallery-on-focus-view'
], function(
    Content,
    LivefyreContent,
    LivefyreTwitterContent,
    LivefyreFacebookContent,
    LivefyreInstagramContent,
    TwitterContent,
    ContentView,
    TiledAttachmentListView,
    LivefyreContentView,
    TwitterContentView,
    FacebookContentView,
    InstagramContentView,
    GalleryOnFocusView
) {
    'use strict';

    /**
     * A module to create instances of ContentView for a given Content instance.
     * @exports streamhub-sdk/content-view-factory
     * @constructor
     */
    var ContentViewFactory = function(opts) {
        opts = opts || {};
        this.contentRegistry = this.contentRegistry.slice(0);
        if (opts.createAttachmentsView) {
            this._createAttachmentsView = opts.createAttachmentsView;
        }
    };

    /**
     * The default registry for Content -> ContentView rendering.
     * Expects entries to always contain a "type" property, and either a view property
     * (the type function itself) or a viewFunction property (a function that returns a
     * type function, useful for conditional view selection.).
     */
    ContentViewFactory.prototype.contentRegistry = [
        { type: LivefyreTwitterContent, view: TwitterContentView,
            typeUrn: 'urn:livefyre:js:streamhub-sdk:content:types:livefyre-twitter' },
        { type: LivefyreFacebookContent, view: FacebookContentView,
            typeUrn: 'urn:livefyre:js:streamhub-sdk:content:types:livefyre-facebook' },
        { type: LivefyreInstagramContent, view: InstagramContentView,
            typeUrn: 'urn:livefyre:js:streamhub-sdk:content:types:livefyre-instagram' },
        { type: TwitterContent, view: TwitterContentView,
            typeUrn: 'urn:livefyre:js:streamhub-sdk:content:types:twitter' },
        { type: LivefyreContent, view: LivefyreContentView,
            typeUrn: 'urn:livefyre:js:streamhub-sdk:content:types:livefyre' },
        { type: Content, view: ContentView,
            typeUrn: 'urn:livefyre:js:streamhub-sdk:content' }
    ];

    /**
     * Creates a content view from the given piece of content, by looking in this view's
     * content registry for the supplied content type.
     * @param content {Content} A content object to create the corresponding view for.
     * @param opts {object} Options for displaying specific controls on the content view.
     * @returns {ContentView} A new content view object for the given piece of content.
     */
    ContentViewFactory.prototype.createContentView = function(content, opts) {
        opts = opts || {};
        var ContentViewType = this._getViewTypeForContent(content);
        var attachmentsView = this._createAttachmentsView(content);
        var contentView = new ContentViewType({
            content : content,
            attachmentsView: attachmentsView,
            shareable: opts.shareable
        });

        return contentView;
    };


    ContentViewFactory.prototype._getViewTypeForContent = function (content) {
        for (var i=0, len=this.contentRegistry.length; i < len; i++) {
            var current = this.contentRegistry[i];
            var sameTypeUrn = content.typeUrn && (current.typeUrn === content.typeUrn);
            if (! (sameTypeUrn || (content instanceof current.type))) {
                continue;
            }

            var currentType;
            if (current.view) {
                currentType = current.view;
            } else if (current.viewFunction) {
                currentType = current.viewFunction(content);
            }
            return currentType;
        }
    };


    ContentViewFactory.prototype._createAttachmentsView = function (content) {
        var tiledAttachmentListView = new TiledAttachmentListView();
        return new GalleryOnFocusView(tiledAttachmentListView, {
            content: content
        });
    };

    return ContentViewFactory;
});
