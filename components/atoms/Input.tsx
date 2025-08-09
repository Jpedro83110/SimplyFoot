import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
    icon?: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    showToggle?: boolean;
    show?: boolean;
    onToggle?: () => void;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    editable?: boolean;
    mandatory?: boolean;
    textContentType?:
        | 'none'
        | 'username'
        | 'newPassword'
        | 'emailAddress'
        | 'telephoneNumber'
        | 'familyName'
        | 'givenName'; // FIXME use real type
    multiline?: boolean;
    iconColor?: string;
    iconSize?: number;
    iconLeftColor?: string;
    error?: string | false;
}

const Input: React.FC<InputProps> = ({
    icon,
    value,
    onChangeText,
    placeholder,
    placeholderTextColor = '#aaa',
    secureTextEntry,
    showToggle = false,
    show = false,
    onToggle,
    keyboardType = 'default',
    editable = true,
    mandatory = false,
    textContentType,
    iconColor = '#888',
    iconSize = 20,
    iconLeftColor,
    multiline = false,
    error = undefined,
}) => {
    return (
        <>
            {typeof error === 'string' && (
                <View>
                    <Text style={styles.errorMessage}>{error}</Text>
                </View>
            )}
            <View style={styles.inputGroup}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={iconSize}
                        color={iconLeftColor || iconColor}
                        style={styles.inputIcon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        showToggle && { paddingRight: 50 },
                        error && styles.inputError,
                    ]}
                    placeholder={`${placeholder}${mandatory ? ' *' : ''}`}
                    placeholderTextColor={placeholderTextColor}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !show}
                    keyboardType={keyboardType}
                    editable={editable}
                    textContentType={textContentType}
                    autoCapitalize="none"
                    multiline={multiline}
                />

                {showToggle && onToggle && (
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={onToggle}
                        disabled={!editable}
                    >
                        <Ionicons name={show ? 'eye' : 'eye-off'} size={22} color={iconColor} />
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    inputGroup: {
        position: 'relative',
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: 15,
        zIndex: 1,
    },
    input: {
        flex: 1,
        backgroundColor: '#1e1e1e',
        color: '#fff',
        borderRadius: 10,
        paddingVertical: 14,
        paddingLeft: 45,
        paddingRight: 18,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    eyeButton: {
        position: 'absolute',
        right: 15,
        padding: 5,
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 1,
    },
    errorMessage: {
        color: 'red',
        fontSize: 12,
        marginBottom: 4,
    },
});

export default Input;
