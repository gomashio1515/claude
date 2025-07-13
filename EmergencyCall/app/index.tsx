import React from "react";
import { Text, View, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function Index() {
  const handleEmergencyPress = () => {
    Alert.alert(
      "🚨 緊急通知",
      "緊急通知が送信されました！\n（テスト用アラート）",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EmergencyCall</Text>
        <Text style={styles.subtitle}>緊急連絡アプリ</Text>
      </View>

      <View style={styles.mainContent}>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleEmergencyPress}
          activeOpacity={0.8}
        >
          <Text style={styles.emergencyButtonText}>🚨</Text>
          <Text style={styles.emergencyButtonLabel}>緊急通知</Text>
          <Text style={styles.emergencyButtonSubtext}>タップして緊急連絡</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.instruction}>
          電源ボタン3回押しでも{'\n'}緊急通知を送信できます
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyButton: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderWidth: 6,
    borderColor: '#c0392b',
  },
  emergencyButtonText: {
    fontSize: 80,
    marginBottom: 10,
  },
  emergencyButtonLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  emergencyButtonSubtext: {
    fontSize: 14,
    color: '#f8f9fa',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  instruction: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
});
