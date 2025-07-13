/**
 * NotificationService - 緊急通知とSOS発信
 * React Native環境での通知送信と緊急連絡
 */

import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert } from 'react-native';
import EmergencyConnect from '../core/EmergencyConnect';
import LocationService from './LocationService';

// 通知の動作設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  static notificationToken = null;
  static isInitialized = false;

  /**
   * 通知サービスを初期化
   */
  static async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing notification service...');

      // 通知権限を要求
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('通知の権限が許可されませんでした');
      }

      // プッシュ通知トークンを取得
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        this.notificationToken = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push notification token:', this.notificationToken);
      }

      this.isInitialized = true;
      console.log('Notification service initialized');
      
      return {
        success: true,
        token: this.notificationToken
      };
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 緊急SOS通知を送信
   */
  static async sendEmergencySOS() {
    try {
      console.log('Sending emergency SOS...');

      // 緊急連絡先を取得
      const contacts = EmergencyConnect.getEmergencyContacts();
      if (contacts.length === 0) {
        throw new Error(EmergencyConnect.ERROR_MESSAGES.NO_EMERGENCY_CONTACTS);
      }

      // 現在位置を取得
      const locationInfo = await LocationService.getDetailedLocationInfo();
      
      // SOS メッセージを作成
      const sosMessage = this.createSOSMessage(locationInfo);

      // 各連絡先に通知を送信
      const results = await Promise.allSettled(
        contacts.map(contact => this.sendToContact(contact, sosMessage, locationInfo))
      );

      // 送信結果を集計
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      console.log(`SOS sent: ${successful} successful, ${failed} failed`);

      // ローカル通知も表示
      await this.showLocalSOSNotification();

      return {
        success: true,
        sentToContacts: contacts.map(contact => contact.id),
        message: sosMessage,
        results: {
          successful,
          failed,
          total: contacts.length
        }
      };
    } catch (error) {
      console.error('Error sending emergency SOS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 個別の連絡先にSOS を送信
   */
  static async sendToContact(contact, message, locationInfo) {
    try {
      console.log(`Sending SOS to ${contact.name} (${contact.phone})`);

      // SMS送信を試行
      const smsResult = await this.sendSMS(contact.phone, message);
      
      // 電話発信の準備（ユーザーの判断で実行）
      const phoneResult = await this.preparePhoneCall(contact.phone);

      return {
        contactId: contact.id,
        contactName: contact.name,
        sms: smsResult,
        phone: phoneResult,
        success: smsResult.success || phoneResult.success
      };
    } catch (error) {
      console.error(`Error sending to contact ${contact.name}:`, error);
      throw error;
    }
  }

  /**
   * SMS メッセージを送信
   */
  static async sendSMS(phoneNumber, message) {
    try {
      // SMS用のURLを構築
      const smsUrl = Platform.select({
        ios: `sms:${phoneNumber}&body=${encodeURIComponent(message)}`,
        android: `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
      });

      // SMS アプリを開く
      const canOpenSMS = await Linking.canOpenURL(smsUrl);
      
      if (canOpenSMS) {
        await Linking.openURL(smsUrl);
        return {
          success: true,
          method: 'SMS',
          phone: phoneNumber
        };
      } else {
        throw new Error('SMS アプリを開けませんでした');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        method: 'SMS',
        phone: phoneNumber,
        error: error.message
      };
    }
  }

  /**
   * 電話発信の準備
   */
  static async preparePhoneCall(phoneNumber) {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const canMakeCall = await Linking.canOpenURL(phoneUrl);
      
      if (canMakeCall) {
        // 電話発信の選択肢をユーザーに提示
        return new Promise((resolve) => {
          Alert.alert(
            '緊急電話発信',
            `${phoneNumber} に電話をかけますか？`,
            [
              {
                text: 'キャンセル',
                style: 'cancel',
                onPress: () => resolve({
                  success: false,
                  method: 'Phone',
                  phone: phoneNumber,
                  cancelled: true
                })
              },
              {
                text: '発信',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await Linking.openURL(phoneUrl);
                    resolve({
                      success: true,
                      method: 'Phone',
                      phone: phoneNumber
                    });
                  } catch (error) {
                    resolve({
                      success: false,
                      method: 'Phone',
                      phone: phoneNumber,
                      error: error.message
                    });
                  }
                }
              }
            ]
          );
        });
      } else {
        throw new Error('電話アプリを開けませんでした');
      }
    } catch (error) {
      console.error('Error preparing phone call:', error);
      return {
        success: false,
        method: 'Phone',
        phone: phoneNumber,
        error: error.message
      };
    }
  }

  /**
   * SOS メッセージを作成
   */
  static createSOSMessage(locationInfo) {
    let message = `🚨🚨 緊急事態発生 🚨🚨\n\n`;
    
    if (locationInfo && locationInfo.success) {
      message += `📍 現在地: ${locationInfo.address}\n`;
      message += `🌐 座標: ${locationInfo.latitude.toFixed(6)}, ${locationInfo.longitude.toFixed(6)}\n`;
      message += `📏 精度: 約${Math.round(locationInfo.accuracy)}m\n`;
      message += `⏰ 発信時刻: ${new Date().toLocaleString('ja-JP')}\n\n`;
      message += `🗺️ 地図で確認: https://maps.google.com/?q=${locationInfo.latitude},${locationInfo.longitude}\n\n`;
    } else {
      message += `⏰ 発信時刻: ${new Date().toLocaleString('ja-JP')}\n`;
      message += `📍 位置情報の取得に失敗しました\n\n`;
    }
    
    message += `📱 EmergencyConnect アプリより自動送信`;

    return message;
  }

  /**
   * ローカル通知を表示
   */
  static async showLocalSOSNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 SOS 送信完了',
          body: '緊急連絡先にSOS信号を送信しました',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // 即座に表示
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  /**
   * カウントダウン通知を表示
   */
  static async showCountdownNotification(seconds) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ SOS カウントダウン',
          body: `${seconds}秒後にSOS信号を送信します`,
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing countdown notification:', error);
    }
  }

  /**
   * 位置更新通知を表示
   */
  static async showLocationUpdateNotification(locationInfo) {
    try {
      if (!locationInfo || !locationInfo.success) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 位置情報を更新',
          body: `現在地: ${locationInfo.address}`,
          sound: null,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing location update notification:', error);
    }
  }

  /**
   * 通知履歴をクリア
   */
  static async clearNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * 通知サービスの状態を取得
   */
  static getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasToken: !!this.notificationToken,
      token: this.notificationToken
    };
  }
}

export default NotificationService;