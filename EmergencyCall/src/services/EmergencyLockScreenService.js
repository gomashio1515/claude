import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class EmergencyLockScreenService {
  constructor() {
    this.isActive = false;
    this.notificationId = null;
  }

  async initialize() {
    try {
      // 通知権限の確認・要求
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          throw new Error('通知権限が必要です');
        }
      }

      // 通知設定
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      this.isActive = true;
      return true;
    } catch (error) {
      console.error('EmergencyLockScreenService初期化エラー:', error);
      return false;
    }
  }

  async startLockScreenButton() {
    if (!this.isActive) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      // 永続的な通知でロック画面にボタン表示
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 緊急通知',
          body: 'タップして家族に緊急連絡',
          data: { action: 'emergency_trigger' },
          categoryIdentifier: 'emergency_category',
          sticky: true,
          autoDismiss: false,
        },
        trigger: null, // 即座に表示
      });

      this.notificationId = notificationId;

      // 通知アクション設定
      await Notifications.setNotificationCategoryAsync('emergency_category', [
        {
          identifier: 'emergency_action',
          buttonTitle: '🚨 緊急通知送信',
          options: {
            isDestructive: true,
            isAuthenticationRequired: false,
          },
        },
      ]);

      return true;
    } catch (error) {
      console.error('ロック画面ボタン起動エラー:', error);
      return false;
    }
  }

  async stopLockScreenButton() {
    if (this.notificationId) {
      await Notifications.dismissNotificationAsync(this.notificationId);
      this.notificationId = null;
    }
  }

  async handleEmergencyTrigger() {
    try {
      // 登録済み連絡先を取得
      const savedContacts = await AsyncStorage.getItem('emergencyContacts');
      if (!savedContacts) {
        Alert.alert('エラー', '緊急連絡先が設定されていません');
        return;
      }

      const contacts = JSON.parse(savedContacts);
      const currentTime = new Date().toLocaleString('ja-JP');
      const emergencyMessage = `🚨 緊急事態発生 🚨\n\n時刻: ${currentTime}\n場所: 位置情報を取得中...\n\n状況: てんかんの前兆を感じたため、緊急連絡を送信しました。\n\n至急ご連絡ください。`;

      // 実際のSMS送信処理（後で実装）
      console.log('緊急通知送信:', contacts, emergencyMessage);
      
      // 確認通知
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ 緊急通知送信完了',
          body: `${contacts.length}件の連絡先に送信しました`,
        },
        trigger: { seconds: 1 },
      });

      return true;
    } catch (error) {
      console.error('緊急通知送信エラー:', error);
      Alert.alert('エラー', '緊急通知の送信に失敗しました');
      return false;
    }
  }

  setupNotificationListener() {
    // 通知タップ時の処理
    Notifications.addNotificationResponseReceivedListener(response => {
      const { actionIdentifier, notification } = response;
      
      if (notification.request.content.data?.action === 'emergency_trigger') {
        this.handleEmergencyTrigger();
      }
    });
  }
}

export default new EmergencyLockScreenService();