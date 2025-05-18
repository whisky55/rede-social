import { TouchableOpacity, Text, StyleSheet } from "react-native";

export function PrimaryButton({ action, text }) {
    return (
        <TouchableOpacity
            onPress={action}
            style={[styles.button, styles.primaryButton]}
        >
            <Text style={styles.primaryText}>{text}</Text>
        </TouchableOpacity>
    );
}

export function SecondaryButton({ action, text }) {
    return (
        <TouchableOpacity
            onPress={action}
            style={[styles.button, styles.secondaryButton]}
        >
            <Text style={styles.secondaryText}>{text}</Text>
        </TouchableOpacity>
    );
}

export function DangerButton({ action, text }) {
    return (
        <TouchableOpacity
            onPress={action}
            style={[styles.button, styles.dangerButton]}
        >
            <Text style={styles.dangerText}>{text}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        marginVertical: 12,
        alignItems: 'center',
    },
    // Botão primário
    primaryButton: {
        backgroundColor: '#4F46E5',
    },
    primaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Botão secundário
    secondaryButton: {
        backgroundColor: '#E0E7FF',
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    secondaryText: {
        color: '#4F46E5',
        fontSize: 16,
        fontWeight: '500',
    },
    // Botão de perigo
    dangerButton: {
        backgroundColor: '#EF4444',
    },
    dangerText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
