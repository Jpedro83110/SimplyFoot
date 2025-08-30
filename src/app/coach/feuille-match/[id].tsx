import { useCallback, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { calculateAgeFromString, formatDateForDisplay } from '@/utils/date.utils';
import { useSession } from '@/hooks/useSession';
import { getTeamList, GetTeamList } from '@/helpers/evenements.helpers';
import useEffectOnce from 'react-use/lib/useEffectOnce';
import { isMobile as isMobileUtils } from '@/utils/style.utils';

type FeuilleMatchParams = {
    id: string;
};

export default function FeuilleMatch() {
    const { id } = useLocalSearchParams<FeuilleMatchParams>();
    const { width } = useWindowDimensions();
    const [customDate, setCustomDate] = useState('');
    const [customLieu, setCustomLieu] = useState('');
    const [customAdversaire, setCustomAdversaire] = useState('');
    const [signCoach, setSignCoach] = useState('');
    const [signArbitre, setSignArbitre] = useState('');
    const [signClubAdv, setSignClubAdv] = useState('');
    const [signDate, setSignDate] = useState('');

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [teamList, setTeamList] = useState<GetTeamList | null>(null);

    const { utilisateur } = useSession();

    const fetchTeamList = useCallback(async () => {
        if (loading) {
            return;
        }

        setLoading(true);

        try {
            const data = await getTeamList({ evenementId: id });
            setTeamList(data);
        } catch (error) {
            setError(error as Error);
        }

        setLoading(false);
    }, [id, loading]);

    useEffectOnce(() => {
        fetchTeamList();
    });

    const isMobile = isMobileUtils(width);

    const displayDate = customDate
        ? formatDateForDisplay({ date: customDate })
        : teamList?.date
          ? formatDateForDisplay({ date: teamList.date })
          : '';
    const displayLieu = customLieu || teamList?.lieu || '';
    const displayAdversaire = customAdversaire || teamList?.adversaires || '';

    const handlePrint = async () => {
        const myRows = teamList?.equipes?.joueurs.map(
            (joueur) =>
                `
                    <tr>
                        <td style="border:1.5px solid #222;padding:14px;min-width:105px;height:32px;font-size:16px;">${joueur.utilisateurs[0].nom}</td>
                        <td style="border:1.5px solid #222;padding:14px;min-width:105px;">${joueur.utilisateurs[0].prenom}</td>
                        <td style="border:1.5px solid #222;padding:14px;min-width:58px;">${calculateAgeFromString(joueur.utilisateurs[0].date_naissance ?? '')}</td>
                        <td style="border:1.5px solid #222;padding:14px;min-width:94px;">${joueur.numero_licence}</td>
                    </tr>
                `,
        );

        const myRowsAdv = Array.from({ length: 12 }).map(
            () =>
                `
                    <tr>
                        <td style="border:1.5px solid #222;padding:14px;min-width:105px;height:32px;"></td>
                        <td style="border:1.5px solid #222;padding:14px;min-width:105px;"></td>
                        <td style="border:1.5px solid #222;padding:14px;min-width:58px;"></td>
                        <td style="border:1.5px solid #222;padding:14px;min-width:94px;"></td>
                    </tr>
                `,
        );

        const html = `
      <style>
        body { font-family: Arial, sans-serif; color:#222; }
        h2 { color: #005faa; text-align:center; }
        th, td { font-size: 16px; }
        .infoswrap { display: flex; flex-direction: row; justify-content: space-between; margin-bottom:20px; }
        .infos { font-size: 16px; }
        .signatures { font-size: 15px; min-width: 290px; margin-left: 40px; }
        .signLabel { font-weight:bold; margin-top:10px; }
        .signBox { border-bottom:1.4px solid #888; width:80%; height:26px; display:inline-block; margin-bottom:10px; }
        .double { display:flex; flex-direction:row; justify-content:space-between; gap:38px; }
        .tableBlock { width:48%; }
        .tableBlock table { width:100%; border-collapse:collapse; margin-bottom: 16px; }
        .tableBlock th { background:#222; color:#fff; padding:8px; font-size:16px; }
        .tableBlock tr { background:#fff; }
        .tableBlock td { background:#f9f9f9; }
        @media print {
          .infoswrap { flex-direction: row; }
          .double { flex-direction:row; }
        }
      </style>
      <h2>Feuille de Match Officielle</h2>
      <div class="infoswrap">
        <div class="infos">
          <b>Date :</b> ${displayDate} &nbsp; | &nbsp; <b>Lieu :</b> ${displayLieu}<br>
          <b>Équipe :</b> ${teamList?.equipes?.nom} &nbsp; | &nbsp; <b>Catégorie :</b> ${teamList?.equipes?.categorie}<br>
          <b>Coach :</b> ${utilisateur?.prenom} ${utilisateur?.nom}<br>
          <b>Adversaire :</b> ${displayAdversaire || '_________________'}
        </div>
        <div class="signatures">
          <div class="signLabel">Coach : <span class="signBox">${signCoach || ''}</span></div><br>
          <div class="signLabel">Arbitre : <span class="signBox">${signArbitre || ''}</span></div><br>
          <div class="signLabel">Représentant club adverse : <span class="signBox">${signClubAdv || ''}</span></div><br>
          <div class="signLabel">Date : <span class="signBox">${signDate || ''}</span></div>
        </div>
      </div>
      <div class="double">
        <div class="tableBlock">
          <table>
            <tr><th colspan="4">${teamList?.equipes?.nom}</th></tr>
            <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Âge</th>
                <th>Licence</th>
            </tr>
            ${myRows?.join('')}
          </table>
        </div>
        <div class="tableBlock">
          <table>
            <tr><th colspan="4">Adversaire : ${displayAdversaire || '_________'}</th></tr>
            <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Âge</th>
                <th>Licence</th>
            </tr>
            ${myRowsAdv?.join('')}
          </table>
        </div>
      </div>
    `;
        try {
            const { uri } = await Print.printToFileAsync({ html });
            await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (e) {
            console.error('Erreur impression:', e);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ marginTop: 40 }} color="#00ff88" />
                <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 10 }}>
                    Chargement de la feuille de match...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.empty}>{error?.message}</Text>
                <TouchableOpacity style={styles.button} onPress={fetchTeamList}>
                    <Text style={styles.buttonText}>🔄 Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📝 Feuille de match</Text>
            <View style={[styles.headerWrap, isMobile ? styles.mobileHeaderWrap : null]}>
                <View style={isMobile ? styles.mobileInfosCol : styles.infosCol}>
                    <View style={isMobile ? styles.mobileField : styles.row}>
                        <Text style={isMobile ? styles.mobileDetail : styles.detail}>Date :</Text>
                        <TextInput
                            value={customDate}
                            onChangeText={(txt) => setCustomDate(txt)}
                            placeholder={
                                teamList?.date
                                    ? formatDateForDisplay({ date: teamList.date }) || 'JJ/MM/AAAA'
                                    : 'JJ/MM/AAAA'
                            }
                            style={[
                                isMobile ? styles.mobileInput : styles.input,
                                { color: '#fff', backgroundColor: isMobile ? '#333' : '#161616' },
                            ]}
                            placeholderTextColor="#fff"
                            keyboardType="default"
                            maxLength={10}
                        />
                    </View>
                    {/* Lieu */}
                    <View style={isMobile ? styles.mobileField : styles.row}>
                        <Text style={isMobile ? styles.mobileDetail : styles.detail}>Lieu :</Text>
                        <TextInput
                            value={customLieu}
                            onChangeText={setCustomLieu}
                            placeholder={teamList?.lieu || 'Lieu'}
                            style={[
                                isMobile ? styles.mobileInput : styles.input,
                                { color: '#fff', backgroundColor: isMobile ? '#333' : '#161616' },
                            ]}
                            placeholderTextColor="#fff"
                        />
                    </View>
                    <Text style={isMobile ? styles.mobileDetail : styles.detail}>
                        Équipe : {teamList?.equipes?.nom || ''}
                    </Text>
                    <Text style={isMobile ? styles.mobileDetail : styles.detail}>
                        Catégorie : {teamList?.equipes?.categorie || ''}
                    </Text>
                    <Text style={isMobile ? styles.mobileDetail : styles.detail}>
                        Coach : {utilisateur?.prenom} {utilisateur?.nom}
                    </Text>
                    {/* Adversaire */}
                    <View style={isMobile ? styles.mobileField : styles.row}>
                        <Text style={isMobile ? styles.mobileDetail : styles.detail}>
                            Adversaire :
                        </Text>
                        <TextInput
                            value={customAdversaire}
                            onChangeText={setCustomAdversaire}
                            placeholder={teamList?.adversaires || 'Adversaire'}
                            style={[
                                isMobile ? styles.mobileInput : styles.input,
                                { color: '#fff', backgroundColor: isMobile ? '#333' : '#161616' },
                            ]}
                            placeholderTextColor="#fff"
                        />
                    </View>
                </View>
                {/* Signatures : version mobile = label au-dessus, input dessous */}
                <View style={isMobile ? styles.mobileSignaturesCol : styles.signaturesCol}>
                    <View style={isMobile ? styles.mobileSignatureField : styles.signatureRow}>
                        <Text
                            style={isMobile ? styles.mobileSignatureLabel : styles.signatureLabel}
                        >
                            Coach :
                        </Text>
                        <TextInput
                            value={signCoach}
                            onChangeText={setSignCoach}
                            style={[isMobile ? styles.mobileSignatureInput : styles.signatureBox]}
                            placeholderTextColor="#fff"
                        />
                    </View>
                    <View style={isMobile ? styles.mobileSignatureField : styles.signatureRow}>
                        <Text
                            style={isMobile ? styles.mobileSignatureLabel : styles.signatureLabel}
                        >
                            Arbitre :
                        </Text>
                        <TextInput
                            value={signArbitre}
                            onChangeText={setSignArbitre}
                            style={[isMobile ? styles.mobileSignatureInput : styles.signatureBox]}
                            placeholderTextColor="#fff"
                        />
                    </View>
                    {/* Champ représentant club adverse : input en dessous sur mobile */}
                    <View style={isMobile ? styles.mobileSignatureField : styles.signatureRow}>
                        <Text
                            style={isMobile ? styles.mobileSignatureLabel : styles.signatureLabel}
                        >
                            Représentant club adverse :
                        </Text>
                        <TextInput
                            value={signClubAdv}
                            onChangeText={setSignClubAdv}
                            style={[isMobile ? styles.mobileSignatureInput : styles.signatureBox]}
                            placeholderTextColor="#fff"
                        />
                    </View>
                    <View style={isMobile ? styles.mobileSignatureField : styles.signatureRow}>
                        <Text
                            style={isMobile ? styles.mobileSignatureLabel : styles.signatureLabel}
                        >
                            Date :
                        </Text>
                        <TextInput
                            value={signDate}
                            onChangeText={setSignDate}
                            style={[isMobile ? styles.mobileSignatureInput : styles.signatureBox]}
                            placeholderTextColor="#fff"
                        />
                    </View>
                </View>
            </View>

            {/* BOUTON */}
            <TouchableOpacity style={styles.button} onPress={handlePrint}>
                <Text style={styles.buttonText}>📄 Imprimer / Télécharger en PDF</Text>
            </TouchableOpacity>

            {/* TABLEAUX */}
            <View style={[styles.tablesWrap, isMobile ? styles.mobileTablesWrap : null]}>
                {/* Bloc équipe à domicile */}
                <View style={[styles.tableBlock, isMobile ? styles.mobileTableBlock : null]}>
                    <View style={styles.headerRow}>
                        <Text
                            style={[styles.headerCell, isMobile ? styles.mobileHeaderCell : null]}
                        >
                            {teamList?.equipes?.nom || ''}
                        </Text>
                    </View>
                    <View style={styles.subHeaderRow}>
                        <Text
                            key={'colA-1'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Nom
                        </Text>
                        <Text
                            key={'colA-2'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Prénom
                        </Text>
                        <Text
                            key={'colA-3'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Âge
                        </Text>
                        <Text
                            key={'colA-4'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Licence
                        </Text>
                    </View>
                    {teamList?.equipes?.joueurs?.map((joueur) => (
                        <View
                            key={`joueur-${joueur.id}`}
                            style={[styles.dataRow, isMobile ? styles.mobileDataRow : null]}
                        >
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}>
                                {joueur.utilisateurs[0]?.nom}
                            </Text>
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}>
                                {joueur.utilisateurs[0]?.prenom}
                            </Text>
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}>
                                {calculateAgeFromString(
                                    joueur.utilisateurs[0]?.date_naissance || '',
                                )}
                            </Text>
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}>
                                {joueur.numero_licence}
                            </Text>
                        </View>
                    ))}
                </View>
                {/* Bloc équipe adverse */}
                <View style={[styles.tableBlock, isMobile ? styles.mobileTableBlock : null]}>
                    <View style={styles.headerRow}>
                        <Text
                            style={[styles.headerCell, isMobile ? styles.mobileHeaderCell : null]}
                        >
                            Adversaire : {displayAdversaire || '_________'}
                        </Text>
                    </View>
                    <View style={styles.subHeaderRow}>
                        <Text
                            key={'colAdv-1'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Nom
                        </Text>
                        <Text
                            key={'colAdv-2'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Prénom
                        </Text>
                        <Text
                            key={'colAdv-3'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Âge
                        </Text>
                        <Text
                            key={'colAdv-4'}
                            style={[styles.cellHeader, isMobile ? styles.mobileCellHeader : null]}
                        >
                            Licence
                        </Text>
                    </View>
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <View
                            key={'adv-' + idx}
                            style={[styles.dataRow, isMobile ? styles.mobileDataRow : null]}
                        >
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}></Text>
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}></Text>
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}></Text>
                            <Text style={[styles.cell, isMobile ? styles.mobileCell : null]}></Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#121212', flex: 1, padding: 20 },
    title: {
        fontSize: 24,
        color: '#00ff88',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    headerWrap: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    infosCol: { flex: 1, minWidth: 240 },
    signaturesCol: { minWidth: 240, marginLeft: 32 },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, flexWrap: 'wrap' },
    detail: { color: '#ccc', fontSize: 16, marginRight: 8, marginVertical: 2 },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#aaa',
        color: '#fff',
        marginHorizontal: 8,
        textAlign: 'center',
        fontSize: 16,
        backgroundColor: '#161616',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    signatureRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    signatureLabel: {
        color: '#ccc',
        minWidth: 100,
        fontWeight: 'bold',
        fontSize: 15,
        marginRight: 8,
    },
    signatureBox: {
        borderBottomWidth: 1,
        borderBottomColor: '#fff',
        flex: 1,
        height: 32,
        color: '#fff',
        paddingHorizontal: 8,
        marginLeft: 8,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#00ff88',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    tablesWrap: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
    tableBlock: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#00ff88',
        borderRadius: 8,
        marginBottom: 24,
        overflow: 'hidden',
        backgroundColor: '#181818',
    },
    headerRow: { flexDirection: 'row', backgroundColor: '#222' },
    headerCell: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
        flex: 1,
        paddingVertical: 10,
    },
    subHeaderRow: { flexDirection: 'row', backgroundColor: '#444' },
    cellHeader: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        flex: 1,
        paddingVertical: 8,
    },
    dataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#222', minHeight: 36 },
    cell: {
        color: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 16,
        textAlign: 'center',
        flex: 1,
        borderRightWidth: 0.5,
        borderColor: '#222',
    },
    empty: { color: '#888', textAlign: 'center', marginTop: 40, fontStyle: 'italic', fontSize: 15 },
    mobileHeaderWrap: {
        flexDirection: 'column',
        alignItems: 'stretch',
        marginBottom: 16,
        gap: 0,
    },
    mobileInfosCol: {
        width: '100%',
        marginBottom: 12,
    },
    mobileField: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    mobileDetail: {
        color: '#ccc',
        fontSize: 17,
        marginBottom: 3,
        fontWeight: 'bold',
    },
    mobileInput: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#00ff88',
        backgroundColor: '#222',
        borderRadius: 7,
        fontSize: 17,
        color: '#fff',
        width: '100%',
        minHeight: 38,
        marginTop: 1,
        marginBottom: 3,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    mobileSignaturesCol: {
        minWidth: undefined,
        marginLeft: 0,
        width: '100%',
        marginTop: 10,
    },
    mobileSignatureField: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    mobileSignatureLabel: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    mobileSignatureInput: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#00ff88',
        backgroundColor: '#222',
        borderRadius: 7,
        fontSize: 17,
        color: '#fff',
        width: '100%',
        minHeight: 38,
        marginTop: 1,
        marginBottom: 3,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    mobileTablesWrap: {
        flexDirection: 'column',
        gap: 18,
    },
    mobileTableBlock: {
        width: '100%',
        minWidth: undefined,
        marginBottom: 18,
    },
    mobileHeaderCell: {
        fontSize: 17,
        paddingVertical: 9,
    },
    mobileCellHeader: {
        fontSize: 15,
        paddingVertical: 7,
    },
    mobileDataRow: {
        minHeight: 42,
    },
    mobileCell: {
        fontSize: 15,
        paddingVertical: 13,
        minHeight: 42,
    },
});
