module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo', ['@babel/preset-typescript', { allowNamespaces: true }]],
        plugins: ['react-native-reanimated/plugin'], // Obligatoire pour animations fluides
    };
};
