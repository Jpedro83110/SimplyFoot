import { Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// FIXME: seams not used
export function UniversalPicker({ selectedValue, onValueChange, items, style, ...props }) {
    if (Platform.OS === 'web') {
        return (
            <select
                value={selectedValue}
                onChange={(e) => onValueChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    background: '#1e1e1e',
                    color: '#fff',
                    border: '1px solid #333',
                    marginBottom: 10,
                    fontSize: 16,
                    ...style,
                }}
                {...props}
            >
                {items.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }
    return (
        <Picker
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={[{ color: '#fff', width: '100%' }, style]}
            {...props}
        >
            {items.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
        </Picker>
    );
}
