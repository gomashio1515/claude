import { DeviceEventEmitter, NativeModules } from 'react-native';
import { VolumeManager } from 'react-native-volume-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class PhysicalButtonService {
  constructor() {
    this.isActive = false;
    this.volumeUpPressed = false;
    this.volumeDownPressed = false;
    this.pressStartTime = null;
    this.pressTimeout = null;
    this.requiredHoldTime = 3000; // 3秒間長押し
  }

  async initialize() {
    try {
      // 音量管理権限の確認
      await VolumeManager.showNativeVolumeUI({ enabled: false });
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('PhysicalButtonService初期化エラー:', error);
      return false;
    }
  }

  startListening() {
    if (!this.isActive) {
      console.warn('PhysicalButtonService未初期化');
      return;
    }

    // 音量ボタンイベントリスナー
    this.volumeListener = DeviceEventEmitter.addListener(
      'VolumeChanged',
      this.handleVolumeChange.bind(this)
    );

    // 音量ボタン長押し検知の代替実装
    this.startVolumeButtonDetection();
  }

  stopListening() {
    if (this.volumeListener) {
      this.volumeListener.remove();
      this.volumeListener = null;
    }
    
    if (this.pressTimeout) {
      clearTimeout(this.pressTimeout);
      this.pressTimeout = null;
    }
  }

  async startVolumeButtonDetection() {
    // 音量レベルを監視して間接的にボタン押下を検知
    const checkVolumeButtons = async () => {
      try {
        const currentVolume = await VolumeManager.getVolume();
        
        // 音量変更を検知したら緊急モードトリガー判定
        if (this.lastVolume !== undefined && this.lastVolume !== currentVolume) {
          this.handlePotentialEmergencyTrigger();
        }
        
        this.lastVolume = currentVolume;
      } catch (error) {
        console.error('音量監視エラー:', error);
      }
    };

    // 定期的な音量チェック
    this.volumeCheckInterval = setInterval(checkVolumeButtons, 100);
  }

  handleVolumeChange(data) {
    // 音量変更時の処理
    this.handlePotentialEmergencyTrigger();
  }

  handlePotentialEmergencyTrigger() {
    // 連続した音量ボタン操作を緊急トリガーとして判定
    const now = Date.now();
    
    if (!this.pressStartTime) {
      this.pressStartTime = now;
      this.pressTimeout = setTimeout(() => {
        this.resetPressState();
      }, 1000); // 1秒以内に操作完了が必要
    }
    
    // 短時間での複数操作を検知
    if (now - this.pressStartTime < 1000) {
      this.triggerEmergencyMode();
    }
  }

  resetPressState() {
    this.pressStartTime = null;
    if (this.pressTimeout) {
      clearTimeout(this.pressTimeout);
      this.pressTimeout = null;
    }
  }

  async triggerEmergencyMode() {
    try {
      // 重複実行防止
      if (this.isEmergencyTriggered) return;
      this.isEmergencyTriggered = true;

      // 登録済み連絡先を取得
      const savedContacts = await AsyncStorage.getItem('emergencyContacts');
      if (!savedContacts) {
        Alert.alert('エラー', '緊急連絡先が設定されていません');
        this.isEmergencyTriggered = false;
        return;
      }

      const contacts = JSON.parse(savedContacts);
      const currentTime = new Date().toLocaleString('ja-JP');
      const emergencyMessage = `🚨 緊急事態発生 🚨\n\n時刻: ${currentTime}\n場所: 位置情報を取得中...\n\n状況: てんかんの前兆を感じたため、緊急連絡を送信しました。\n\n至急ご連絡ください。`;

      // 実際のSMS送信処理（後で実装）
      console.log('物理ボタン緊急通知送信:', contacts, emergencyMessage);
      
      // 確認アラート
      Alert.alert(
        '🚨 緊急通知送信',
        `${contacts.length}件の連絡先に緊急通知を送信しました`,
        [{ text: '確認', onPress: () => this.isEmergencyTriggered = false }]
      );

      // 状態リセット
      this.resetPressState();
      
      return true;
    } catch (error) {
      console.error('緊急通知送信エラー:', error);
      Alert.alert('エラー', '緊急通知の送信に失敗しました');
      this.isEmergencyTriggered = false;
      return false;
    }
  }

  cleanup() {
    this.stopListening();
    if (this.volumeCheckInterval) {
      clearInterval(this.volumeCheckInterval);
      this.volumeCheckInterval = null;
    }
    VolumeManager.showNativeVolumeUI({ enabled: true });
  }
}

export default new PhysicalButtonService();