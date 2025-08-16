import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type InputType = 'text' | 'email' | 'password' | 'phone' | 'date' | 'number';

interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
    type?: InputType;
    icon?: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    placeholderTextColor?: string;
    showToggle?: boolean;
    show?: boolean;
    onToggle?: () => void;
    editable?: boolean;
    mandatory?: boolean;
    iconColor?: string;
    iconSize?: number;
    iconLeftColor?: string;
    error?: string | false;
    rightContent?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    type = 'text',
    icon,
    value,
    onChangeText,
    placeholder,
    placeholderTextColor = '#aaa',
    showToggle = false,
    show = false,
    onToggle,
    editable = true,
    mandatory = false,
    iconColor = '#888',
    iconSize = 20,
    iconLeftColor,
    error = false,
    rightContent,
    ...textInputProps
}) => {
    // Détermine les props du TextInput basées sur le type
    const getInputProps = () => {
        const baseProps = {
            autoCapitalize: 'none' as const,
            autoCorrect: false,
        };

        switch (type) {
            case 'email':
                return {
                    ...baseProps,
                    keyboardType: 'email-address' as const,
                    textContentType: 'emailAddress' as const,
                };
            case 'password':
                return {
                    ...baseProps,
                    secureTextEntry: !show,
                    textContentType: 'newPassword' as const,
                };
            case 'phone':
                return {
                    ...baseProps,
                    keyboardType: 'phone-pad' as const,
                    textContentType: 'telephoneNumber' as const,
                };
            case 'number':
                return {
                    ...baseProps,
                    keyboardType: 'numeric' as const,
                };
            case 'date':
                return {
                    ...baseProps,
                    editable: false, // Les dates sont gérées par le composant parent
                };
            default:
                return baseProps;
        }
    };

    const inputProps = getInputProps();
    const hasRightContent = showToggle || rightContent;

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
                        hasRightContent ? { paddingRight: 50 } : {},
                        error && styles.inputError,
                    ]}
                    placeholder={`${placeholder}${mandatory ? ' *' : ''}`}
                    placeholderTextColor={placeholderTextColor}
                    value={value}
                    onChangeText={onChangeText}
                    editable={editable}
                    {...inputProps}
                    {...textInputProps}
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

                {rightContent && !showToggle && (
                    <View style={styles.rightContent}>{rightContent}</View>
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
    rightContent: {
        position: 'absolute',
        right: 15,
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
