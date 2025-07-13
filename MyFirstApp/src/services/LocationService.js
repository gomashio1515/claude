/**
 * LocationService - 位置情報取得と管理
 * React Native環境でのGPS座標取得と建物情報取得
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import EmergencyConnect from '../core/EmergencyConnect';

class LocationService {
  static isTracking = false;
  static trackingSubscription = null;
  static lastKnownLocation = null;

  /**
   * 位置情報の権限を要求
   */
  static async requestLocationPermission() {
    try {
      console.log('Requesting location permission...');
      
      // フォアグラウンド権限を要求
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        throw new Error('フォアグラウンド位置情報の権限が許可されませんでした');
      }

      // バックグラウンド権限も要求（緊急時の継続追跡用）
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('バックグラウンド位置情報の権限が許可されませんでした（フォアグラウンドのみ利用可能）');
      }

      console.log('Location permission granted');
      return {
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted'
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  }

  /**
   * 現在の位置情報を取得（高精度）
   */
  static async getCurrentPosition() {
    try {
      console.log('Getting current position...');

      // 権限確認
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('位置情報の権限がありません');
      }

      // 高精度で位置情報を取得
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 10000, // 10秒以内の情報を使用
        timeout: 15000,    // 15秒でタイムアウト
      });

      const position = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp
      };

      this.lastKnownLocation = position;
      console.log('Current position obtained:', position);

      return position;
    } catch (error) {
      console.error('Error getting current position:', error);
      
      // 最後に取得した位置情報がある場合はそれを返す
      if (this.lastKnownLocation) {
        console.log('Using last known location:', this.lastKnownLocation);
        return this.lastKnownLocation;
      }

      return {
        success: false,
        error: EmergencyConnect.ERROR_MESSAGES.GEOLOCATION_FAILED,
        details: error.message
      };
    }
  }

  /**
   * 位置情報の精度を検証
   */
  static validatePositionAccuracy(position) {
    if (!position || !position.accuracy) {
      return {
        isValid: false,
        warning: '位置情報の精度が不明です'
      };
    }

    if (position.accuracy > EmergencyConnect.CONSTANTS.LOCATION.ACCURACY_WARNING_THRESHOLD) {
      return {
        isValid: true,
        warning: EmergencyConnect.ERROR_MESSAGES.LOW_ACCURACY_WARNING,
        accuracy: position.accuracy
      };
    }

    return {
      isValid: true,
      warning: null,
      accuracy: position.accuracy
    };
  }

  /**
   * 逆ジオコーディング - 座標から住所を取得
   */
  static async getAddressFromCoordinates(latitude, longitude) {
    try {
      console.log(`Getting address for coordinates: ${latitude}, ${longitude}`);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        
        const formattedAddress = [
          address.country,
          address.region,
          address.city,
          address.district,
          address.street,
          address.streetNumber
        ].filter(Boolean).join(', ');

        return {
          success: true,
          address: formattedAddress,
          details: address
        };
      } else {
        return {
          success: false,
          address: `${latitude}, ${longitude}`,
          error: '住所の取得に失敗しました'
        };
      }
    } catch (error) {
      console.error('Error getting address:', error);
      return {
        success: false,
        address: `${latitude}, ${longitude}`,
        error: error.message
      };
    }
  }

  /**
   * 詳細な位置情報を取得（座標 + 住所）
   */
  static async getDetailedLocationInfo() {
    try {
      // 現在位置を取得
      const position = await this.getCurrentPosition();
      
      if (!position.latitude || !position.longitude) {
        return {
          success: false,
          error: '位置情報の取得に失敗しました'
        };
      }

      // 住所を取得
      const addressInfo = await this.getAddressFromCoordinates(
        position.latitude,
        position.longitude
      );

      // 精度を検証
      const accuracyInfo = this.validatePositionAccuracy(position);

      return {
        success: true,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        address: addressInfo.address,
        addressDetails: addressInfo.details,
        isOutdoor: true, // 屋内検知は別途実装
        timestamp: position.timestamp,
        warning: accuracyInfo.warning
      };
    } catch (error) {
      console.error('Error getting detailed location info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * リアルタイム位置追跡を開始
   */
  static async startLocationTracking() {
    if (this.isTracking) {
      console.log('Location tracking is already active');
      return;
    }

    try {
      console.log('Starting location tracking...');

      // 権限確認
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('位置情報の権限がありません');
      }

      // 位置追跡を開始
      this.trackingSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: EmergencyConnect.CONSTANTS.TIMING.LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10, // 10m移動したら更新
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
      
      return {
        success: true,
        message: '位置追跡を開始しました'
      };
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 位置追跡を停止
   */
  static stopLocationTracking() {
    if (!this.isTracking) {
      return;
    }

    if (this.trackingSubscription) {
      this.trackingSubscription.remove();
      this.trackingSubscription = null;
    }

    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  /**
   * 位置情報の更新を処理
   */
  static handleLocationUpdate(location) {
    const position = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    };

    this.lastKnownLocation = position;
    console.log('Location updated:', position);

    // コールバックで位置更新を通知
    if (EmergencyConnect.callbacks && EmergencyConnect.callbacks.onLocationUpdate) {
      EmergencyConnect.callbacks.onLocationUpdate(position);
    }
  }

  /**
   * 緊急連絡先に位置情報を送信
   */
  static async sendLocationToContacts() {
    try {
      const locationInfo = await this.getDetailedLocationInfo();
      
      if (!locationInfo.success) {
        return {
          success: false,
          error: '位置情報の取得に失敗しました'
        };
      }

      // 緊急連絡先を取得
      const contacts = EmergencyConnect.getEmergencyContacts();
      
      if (contacts.length === 0) {
        return {
          success: false,
          error: EmergencyConnect.ERROR_MESSAGES.NO_EMERGENCY_CONTACTS
        };
      }

      // 位置情報メッセージを作成
      const locationMessage = this.formatLocationMessage(locationInfo);

      console.log('Sending location to contacts:', locationMessage);

      // 実際の送信は NotificationService で処理
      return {
        success: true,
        message: locationMessage,
        sentToContacts: contacts.map(contact => contact.id),
        locationInfo
      };
    } catch (error) {
      console.error('Error sending location to contacts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 位置情報メッセージをフォーマット
   */
  static formatLocationMessage(locationInfo) {
    const { latitude, longitude, address, accuracy } = locationInfo;
    
    let message = `🚨 緊急事態が発生しました\n\n`;
    message += `📍 現在地: ${address}\n`;
    message += `🌐 座標: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n`;
    message += `📏 精度: 約${Math.round(accuracy)}m\n`;
    message += `⏰ 時刻: ${new Date().toLocaleString('ja-JP')}\n\n`;
    message += `Google Maps: https://maps.google.com/?q=${latitude},${longitude}`;

    return message;
  }

  /**
   * 現在の追跡状態を取得
   */
  static getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      lastKnownLocation: this.lastKnownLocation,
      hasSubscription: !!this.trackingSubscription
    };
  }
}

export default LocationService;