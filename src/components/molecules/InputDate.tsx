import React, { useState, FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Input from '../atoms/Input';
import { formatDateForDisplay, formatDateForInput, parseDateFromInput } from '@/utils/date.utils';

interface InputDateProps {
    value: Date | undefined;
    onChange: (date?: Date) => void;
    placeholder: string;
    disabled?: boolean;
    mandatory?: boolean;
    error?: string | false;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconSize?: number;
    minimumDate?: Date;
    maximumDate?: Date;
    onValidationError?: (message: string) => void;
}

// Composant pour le web
interface WebDateInputProps {
    value: Date | undefined;
    onChange: (dateString: string) => void;
    disabled?: boolean;
    placeholder: string;
    minimumDate?: Date;
    maximumDate?: Date;
}

const WebDateInput: FC<WebDateInputProps> = ({
    value,
    onChange,
    disabled,
    placeholder,
    minimumDate,
    maximumDate,
}) => {
    if (Platform.OS !== 'web') {
        return null;
    }

    return (
        <input
            type="date"
            value={formatDateForInput(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            min={formatDateForInput(minimumDate)}
            max={formatDateForInput(maximumDate)}
            style={{
                flex: 1,
                backgroundColor: '#1e1e1e',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '10px',
                paddingTop: '14px',
                paddingBottom: '14px',
                paddingLeft: '45px',
                paddingRight: '18px',
                fontSize: '16px',
                outline: 'none',
                fontFamily: 'inherit',
            }}
            placeholder={placeholder}
        />
    );
};

const InputDate: FC<InputDateProps> = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    mandatory = false,
    error = false,
    icon = 'calendar-outline',
    iconColor = '#888',
    iconSize = 20,
    minimumDate,
    maximumDate, // By default, cannot select a future date
    onValidationError,
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleDateValidationAndSet = (selectedDate: Date) => {
        // Validation des limites
        if (maximumDate && selectedDate > maximumDate) {
            const errorMessage = 'La date sélectionnée ne peut pas être dans le futur.';
            if (onValidationError) {
                onValidationError(errorMessage);
            } else {
                Alert.alert('Erreur', errorMessage);
            }
            return;
        }

        if (minimumDate && selectedDate < minimumDate) {
            const errorMessage = 'La date sélectionnée est trop ancienne.';
            if (onValidationError) {
                onValidationError(errorMessage);
            } else {
                Alert.alert('Erreur', errorMessage);
            }
            return;
        }

        onChange(selectedDate);
    };

    const handleDatePickerOpen = () => {
        if (Platform.OS !== 'web' && !disabled) {
            setShowDatePicker(true);
        }
    };

    const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (event.type === 'set' && date) {
            handleDateValidationAndSet(date);
            if (Platform.OS === 'ios') {
                setShowDatePicker(false);
            }
        } else if (event.type === 'dismissed') {
            setShowDatePicker(false);
        }
    };

    const handleWebDateChange = (dateString: string) => {
        if (!dateString) {
            onChange(undefined);
            return;
        }

        const selectedDate = parseDateFromInput(dateString);
        if (selectedDate) {
            handleDateValidationAndSet(selectedDate);
        }
    };

    // For the web
    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                {typeof error === 'string' && <Text style={styles.errorMessage}>{error}</Text>}
                <View style={styles.inputGroup}>
                    <Ionicons
                        name={icon}
                        size={iconSize}
                        color={iconColor}
                        style={styles.inputIcon}
                    />
                    <WebDateInput
                        value={value}
                        onChange={handleWebDateChange}
                        disabled={disabled}
                        placeholder={placeholder}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                    />
                </View>
            </View>
        );
    }

    // For mobile
    return (
        <View style={styles.container}>
            <Input
                type="date"
                icon={icon}
                value={value ? formatDateForDisplay({ date: value }) : ''}
                onChangeText={() => {}} // Ne fait rien, géré par le TouchableOpacity
                placeholder={placeholder}
                mandatory={mandatory}
                error={error}
                editable={false}
                iconColor={iconColor}
                iconSize={iconSize}
                rightContent={
                    <TouchableOpacity
                        onPress={handleDatePickerOpen}
                        disabled={disabled}
                        style={styles.dateButton}
                    >
                        <Ionicons name="chevron-down" size={20} color={iconColor} />
                    </TouchableOpacity>
                }
            />

            {showDatePicker && (
                <View style={styles.datePickerContainer}>
                    <DateTimePicker
                        value={value || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        maximumDate={maximumDate}
                        minimumDate={minimumDate}
                        style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                    />
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={styles.closeDatePickerButton}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text style={styles.closeDatePickerText}>Confirmer</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
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
    dateButton: {
        padding: 5,
    },
    datePickerContainer: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        marginBottom: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    iosDatePicker: {
        backgroundColor: 'transparent',
    },
    closeDatePickerButton: {
        backgroundColor: '#00ff88',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 10,
    },
    closeDatePickerText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 16,
    },
    errorMessage: {
        color: 'red',
        fontSize: 12,
        marginBottom: 4,
    },
});

export default InputDate;
