import { storage } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

export const uploadImage = async ({
    image,
    name,
    utilisateurId,
}: {
    image: ImagePickerAsset;
    name: string;
    utilisateurId: string;
}) => {
    let fileData;
    let fileExt = 'jpg';

    if (Platform.OS === 'web') {
        const response = await fetch(image.uri);
        fileData = await response.blob();

        if (image.uri.includes('.png')) {
            fileExt = 'png';
        } else if (image.uri.includes('.jpeg') || image.uri.includes('.jpg')) {
            fileExt = 'jpg';
        } else if (image.uri.includes('.gif')) {
            fileExt = 'gif';
        }
    } else {
        if (!image.base64) {
            throw new Error('Pas de données base64 disponibles');
        }

        fileData = decode(image.base64);

        if (image.uri.includes('png') || image.type?.includes('png')) {
            fileExt = 'png';
        } else if (
            image.uri.includes('jpeg') ||
            image.uri.includes('jpg') ||
            image.type?.includes('jpeg')
        ) {
            fileExt = 'jpg';
        } else if (image.uri.includes('gif') || image.type?.includes('gif')) {
            fileExt = 'gif';
        }
    }

    const fileName = `${name}/${utilisateurId}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await storage
        .from('fichiers')
        .upload(fileName, fileData, {
            contentType: `image/${fileExt}`,
            upsert: true,
        });

    if (uploadError) {
        throw uploadError;
    }

    if (!uploadData || !uploadData.path) {
        throw new Error("Erreur lors de l'upload de l'image");
    }

    const { data: urlData } = storage.from('fichiers').getPublicUrl(fileName);

    return urlData.publicUrl;
};

export const removeImage = async ({ url, name }: { url: string; name: string }) => {
    const pathParts = url.split(`${name}/`);

    if (pathParts.length < 1) {
        console.warn('removeImage: URL does not contain the specified folder name');
        return;
    }

    const { error } = await storage.from('fichiers').remove([`${name}/${pathParts[1]}`]);

    if (error) {
        throw error;
    }
};
