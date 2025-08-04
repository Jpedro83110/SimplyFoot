import React from 'react';
import { View, TouchableOpacity, Image, Linking, Alert } from 'react-native';

// FIXME: seams not used
export default function ReseauxSociaux({ facebook, instagram, boutique }) {
    const openAppOrURL = async (url, appUrl) => {
        try {
            const supported = await Linking.canOpenURL(appUrl);
            if (supported) {
                await Linking.openURL(appUrl);
            } else {
                await Linking.openURL(url); // fallback vers navigateur
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d’ouvrir ce lien.', error);
        }
    };

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 10 }}>
            {facebook && (
                <TouchableOpacity
                    onPress={() => openAppOrURL(facebook, `fb://facewebmodal/f?href=${facebook}`)}
                >
                    <Image
                        source={require('../../assets/minilogo/facebook.png')}
                        style={{ width: 30, height: 30 }}
                    />
                </TouchableOpacity>
            )}

            {instagram && (
                <TouchableOpacity
                    onPress={() =>
                        openAppOrURL(
                            instagram,
                            `instagram://user?username=${instagram.split('/').pop()}`,
                        )
                    }
                >
                    <Image
                        source={require('../../assets/minilogo/instagram.png')}
                        style={{ width: 30, height: 30 }}
                    />
                </TouchableOpacity>
            )}

            {boutique && (
                <TouchableOpacity onPress={() => Linking.openURL(boutique)}>
                    <Image
                        source={require('../../assets/minilogo/boutique.png')}
                        style={{ width: 30, height: 30 }}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}
