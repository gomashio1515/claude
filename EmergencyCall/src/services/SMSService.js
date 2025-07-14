import SMS from 'react-native-sms';
import { Alert, Linking } from 'react-native';

class SMSService {
  constructor() {
    this.isAvailable = false;
    this.initialize();
  }

  async initialize() {
    try {
      // SMS機能の利用可能性を確認
      this.isAvailable = await SMS.isAvailable();
      console.log('SMS機能利用可能:', this.isAvailable);
    } catch (error) {
      console.error('SMS初期化エラー:', error);
      this.isAvailable = false;
    }
  }

  async sendEmergencySMS(contacts, message) {
    if (!contacts || contacts.length === 0) {
      throw new Error('送信先の連絡先が設定されていません');
    }

    try {
      // SMS機能が利用できない場合は代替手段を使用
      if (!this.isAvailable) {
        return await this.sendSMSViaDeepLink(contacts, message);
      }

      const phoneNumbers = contacts.map(contact => contact.phoneNumber);
      const sendResults = [];

      // 各連絡先にSMS送信
      for (const contact of contacts) {
        try {
          await this.sendSingleSMS(contact.phoneNumber, message);
          sendResults.push({
            contact: contact.name,
            phoneNumber: contact.phoneNumber,
            success: true,
            error: null
          });
        } catch (error) {
          console.error(`SMS送信エラー (${contact.name}):`, error);
          // 失敗した場合はDeepLink方式を試行
          try {
            await this.sendSMSViaDeepLink([contact], message);
            sendResults.push({
              contact: contact.name,
              phoneNumber: contact.phoneNumber,
              success: true,
              error: null,
              method: 'deeplink'
            });
          } catch (deepLinkError) {
            sendResults.push({
              contact: contact.name,
              phoneNumber: contact.phoneNumber,
              success: false,
              error: error.message
            });
          }
        }
      }

      return sendResults;
    } catch (error) {
      console.error('SMS送信処理エラー:', error);
      throw error;
    }
  }

  async sendSingleSMS(phoneNumber, message) {
    return new Promise((resolve, reject) => {
      SMS.send({
        body: message,
        recipients: [phoneNumber],
        successTypes: ['sent', 'queued'],
        allowAndroidSendWithoutReadPermission: true
      }, (completed, cancelled, error) => {
        if (completed) {
          console.log(`SMS送信完了: ${phoneNumber}`);
          resolve(true);
        } else if (cancelled) {
          console.log(`SMS送信キャンセル: ${phoneNumber}`);
          reject(new Error('SMS送信がキャンセルされました'));
        } else if (error) {
          console.error(`SMS送信エラー: ${phoneNumber}`, error);
          reject(new Error(`SMS送信エラー: ${error}`));
        } else {
          reject(new Error('不明なエラーが発生しました'));
        }
      });
    });
  }

  async sendTestSMS(phoneNumber) {
    const testMessage = `🚨 EmergencyCall テストメッセージ 🚨\n\n送信時刻: ${new Date().toLocaleString('ja-JP')}\n\nこれはテスト送信です。\n緊急時にはこのような形式でメッセージが届きます。`;

    try {
      if (this.isAvailable) {
        await this.sendSingleSMS(phoneNumber, testMessage);
        Alert.alert('送信完了', 'テストSMSを送信しました');
      } else {
        // 代替手段を使用
        await this.sendSMSViaDeepLink([{phoneNumber}], testMessage);
        Alert.alert('送信完了', 'テストSMSを送信しました（SMS アプリ経由）');
      }
      return true;
    } catch (error) {
      console.error('テストSMS送信エラー:', error);
      Alert.alert('送信エラー', `テストSMSの送信に失敗しました:\n${error.message}`);
      return false;
    }
  }

  createEmergencyMessage(timestamp, location = null) {
    let message = `🚨 緊急事態発生 🚨\n\n`;
    message += `時刻: ${timestamp}\n`;
    
    if (location) {
      message += `場所: ${location}\n`;
    } else {
      message += `場所: 位置情報を取得中...\n`;
    }
    
    message += `\n状況: てんかんの前兆を感じたため、緊急連絡を送信しました。\n`;
    message += `\n至急ご連絡ください。`;
    
    return message;
  }

  formatSendResults(results) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    let summary = `📱 SMS送信結果\n`;
    summary += `成功: ${successCount}件 / 失敗: ${failCount}件\n\n`;
    
    results.forEach(result => {
      if (result.success) {
        summary += `✅ ${result.contact} (${result.phoneNumber})\n`;
      } else {
        summary += `❌ ${result.contact} (${result.phoneNumber})\n   エラー: ${result.error}\n`;
      }
    });
    
    return summary;
  }

  async sendSMSViaDeepLink(contacts, message) {
    if (!contacts || contacts.length === 0) {
      throw new Error('送信先の連絡先が設定されていません');
    }

    try {
      const sendResults = [];
      
      // 各連絡先に対してSMSアプリを起動
      for (const contact of contacts) {
        try {
          const phoneNumber = contact.phoneNumber.replace(/[^\d+]/g, ''); // 数字と+のみ残す
          const encodedMessage = encodeURIComponent(message);
          
          // SMSアプリを起動するDeepLink
          const smsUrl = `sms:${phoneNumber}?body=${encodedMessage}`;
          
          const canOpen = await Linking.canOpenURL(smsUrl);
          if (canOpen) {
            await Linking.openURL(smsUrl);
            sendResults.push({
              contact: contact.name || 'Unknown',
              phoneNumber: contact.phoneNumber,
              success: true,
              error: null,
              method: 'deeplink'
            });
          } else {
            throw new Error('SMS アプリを起動できませんでした');
          }
        } catch (error) {
          console.error(`DeepLink SMS送信エラー (${contact.name}):`, error);
          sendResults.push({
            contact: contact.name || 'Unknown',
            phoneNumber: contact.phoneNumber,
            success: false,
            error: error.message
          });
        }
      }

      return sendResults;
    } catch (error) {
      console.error('DeepLink SMS送信処理エラー:', error);
      throw error;
    }
  }

  async sendSMSViaSequentialDeepLink(contacts, message) {
    // 複数連絡先を順番に処理する際の待機時間を設ける
    const sendResults = [];
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      try {
        const result = await this.sendSMSViaDeepLink([contact], message);
        sendResults.push(...result);
        
        // 次の送信まで少し待機（ユーザーが操作する時間を確保）
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        sendResults.push({
          contact: contact.name || 'Unknown',
          phoneNumber: contact.phoneNumber,
          success: false,
          error: error.message
        });
      }
    }
    
    return sendResults;
  }
}

export default new SMSService();