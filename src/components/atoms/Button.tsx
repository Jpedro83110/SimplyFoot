import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    GestureResponderEvent,
    ViewStyle,
} from 'react-native';

type ButtonProps = {
    text: string;
    onPress: (event: GestureResponderEvent) => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    color?: 'primary' | 'secondary';
};

const Button: React.FC<ButtonProps> = ({
    text,
    onPress,
    loading,
    disabled,
    style,
    color = 'primary',
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            style={[
                styles.button,
                color === 'primary' && styles.primary,
                color === 'secondary' && styles.secondary,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={color === 'primary' ? '#000' : '#fff'} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        color === 'primary' ? styles.textPrimary : styles.textSecondary,
                    ]}
                >
                    {text}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        elevation: 2,
        marginTop: 0,
    },
    primary: {
        backgroundColor: '#00ff88',
    },
    secondary: {
        backgroundColor: '#121212',
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontWeight: '700',
        fontSize: 16,
    },
    textPrimary: {
        color: '#000',
    },
    textSecondary: {
        color: '#00ff88',
    },
});

export default Button;
