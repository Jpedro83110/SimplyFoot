import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
    Switch,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const demoMode = true;

export default function Decharge() {
    const [loading, setLoading] = useState(true);
    const [mineur, setMineur] = useState(true);
    const [parentNom, setParentNom] = useState('');
    const [parentPrenom, setParentPrenom] = useState('');
    const [accepte, setAccepte] = useState(false);
    const [initiales, setInitiales] = useState('');
    const [dechargeExistante, setDechargeExistante] = useState(false);
    const joueurId = 'demo-joueur-id'; // remplacer par l'ID réel de l'utilisateur connecté

    useEffect(() => {
        async function fetchDecharge() {
            if (demoMode) {
                setMineur(true);
                setParentNom('Baruc');
                setParentPrenom('Jérémy');
                setAccepte(true);
                setInitiales('JB');
                setDechargeExistante(true);
                setLoading(false);
            } else {
                const { data, error } = await supabase
                    .from('decharges_generales')
                    .select('*')
                    .eq('joueur_id', joueurId)
                    .single();

                if (data) {
                    setMineur(data.mineur);
                    setParentNom(data.parent_nom || '');
                    setParentPrenom(data.parent_prenom || '');
                    setAccepte(data.accepte_transport);
                    setInitiales(data.signature_initiales || '');
                    setDechargeExistante(true);
                }

                setLoading(false);
            }
        }

        fetchDecharge();
    }, []);

    const enregistrer = async () => {
        if (mineur && (!parentNom || !parentPrenom)) {
            Alert.alert('Erreur', 'Merci de renseigner le nom et prénom du parent ou tuteur.');
            return;
        }

        if (accepte && initiales.trim().length < 2) {
            Alert.alert('Erreur', 'Merci de saisir vos initiales pour signature.');
            return;
        }

        const payload = {
            joueur_id: joueurId,
            mineur,
            parent_nom: mineur ? parentNom : null,
            parent_prenom: mineur ? parentPrenom : null,
            accepte_transport: accepte,
            signature_initiales: accepte ? initiales : null,
        };

        if (demoMode) {
            Alert.alert('✅ Enregistré (mode démo)');
            return;
        }

        const { error } = await supabase
            .from('decharges_generales')
            .upsert(payload, { onConflict: ['joueur_id'] });

        if (error) Alert.alert('Erreur', error.message);
        else Alert.alert('✅ Décharge enregistrée');
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🧾 Décharge parentale</Text>

            <View style={styles.section}>
                <Text style={styles.label}>L'enfant est-il mineur ?</Text>
                <Switch value={mineur} onValueChange={setMineur} />
            </View>

            {mineur && (
                <>
                    <Text style={styles.label}>Nom du parent/tuteur :</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom"
                        value={parentNom}
                        onChangeText={setParentNom}
                        placeholderTextColor="#888"
                    />

                    <Text style={styles.label}>Prénom du parent/tuteur :</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Prénom"
                        value={parentPrenom}
                        onChangeText={setParentPrenom}
                        placeholderTextColor="#888"
                    />
                </>
            )}

            <View style={styles.section}>
                <Text style={styles.label}>
                    Autorisez-vous le transport par un parent ou membre du staff ?
                </Text>
                <Switch value={accepte} onValueChange={setAccepte} />
            </View>

            {accepte && (
                <>
                    <Text style={styles.legal}>
                        En saisissant vos initiales ci-dessous, vous confirmez votre accord pour que
                        votre enfant soit conduit par un autre parent ou membre du staff. Ceci
                        constitue une signature électronique légalement valable.
                    </Text>
                    <Text style={styles.label}>Initiales (signature) :</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex : JB"
                        value={initiales}
                        onChangeText={setInitiales}
                        placeholderTextColor="#888"
                        maxLength={6}
                    />
                </>
            )}

            <TouchableOpacity style={styles.button} onPress={enregistrer}>
                <Text style={styles.buttonText}>
                    {dechargeExistante ? 'Modifier' : 'Enregistrer'} la décharge
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        color: '#ccc',
        marginTop: 20,
    },
    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    section: {
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    legal: {
        marginTop: 20,
        color: '#aaa',
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: {
        color: '#111',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
