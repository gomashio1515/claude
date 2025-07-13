/**
 * PowerButtonService - 電源ボタン連続押し検知サービス
 * 
 * リファクタリング改善点:
 * - 定数を静的プロパティに変更（メモリ効率化）
 * - 状態管理を明確化（State Machineパターン適用）
 * - 依存性注入でEmergencyServiceとの結合度を下げる
 * - エラーハンドリングを追加
 * - JSDocでドキュメント化
 */
class PowerButtonService {
  // 【改善1】定数をstatic化してメモリ効率向上
  static PRESS_TIMEOUT_MS = 3000;
  static REQUIRED_PRESS_COUNT = 3;
  
  // 【改善2】状態を明確化
  static States = {
    IDLE: 'idle',
    COUNTING: 'counting',
    TRIGGERED: 'triggered'
  };

  constructor(emergencyService = null) {
    this._pressCount = 0;
    this._pressTimeout = null;
    this._state = PowerButtonService.States.IDLE;
    // 【改善3】依存性注入でテスタビリティ向上
    this._emergencyService = emergencyService;
  }

  /**
   * 電源ボタン押下を処理
   * 【改善4】状態管理を明確化し、エラーハンドリング追加
   */
  triggerPowerButton() {
    try {
      // 既にトリガー済みの場合は無視
      if (this._state === PowerButtonService.States.TRIGGERED) {
        return;
      }

      this._incrementPressCount();
      this._clearExistingTimeout();

      if (this._shouldTriggerEmergency()) {
        this._triggerEmergency();
      } else if (this._isValidPressCount()) {
        this._startTimeout();
      }
    } catch (error) {
      console.error('PowerButtonService: Error in triggerPowerButton:', error);
    }
  }

  /**
   * 【改善5】私的メソッドで処理を分割し、可読性向上
   */
  _incrementPressCount() {
    this._pressCount++;
    this._state = PowerButtonService.States.COUNTING;
  }

  _clearExistingTimeout() {
    if (this._pressTimeout) {
      clearTimeout(this._pressTimeout);
      this._pressTimeout = null;
    }
  }

  _shouldTriggerEmergency() {
    return this._pressCount === PowerButtonService.REQUIRED_PRESS_COUNT;
  }

  _isValidPressCount() {
    return this._pressCount < PowerButtonService.REQUIRED_PRESS_COUNT;
  }

  _startTimeout() {
    this._pressTimeout = setTimeout(() => {
      this._resetToIdle();
    }, PowerButtonService.PRESS_TIMEOUT_MS);
  }

  _triggerEmergency() {
    this._state = PowerButtonService.States.TRIGGERED;
    this._clearExistingTimeout();
    
    // 【改善6】Null Object Patternでエラー回避
    if (this._emergencyService) {
      this._emergencyService.sendEmergencyNotification();
    } else {
      // フォールバック：動的require（テスト時は無効）
      try {
        const EmergencyService = require('./EmergencyService');
        const instance = EmergencyService.getInstance();
        instance.sendEmergencyNotification();
      } catch (error) {
        console.warn('PowerButtonService: EmergencyService not available:', error);
      }
    }
  }

  /**
   * 【改善7】状態リセットを統一
   */
  _resetToIdle() {
    this._pressCount = 0;
    this._state = PowerButtonService.States.IDLE;
    this._clearExistingTimeout();
  }

  // 【改善8】APIを明確化
  getCurrentState() {
    return this._state;
  }

  // テスト用メソッド（APIを明確化）
  getPressCount() {
    return this._pressCount;
  }

  reset() {
    this._resetToIdle();
  }
}

module.exports = PowerButtonService;