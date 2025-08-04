const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    ws: require.resolve('./shims/empty.js'),
    events: require.resolve('./shims/empty.js'),
    stream: require.resolve('./shims/empty.js'),
    net: require.resolve('./shims/empty.js'),
    tls: require.resolve('./shims/empty.js'),
    http: require.resolve('./shims/empty.js'),
    https: require.resolve('./shims/empty.js'),
    zlib: require.resolve('./shims/empty.js'),
    crypto: require.resolve('./shims/empty.js'),
    url: require.resolve('./shims/empty.js'), // 👈 NOUVELLE LIGNE
};

module.exports = config;
