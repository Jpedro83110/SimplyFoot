import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';

interface ReturnButtonProps {
    defaultBackRoute?: string;
    forceBackRoute?: string;
}

const ReturnButton: FC<ReturnButtonProps> = ({ defaultBackRoute, forceBackRoute }) => {
    const router = useRouter();

    const goBack = () => {
        if (forceBackRoute) {
            router.push(forceBackRoute);
        } else if (!router.canGoBack() && defaultBackRoute) {
            router.push(defaultBackRoute);
        } else {
            router.back();
        }
    };

    return (
        <TouchableOpacity onPress={goBack} style={styles.button}>
            <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'transparent',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginTop: 20,
        width: '50%',
        maxWidth: 400,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
export default ReturnButton;
