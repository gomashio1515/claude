/**
 * EmergencyConnect - Core Logic for React Native
 * リファクタリング済みのコアロジックをReact Native用に移植
 */

// ===== 定数定義 =====
const CONSTANTS = {
  BUTTONS: {
    VOLUME_UP: 'volumeUp',
    VOLUME_DOWN: 'volumeDown',
    POWER: 'power'
  },
  ACTIONS: {
    TRIPLE_PRESS: 'triplePress',
    LONG_PRESS: 'longPress',
    QUINTUPLET_PRESS: 'quintupletPress'
  },
  TIMING: {
    COUNTDOWN_DURATION: 3000,
    LOCATION_UPDATE_INTERVAL: 30000,
    BATTERY_LOW_UPDATE_INTERVAL: 120000,
    MAX_BUTTON_INTERVAL: 5000
  },
  BATTERY: {
    LOW_THRESHOLD: 20
  },
  LOCATION: {
    ACCURACY_WARNING_THRESHOLD: 30
  }
};

// エラーメッセージを集約
const ERROR_MESSAGES = {
  INVALID_BUTTON_CONFIG: '無効なボタン設定です',
  INVALID_PHONE_FORMAT: '無効な電話番号形式です',
  NO_EMERGENCY_CONTACTS: '緊急連絡先が登録されていません',
  NETWORK_DISCONNECTED: 'ネットワークに接続されていません',
  GEOLOCATION_FAILED: '位置情報の取得に失敗しました',
  LOW_ACCURACY_WARNING: '位置情報の精度が低い可能性があります'
};

// ===== 状態管理クラス =====
class EmergencyState {
  constructor() {
    this.reset();
  }

  reset() {
    this.buttonConfig = null;
    this.emergencyContacts = [];
    this.appState = 'active';
    this.networkStatus = true;
    this.batteryLevel = 100;
    this.locationUpdates = [];
    this.locationTrackingActive = false;
    this.sosState = this.createInitialSOSState();
    this.uiState = this.createInitialUIState();
    this.offlineData = null;
    this.buttonPresses = [];
    this.callbacks = {
      onSOSTriggered: null,
      onLocationUpdate: null,
      onContactNotified: null
    };
  }

  createInitialSOSState() {
    return {
      initiated: false,
      sent: false,
      timestamp: null,
      emergencyOverride: false,
      crashResistant: false
    };
  }

  createInitialUIState() {
    return {
      showCancelButton: false,
      cancelButtonVisible: false
    };
  }

  // コールバック登録（React Native UI連携用）
  setCallback(type, callback) {
    this.callbacks[type] = callback;
  }

  // 深いコピーを返すヘルパーメソッド
  getSOSStateCopy() {
    return JSON.parse(JSON.stringify(this.sosState));
  }

  getUIStateCopy() {
    return JSON.parse(JSON.stringify(this.uiState));
  }
}

// グローバル状態インスタンス
const state = new EmergencyState();

// ===== バリデーション関数群 =====
class Validators {
  static isValidButton(button) {
    return Object.values(CONSTANTS.BUTTONS).includes(button);
  }

  static isValidAction(action) {
    return Object.values(CONSTANTS.ACTIONS).includes(action);
  }

  static isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^[0-9-]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  }

  static isValidButtonConfig(config) {
    return config && 
           typeof config === 'object' && 
           this.isValidButton(config.button) && 
           this.isValidAction(config.action);
  }

  static isValidContact(contact) {
    return contact &&
           typeof contact === 'object' &&
           contact.id &&
           contact.name &&
           this.isValidPhoneNumber(contact.phone);
  }

  static isLowAccuracy(position) {
    return position.accuracy > CONSTANTS.LOCATION.ACCURACY_WARNING_THRESHOLD;
  }

  static isLowBattery(batteryLevel) {
    return batteryLevel <= CONSTANTS.BATTERY.LOW_THRESHOLD;
  }
}

// ===== エラーハンドリング統一クラス =====
class ErrorHandler {
  static createError(message) {
    return new Error(message);
  }

  static createSuccessResult(data = {}) {
    return { success: true, ...data };
  }

  static createFailureResult(error, data = {}) {
    return { success: false, error, ...data };
  }

  static createWarningResult(warning, data = {}) {
    return { warning, ...data };
  }
}

// ===== ユーティリティ関数群 =====
class Utils {
  static getCurrentTimestamp() {
    return new Date().toISOString();
  }

  static calculateIntervals(timestamps) {
    if (timestamps.length < 2) return [];
    
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }
    return intervals;
  }

  static hasIrregularInterval(intervals, maxInterval = CONSTANTS.TIMING.MAX_BUTTON_INTERVAL) {
    return intervals.some(interval => interval >= maxInterval);
  }

  static createLocationUpdate(latitude, longitude) {
    return {
      timestamp: Date.now(),
      latitude,
      longitude
    };
  }
}

// ===== カスタマイズ可能SOS発信機能 =====
class SOSButtonManager {
  static setButtonConfig(config) {
    if (!Validators.isValidButtonConfig(config)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_BUTTON_CONFIG);
    }
    
    state.buttonConfig = { ...config };
    return true;
  }

  static getButtonConfig() {
    return state.buttonConfig;
  }
}

class EmergencyContactManager {
  static setContacts(contacts) {
    for (const contact of contacts) {
      if (!Validators.isValidContact(contact)) {
        throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_PHONE_FORMAT);
      }
    }
    
    state.emergencyContacts = [...contacts];
    return true;
  }

  static getContacts() {
    return [...state.emergencyContacts];
  }

  static clearAll() {
    state.emergencyContacts = [];
  }

  static addContact(contact) {
    if (!Validators.isValidContact(contact)) {
      throw ErrorHandler.createError(ERROR_MESSAGES.INVALID_PHONE_FORMAT);
    }
    
    state.emergencyContacts.push({ ...contact });
    return true;
  }

  static validate() {
    if (state.emergencyContacts.length === 0) {
      return {
        isValid: false,
        message: ERROR_MESSAGES.NO_EMERGENCY_CONTACTS
      };
    }
    
    return {
      isValid: true,
      message: 'OK'
    };
  }

  static hasContacts() {
    return state.emergencyContacts.length > 0;
  }
}

class SOSService {
  static async trigger() {
    if (!EmergencyContactManager.hasContacts()) {
      return ErrorHandler.createFailureResult(ERROR_MESSAGES.NO_EMERGENCY_CONTACTS);
    }
    
    if (!state.networkStatus) {
      return ErrorHandler.createFailureResult(ERROR_MESSAGES.NETWORK_DISCONNECTED);
    }
    
    // SOS発信実行
    state.sosState.sent = true;
    state.sosState.timestamp = Utils.getCurrentTimestamp();
    
    // React Native UIにコールバック通知
    if (state.callbacks.onSOSTriggered) {
      state.callbacks.onSOSTriggered(state.sosState);
    }
    
    return ErrorHandler.createSuccessResult({
      notifiedContacts: EmergencyContactManager.getContacts(),
      backgroundExecution: state.appState === 'background'
    });
  }
}

// ===== 誤発信防止機能 =====
class MisFirePreventionService {
  static initiateSOS() {
    state.sosState.initiated = true;
    state.uiState.showCancelButton = true;
    state.uiState.cancelButtonVisible = true;
    
    // カウントダウン後の自動発信
    const countdownTimer = setTimeout(() => {
      if (state.sosState.initiated) {
        SOSService.trigger();
      }
    }, CONSTANTS.TIMING.COUNTDOWN_DURATION);
    
    // タイマーIDを保存（キャンセル用）
    state.countdownTimer = countdownTimer;
    
    return {
      countdownStarted: true,
      countdownDuration: CONSTANTS.TIMING.COUNTDOWN_DURATION / 1000
    };
  }

  static cancel() {
    if (state.countdownTimer) {
      clearTimeout(state.countdownTimer);
      state.countdownTimer = null;
    }
    
    state.sosState.initiated = false;
    state.uiState.showCancelButton = false;
    state.uiState.cancelButtonVisible = false;
    
    return ErrorHandler.createSuccessResult({
      sosCancelled: true
    });
  }

  static validateButtonSequence() {
    if (!state.buttonConfig) {
      return {
        isValidSOS: false,
        reason: 'ボタン設定なし'
      };
    }
    
    if (state.buttonPresses.length === 0) {
      return {
        isValidSOS: false,
        reason: 'ボタン押下なし'
      };
    }
    
    const lastPress = state.buttonPresses[state.buttonPresses.length - 1];
    if (lastPress.button !== state.buttonConfig.button) {
      return {
        isValidSOS: false,
        reason: '設定と異なるボタン'
      };
    }
    
    return this.validatePressIntervals();
  }

  static validatePressIntervals() {
    if (state.buttonPresses.length < 2) {
      return {
        isValidSOS: true,
        isFalsePositive: false
      };
    }
    
    const timestamps = state.buttonPresses.map(press => press.timestamp);
    const intervals = Utils.calculateIntervals(timestamps);
    
    if (Utils.hasIrregularInterval(intervals)) {
      return {
        isValidSOS: false,
        isFalsePositive: true,
        reason: '不規則な押下パターン'
      };
    }
    
    return {
      isValidSOS: true,
      isFalsePositive: false
    };
  }
}

// ===== システム状態管理 =====
class SystemStateManager {
  static setAppState(newState) {
    state.appState = newState;
  }

  static setNetworkStatus(status) {
    state.networkStatus = status;
  }

  static setBatteryLevel(level) {
    state.batteryLevel = level;
  }

  static getSOSState() {
    return state.getSOSStateCopy();
  }

  static getUIState() {
    return state.getUIStateCopy();
  }

  static setCallback(type, callback) {
    state.setCallback(type, callback);
  }
}

// ===== React Native用のボタンイベントハンドラー =====
class ButtonEventHandler {
  static handleVolumeButtonPress(button) {
    const timestamp = Date.now();
    
    // ボタン押下を記録
    if (!state.buttonPresses) {
      state.buttonPresses = [];
    }
    
    state.buttonPresses.push({
      button,
      timestamp
    });
    
    // 古い押下記録を削除（10秒以内のもののみ保持）
    const cutoffTime = timestamp - 10000;
    state.buttonPresses = state.buttonPresses.filter(press => press.timestamp > cutoffTime);
    
    // SOS条件をチェック
    const validation = MisFirePreventionService.validateButtonSequence();
    if (validation.isValidSOS) {
      MisFirePreventionService.initiateSOS();
    }
  }
}

// ===== 公開API =====
const EmergencyConnect = {
  // 設定管理
  setButtonConfig: SOSButtonManager.setButtonConfig,
  getButtonConfig: SOSButtonManager.getButtonConfig,
  setEmergencyContacts: EmergencyContactManager.setContacts,
  getEmergencyContacts: EmergencyContactManager.getContacts,
  addEmergencyContact: EmergencyContactManager.addContact,
  clearAllContacts: EmergencyContactManager.clearAll,
  validateEmergencyContacts: EmergencyContactManager.validate,
  
  // SOS機能
  triggerSOS: SOSService.trigger,
  initiateSOS: MisFirePreventionService.initiateSOS,
  cancelSOS: MisFirePreventionService.cancel,
  
  // 状態管理
  getSOSState: SystemStateManager.getSOSState,
  getUIState: SystemStateManager.getUIState,
  setAppState: SystemStateManager.setAppState,
  setNetworkStatus: SystemStateManager.setNetworkStatus,
  setBatteryLevel: SystemStateManager.setBatteryLevel,
  
  // コールバック設定
  setCallback: SystemStateManager.setCallback,
  
  // イベントハンドラー
  handleVolumeButtonPress: ButtonEventHandler.handleVolumeButtonPress,
  
  // 定数
  CONSTANTS,
  ERROR_MESSAGES
};

export default EmergencyConnect;