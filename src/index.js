/**
 * Analytics.js
 *
 * (C) 2017 Segment Inc.
 */

var analyticsq = global.analytics || [];
let analytics = require('./lib/index');
let segment = require('./integrations/segment');
analytics.use(segment);

var extend = require('extend');

// Get a handle on the global analytics queue and middleware queue, as initialized by the
// analytics.js snippet. The snippet stubs out the analytics.js API and queues
// up calls for execution when the full analytics.js library (this file) loads.

// Later we'll want middlewareq to be initialized from a global var.
var integrationMiddlewareq = [];

// Parse the version from the analytics.js snippet.
var snippetVersion =
  analyticsq && analyticsq.SNIPPET_VERSION
    ? parseFloat(analyticsq.SNIPPET_VERSION, 10)
    : 0;

// Include as much version information as possible so we know exactly what we're running.
// Looks like: {
//   "core": "3.0.0",
//   "cdn": "1.15.3",
//   "integrations": {
//     "Segment.io": "3.1.1",
//     ...
//   }
// }
analytics._VERSIONS = {
  core: '3.9.0',
  cdn:
    'ajs-renderer 2.8.0 (analytics.js-private 5cbcd1ad1b946b62c14fe640ddf4a9e5aa221a1a)',
  integrations: {
    Piwik: '2.0.0',
    'Segment.io': '4.2.1'
  }
};

// Initialize analytics.js. CDN will render configuration objects using project settings.
var settings = {
  'Segment.io': {
    apiKey: 'yG0oirCVGY9qy8ITWn1K4kL4Hx93VwZN',
    unbundledIntegrations: [],
    addBundledMetadata: true
  }
};
var integrations;
// Default to undefined to minimise the impact of code changes

if (analyticsq._loadOptions && analyticsq._loadOptions.integrations) {
  var integrationOptions = analyticsq._loadOptions.integrations;
  integrations = {};
  var integrationName;

  for (integrationName in integrationOptions) {
    if (!integrationOptions.hasOwnProperty(integrationName)) continue;

    // Get the enabled/disabled status for the integrations that are configured
    // (config objects get converted to true)
    integrations[integrationName] = Boolean(
      integrationOptions[integrationName]
    );

    // Merge the DCS and load options
    if (
      // Make sure the integration exists
      typeof settings[integrationName] === 'object' && // Ignore booleans
      typeof integrationOptions[integrationName] === 'object'
    ) {
      // true means recursive=true
      extend(
        true,
        settings[integrationName],
        integrationOptions[integrationName]
      );
    }
  }
}

// Add Segment middlewares last, if any.
/* eslint-disable */

/* eslint-enable */

// Add any user-supplied middlewares to the middleware handler.
var integrationMiddleware;
while (integrationMiddlewareq && integrationMiddlewareq.length > 0) {
  integrationMiddleware = integrationMiddlewareq.shift();
  if (typeof integrationMiddleware === 'function') {
    analytics.addIntegrationMiddleware(integrationMiddleware);
  }
}

analytics.initialize(settings, {
  initialPageview: snippetVersion === 0,
  plan: {
    track: {
      __default: {
        enabled: true,
        integrations: {}
      }
    },
    identify: {
      __default: {
        enabled: true
      }
    },
    group: {
      __default: {
        enabled: true
      }
    }
  },
  integrations: integrations,
  metrics: {
    sampleRate: 0.1
  },
  user: {},
  group: {},
  middlewareSettings: {}
});

// Make any queued calls up before the full analytics.js library
// loaded
while (analyticsq && analyticsq.length > 0) {
  var args = analyticsq.shift();
  var method = args.shift();

  if (typeof analytics[method] === 'function') {
    analytics[method].apply(analytics, args);
  }
}

// Free the reference to analyticsq
analyticsq = null;

/*
* Exports.
*/

// Set `global.analytics` explicitly rather than using Browserify's
// `--standalone` flag in order to avoid hooking into an already-declared
// `global.require`
global.analytics = analytics;
