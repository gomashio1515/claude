/**
 * ButtonService - 物理ボタンイベント処理
 * React Native環境での音量ボタン検知とSOS発信
 */

import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import EmergencyConnect from '../core/EmergencyConnect';

class ButtonService {
  static isListening = false;
  static listeners = [];

  /**
   * 音量ボタンリスナーを開始
   */
  static startVolumeButtonListener() {
    if (this.isListening) {
      console.log('Volume button listener is already active');
      return;
    }

    this.isListening = true;

    if (Platform.OS === 'ios') {
      // iOS用の音量ボタン検知
      this.startIOSVolumeListener();
    } else if (Platform.OS === 'android') {
      // Android用の音量ボタン検知
      this.startAndroidVolumeListener();
    }

    console.log('Volume button listener started');
  }

  /**
   * 音量ボタンリスナーを停止
   */
  static stopVolumeButtonListener() {
    if (!this.isListening) {
      return;
    }

    // 全てのリスナーを削除
    this.listeners.forEach(listener => {
      if (listener.remove) {
        listener.remove();
      }
    });
    
    this.listeners = [];
    this.isListening = false;
    
    console.log('Volume button listener stopped');
  }

  /**
   * iOS用の音量ボタン検知
   * 注意: iOSでは音量ボタンの完全な制御は制限されているため、
   * 代替手段として画面タップやジェスチャーを併用
   */
  static startIOSVolumeListener() {
    // iOS用の実装
    // 実際のプロダクションでは、ハードウェアボタンの制約により
    // 画面上のSOSボタンやアクセシビリティ機能を活用

    // 開発時はシミュレート用のイベントリスナーを追加
    const volumeUpListener = DeviceEventEmitter.addListener(
      'VolumeButtonPressed',
      (event) => {
        if (event.button === 'volumeUp') {
          this.handleVolumeButtonPress('volumeUp');
        } else if (event.button === 'volumeDown') {
          this.handleVolumeButtonPress('volumeDown');
        }
      }
    );

    this.listeners.push(volumeUpListener);
  }

  /**
   * Android用の音量ボタン検知
   */
  static startAndroidVolumeListener() {
    // Android用の実装
    // react-native-volume-key-listenerなどのライブラリが必要
    
    // 開発時はシミュレート用のイベントリスナーを追加
    const volumeListener = DeviceEventEmitter.addListener(
      'VolumeButtonPressed',
      (event) => {
        this.handleVolumeButtonPress(event.button);
      }
    );

    this.listeners.push(volumeListener);
  }

  /**
   * 音量ボタン押下イベントを処理
   */
  static handleVolumeButtonPress(button) {
    console.log(`Volume button pressed: ${button}`);
    
    try {
      // EmergencyConnectのコアロジックにイベントを渡す
      EmergencyConnect.handleVolumeButtonPress(button);
    } catch (error) {
      console.error('Error handling volume button press:', error);
    }
  }

  /**
   * テスト用: 手動でボタン押下をシミュレート
   */
  static simulateButtonPress(button) {
    console.log(`Simulating button press: ${button}`);
    this.handleVolumeButtonPress(button);
  }

  /**
   * 電源ボタンリスナー（Android限定）
   * 注意: iOSでは電源ボタンの検知は不可能
   */
  static startPowerButtonListener() {
    if (Platform.OS === 'android') {
      // Android用の電源ボタン検知実装
      const powerListener = DeviceEventEmitter.addListener(
        'PowerButtonPressed',
        () => {
          this.handlePowerButtonPress();
        }
      );

      this.listeners.push(powerListener);
    }
  }

  /**
   * 電源ボタン押下イベントを処理
   */
  static handlePowerButtonPress() {
    console.log('Power button pressed');
    
    try {
      EmergencyConnect.handleVolumeButtonPress('power');
    } catch (error) {
      console.error('Error handling power button press:', error);
    }
  }

  /**
   * アクセシビリティ用のジェスチャー検知
   * 物理ボタンが使えない場合の代替手段
   */
  static enableAccessibilityGestures() {
    // 画面を3回タップした場合のSOS発信
    // 長押しジェスチャーでのSOS発信
    // これらは別途GestureHandlerで実装
  }

  /**
   * 現在のリスナー状態を取得
   */
  static getListenerStatus() {
    return {
      isListening: this.isListening,
      activeListeners: this.listeners.length,
      platform: Platform.OS
    };
  }
}

export default ButtonService;