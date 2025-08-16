export const getImageUrlWithCacheBuster = ({
    url,
    refreshKey,
}: {
    url?: string;
    refreshKey: number;
}): string | undefined => {
    if (!url) {
        return url;
    }

    // Si l'URL contient déjà un paramètre, ajouter avec &, sinon avec ?
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${refreshKey}`;
};
