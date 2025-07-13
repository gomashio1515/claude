/**
 * TestableLocationService - テスト可能な位置情報管理サービス
 * 
 * リファクタリング改善点:
 * - 不変性を保持するためのObject.freeze適用
 * - 位置情報の検証機能追加
 * - エラーハンドリング強化
 * - キャッシュ機能の明確化
 * - 型安全性の向上
 */
class TestableLocationService {
  constructor() {
    this._currentLocation = null;
    this._lastKnownLocation = null;
    this._isLocationUnavailable = false;
    
    // 【改善1】位置情報の形式を定義
    this._locationSchema = {
      latitude: 'number',
      longitude: 'number'
    };
  }

  /**
   * 現在位置を設定
   * 【改善2】バリデーション追加とimmutable化
   */
  setCurrentLocation(location) {
    try {
      const validatedLocation = this._validateLocation(location);
      
      // 【改善3】不変性を保持
      this._currentLocation = validatedLocation ? Object.freeze({...validatedLocation}) : null;
      
      // 【改善4】キャッシュ戦略を明確化
      if (validatedLocation) {
        this._updateLastKnownLocation(validatedLocation);
      }
    } catch (error) {
      console.warn('LocationService: Invalid location data:', error.message);
      this._currentLocation = null;
    }
  }

  /**
   * 最後の既知位置を設定
   * 【改善5】設定時のバリデーション追加
   */
  setLastKnownLocation(location) {
    try {
      const validatedLocation = this._validateLocation(location);
      this._lastKnownLocation = validatedLocation ? Object.freeze({...validatedLocation}) : null;
    } catch (error) {
      console.warn('LocationService: Invalid last known location:', error.message);
      this._lastKnownLocation = null;
    }
  }

  /**
   * 位置情報取得不可フラグの設定
   * 【改善6】状態変更時のログ追加
   */
  setLocationUnavailable(unavailable) {
    const previousState = this._isLocationUnavailable;
    this._isLocationUnavailable = Boolean(unavailable);
    
    if (previousState !== this._isLocationUnavailable) {
      console.log(`LocationService: Availability changed to ${!this._isLocationUnavailable}`);
    }
  }

  /**
   * 現在位置を取得
   * 【改善7】取得時の状態チェック強化
   */
  getCurrentLocation() {
    if (this._isLocationUnavailable) {
      return null;
    }
    
    // 【改善8】防御的コピーで不変性保持
    return this._currentLocation ? {...this._currentLocation} : null;
  }

  getLastKnownLocation() {
    return this._lastKnownLocation ? {...this._lastKnownLocation} : null;
  }

  /**
   * 最適な位置情報を取得
   * 【改善9】フォールバック戦略を明確化
   */
  getBestAvailableLocation() {
    // 優先順位: 現在位置 > 最後の既知位置 > null
    const current = this.getCurrentLocation();
    if (current && this._isValidLocationData(current)) {
      return current;
    }
    
    const lastKnown = this.getLastKnownLocation();
    if (lastKnown && this._isValidLocationData(lastKnown)) {
      return lastKnown;
    }
    
    return null;
  }

  /**
   * 【改善10】プライベートメソッドでロジック分離
   */
  _validateLocation(location) {
    if (!location) {
      return null;
    }
    
    if (!this._isValidLocationData(location)) {
      throw new Error('Invalid location format: requires latitude and longitude');
    }
    
    return location;
  }

  _isValidLocationData(location) {
    return location && 
           typeof location.latitude === 'number' && 
           typeof location.longitude === 'number' &&
           this._isValidCoordinate(location.latitude, location.longitude);
  }

  _isValidCoordinate(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  _updateLastKnownLocation(location) {
    this._lastKnownLocation = Object.freeze({...location});
  }

  /**
   * 【改善11】デバッグ情報取得メソッド追加
   */
  getStatus() {
    return {
      hasCurrentLocation: !!this._currentLocation,
      hasLastKnownLocation: !!this._lastKnownLocation,
      isLocationUnavailable: this._isLocationUnavailable,
      hasBestLocation: !!this.getBestAvailableLocation()
    };
  }

  // テスト用メソッド（改善済み）
  reset() {
    this._currentLocation = null;
    this._lastKnownLocation = null;
    this._isLocationUnavailable = false;
  }
}

module.exports = TestableLocationService;