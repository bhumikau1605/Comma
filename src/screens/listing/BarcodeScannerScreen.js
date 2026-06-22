import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppwriteService } from '../../services/appwrite';

export default function BarcodeScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScan = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const result = await AppwriteService.lookupBarcode(data);
      if (result) {
        navigation.replace('CreateListing', { prefill: result });
      } else {
        Alert.alert('Not Found', 'Could not find product info. Fill in details manually.', [
          { text: 'Fill Manually', onPress: () => navigation.replace('CreateListing', {}) },
          { text: 'Scan Again', onPress: () => setScanned(false) },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color="#3A3A3A" /></View>;

  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={styles.permText}>📷 Camera permission required</Text>
      <TouchableOpacity style={styles.btn} onPress={requestPermission}>
        <Text style={styles.btnText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : scanned ? (
            <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
              <Text style={styles.rescanText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.hint}>Point camera at a barcode</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const BOX = 250;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F1E8', padding: 24 },
  permText: { fontSize: 16, color: '#3A3A3A', marginBottom: 20 },
  btn: { backgroundColor: '#3A3A3A', borderRadius: 12, padding: 14, paddingHorizontal: 28 },
  btnText: { color: '#fff', fontWeight: '600' },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleRow: { flexDirection: 'row', height: BOX },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanBox: { width: BOX, height: BOX },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#fff', fontSize: 15, opacity: 0.8 },
  rescanBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 14, paddingHorizontal: 28 },
  rescanText: { color: '#3A3A3A', fontWeight: '600' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
