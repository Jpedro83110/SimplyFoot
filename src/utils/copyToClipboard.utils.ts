import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

export const copyToClipboard = async (
    text: string,
    successMessage = 'Copié dans le presse-papier ! 📋',
) => {
    if (text) {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copié !', successMessage);
    }
};
