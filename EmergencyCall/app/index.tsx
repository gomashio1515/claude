import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ScrollView, Switch } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import SMSService from '../src/services/SMSService';
// import EmergencyLockScreenService from '../src/services/EmergencyLockScreenService';
// import PhysicalButtonService from '../src/services/PhysicalButtonService';

export default function Index() {
  const [contacts, setContacts] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [lockScreenEnabled, setLockScreenEnabled] = useState(false);
  const [physicalButtonEnabled, setPhysicalButtonEnabled] = useState(false);

  useEffect(() => {
    loadContacts();
    loadSettings();
    initializeServices();
  }, []);

  const loadSettings = async () => {
    try {
      const lockScreenSetting = await AsyncStorage.getItem('lockScreenEnabled');
      const physicalButtonSetting = await AsyncStorage.getItem('physicalButtonEnabled');
      
      setLockScreenEnabled(lockScreenSetting === 'true');
      setPhysicalButtonEnabled(physicalButtonSetting === 'true');
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };

  const initializeServices = async () => {
    try {
      // TODO: サービス初期化を後で実装
      console.log('サービス初期化準備完了');
    } catch (error) {
      console.error('サービス初期化エラー:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const savedContacts = await AsyncStorage.getItem('emergencyContacts');
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error('連絡先の読み込みエラー:', error);
    }
  };

  const handleEmergencyPress = () => {
    if (contacts.length === 0) {
      Alert.alert(
        "⚠️ 連絡先未設定",
        "緊急連絡先が設定されていません。\n設定画面で連絡先を追加してください。",
        [{ text: "OK" }]
      );
      return;
    }
    
    // 緊急通知メッセージを作成
    const currentTime = new Date().toLocaleString('ja-JP');
    const emergencyMessage = createEmergencyMessage(currentTime);
    
    // 各連絡先への送信をシミュレート
    const notificationDetails = contacts.map(contact => 
      `📱 ${contact.name} (${contact.phoneNumber})\n   → ${emergencyMessage}`
    ).join('\n\n');
    
    Alert.alert(
      "🚨 緊急通知送信",
      `以下の連絡先に緊急通知を送信します：\n\n${notificationDetails}\n\n※現在はテスト表示のみ`,
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "送信実行", 
          style: "destructive",
          onPress: () => executeEmergencyNotification(contacts, emergencyMessage)
        }
      ]
    );
  };

  const createEmergencyMessage = (timestamp) => {
    return `🚨 緊急事態発生 🚨\n\n時刻: ${timestamp}\n場所: 位置情報を取得中...\n\n状況: てんかんの前兆を感じたため、緊急連絡を送信しました。\n\n至急ご連絡ください。`;
  };

  const executeEmergencyNotification = async (contactList, message) => {
    try {
      // 複数連絡先の場合は確認ダイアログを表示
      if (contactList.length > 1) {
        Alert.alert(
          "📱 SMS送信方法",
          "複数の連絡先があります。送信方法を選択してください：",
          [
            { text: "キャンセル", style: "cancel" },
            { 
              text: "まとめて送信", 
              onPress: () => sendEmergencySMSBatch(contactList, message)
            },
            { 
              text: "順次送信", 
              onPress: () => sendEmergencySMSSequential(contactList, message)
            }
          ]
        );
      } else {
        // 1件の場合は直接送信
        await sendEmergencySMSBatch(contactList, message);
      }
    } catch (error) {
      console.error('緊急SMS送信エラー:', error);
      Alert.alert(
        "❌ 送信エラー",
        `緊急SMSの送信に失敗しました:\n${error.message}`,
        [{ text: "確認" }]
      );
    }
  };

  const sendEmergencySMSBatch = async (contactList, message) => {
    try {
      const sendResults = await SMSService.sendEmergencySMS(contactList, message);
      const resultSummary = SMSService.formatSendResults(sendResults);
      
      Alert.alert(
        "📱 SMS送信結果",
        resultSummary,
        [{ text: "確認" }]
      );
    } catch (error) {
      console.error('一括SMS送信エラー:', error);
      Alert.alert(
        "❌ 送信エラー",
        `SMS送信に失敗しました:\n${error.message}`,
        [{ text: "確認" }]
      );
    }
  };

  const sendEmergencySMSSequential = async (contactList, message) => {
    try {
      const sendResults = await SMSService.sendSMSViaSequentialDeepLink(contactList, message);
      const resultSummary = SMSService.formatSendResults(sendResults);
      
      Alert.alert(
        "📱 SMS送信結果（順次）",
        resultSummary,
        [{ text: "確認" }]
      );
    } catch (error) {
      console.error('順次SMS送信エラー:', error);
      Alert.alert(
        "❌ 送信エラー",
        `順次SMS送信に失敗しました:\n${error.message}`,
        [{ text: "確認" }]
      );
    }
  };

  const toggleLockScreen = async (value) => {
    try {
      setLockScreenEnabled(value);
      await AsyncStorage.setItem('lockScreenEnabled', value.toString());
      
      if (value) {
        // TODO: ロック画面サービス実装
        Alert.alert('設定完了', 'ロック画面ボタンが有効になりました\n（実装準備中）');
      } else {
        Alert.alert('設定完了', 'ロック画面ボタンが無効になりました');
      }
    } catch (error) {
      console.error('ロック画面設定エラー:', error);
      Alert.alert('エラー', 'ロック画面の設定に失敗しました');
    }
  };

  const togglePhysicalButton = async (value) => {
    try {
      setPhysicalButtonEnabled(value);
      await AsyncStorage.setItem('physicalButtonEnabled', value.toString());
      
      if (value) {
        // TODO: 物理ボタンサービス実装
        Alert.alert('設定完了', '物理ボタン操作が有効になりました\n（実装準備中）');
      } else {
        Alert.alert('設定完了', '物理ボタン操作が無効になりました');
      }
    } catch (error) {
      console.error('物理ボタン設定エラー:', error);
      Alert.alert('エラー', '物理ボタンの設定に失敗しました');
    }
  };

  const handleTestSMS = async () => {
    if (contacts.length === 0) {
      Alert.alert('エラー', '連絡先が設定されていません');
      return;
    }

    // 最初の連絡先にテストSMS送信
    const testContact = contacts[0];
    
    Alert.alert(
      '📱 SMS テスト',
      `${testContact.name} (${testContact.phoneNumber}) にテストSMSを送信しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '送信', 
          style: 'default',
          onPress: () => SMSService.sendTestSMS(testContact.phoneNumber)
        }
      ]
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowContactForm(true)}
          >
            <Text style={styles.settingsButtonText}>⚙️ 連絡先設定</Text>
          </TouchableOpacity>
          
          {contacts.length > 0 && (
            <TouchableOpacity 
              style={styles.testButton}
              onPress={() => handleTestSMS()}
            >
              <Text style={styles.testButtonText}>📱 SMS テスト</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.instruction}>
          ロック画面ボタンまたは音量ボタンで{'\n'}緊急通知を送信できます
        </Text>
        
        {contacts.length > 0 && (
          <Text style={styles.contactCount}>
            登録済み連絡先: {contacts.length}件
          </Text>
        )}
        
        <View style={styles.settingsContainer}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>🔒 ロック画面ボタン</Text>
            <Switch
              value={lockScreenEnabled}
              onValueChange={toggleLockScreen}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={lockScreenEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>🔘 物理ボタン操作</Text>
            <Switch
              value={physicalButtonEnabled}
              onValueChange={togglePhysicalButton}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={physicalButtonEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <ContactForm 
        visible={showContactForm}
        contacts={contacts}
        onSave={loadContacts}
        onClose={() => setShowContactForm(false)}
      />
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
  settingsButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  contactCount: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  settingsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

function ContactForm({ visible, contacts, onSave, onClose }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const saveContact = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('エラー', '名前と電話番号を入力してください');
      return;
    }

    if (contacts.some(contact => contact.phoneNumber === phoneNumber)) {
      Alert.alert('エラー', 'この電話番号は既に登録されています');
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
    };

    const updatedContacts = [...contacts, newContact];
    
    try {
      await AsyncStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
      setName('');
      setPhoneNumber('');
      onSave();
      Alert.alert('成功', '連絡先を追加しました');
    } catch (error) {
      console.error('保存エラー:', error);
      Alert.alert('エラー', '連絡先の保存に失敗しました');
    }
  };

  const deleteContact = async (contactId) => {
    const updatedContacts = contacts.filter(contact => contact.id !== contactId);
    
    try {
      await AsyncStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
      onSave();
      Alert.alert('成功', '連絡先を削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      Alert.alert('エラー', '連絡先の削除に失敗しました');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={formStyles.container}>
        <View style={formStyles.header}>
          <Text style={formStyles.title}>緊急連絡先設定</Text>
          <TouchableOpacity onPress={onClose} style={formStyles.closeButton}>
            <Text style={formStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={formStyles.content}>
          <View style={formStyles.form}>
            <Text style={formStyles.label}>名前</Text>
            <TextInput
              style={formStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="例: 奥様"
              placeholderTextColor="#95a5a6"
            />

            <Text style={formStyles.label}>電話番号</Text>
            <TextInput
              style={formStyles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="例: 090-1234-5678"
              placeholderTextColor="#95a5a6"
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={formStyles.saveButton} onPress={saveContact}>
              <Text style={formStyles.saveButtonText}>追加</Text>
            </TouchableOpacity>
          </View>

          <View style={formStyles.contactList}>
            <Text style={formStyles.listTitle}>登録済み連絡先 ({contacts.length}件)</Text>
            {contacts.map((contact) => (
              <View key={contact.id} style={formStyles.contactItem}>
                <View style={formStyles.contactInfo}>
                  <Text style={formStyles.contactName}>{contact.name}</Text>
                  <Text style={formStyles.contactPhone}>{contact.phoneNumber}</Text>
                </View>
                <TouchableOpacity 
                  style={formStyles.deleteButton}
                  onPress={() => deleteContact(contact.id)}
                >
                  <Text style={formStyles.deleteButtonText}>削除</Text>
                </TouchableOpacity>
              </View>
            ))}
            {contacts.length === 0 && (
              <Text style={formStyles.emptyText}>連絡先が登録されていません</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactList: {
    margin: 20,
    marginTop: 0,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  contactPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 20,
  },
});
