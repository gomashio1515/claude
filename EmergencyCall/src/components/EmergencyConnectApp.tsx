/**
 * EmergencyConnectApp - メインアプリコンポーネント
 * EmergencyConnectの全機能を統合したReact Nativeアプリ
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Services
import EmergencyConnect from '../core/EmergencyConnect';
import ButtonService from '../services/ButtonService';
import LocationService from '../services/LocationService';
import NotificationService from '../services/NotificationService';

// Components
import CountdownModal from './CountdownModal';
import ContactList from './ContactList';
import SettingsScreen from './SettingsScreen';

interface EmergencyState {
  initiated: boolean;
  sent: boolean;
  timestamp: string | null;
}

interface UIState {
  showCancelButton: boolean;
  cancelButtonVisible: boolean;
}

const EmergencyConnectApp: React.FC = () => {
  // State管理
  const [isInitialized, setIsInitialized] = useState(false);
  const [sosState, setSOSState] = useState<EmergencyState>({
    initiated: false,
    sent: false,
    timestamp: null
  });
  const [uiState, setUIState] = useState<UIState>({
    showCancelButton: false,
    cancelButtonVisible: false
  });
  const [currentScreen, setCurrentScreen] = useState<'main' | 'contacts' | 'settings'>('main');
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [buttonConfig, setButtonConfig] = useState<any>(null);

  /**
   * アプリ初期化
   */
  const initializeApp = useCallback(async () => {
    try {
      console.log('Initializing EmergencyConnect App...');

      // 通知サービス初期化（エラーを無視）
      try {
        await NotificationService.initialize();
      } catch (notificationError) {
        console.warn('Notification service initialization failed:', notificationError);
      }

      // 位置情報権限要求
      await LocationService.requestLocationPermission();

      // 物理ボタンリスナー開始
      ButtonService.startVolumeButtonListener();

      // EmergencyConnectコールバック設定
      EmergencyConnect.setCallback('onSOSTriggered', handleSOSTriggered);
      EmergencyConnect.setCallback('onLocationUpdate', handleLocationUpdate);

      // 初期設定読み込み
      loadSettings();

      setIsInitialized(true);
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('初期化エラー', '初期化に失敗しました。アプリを再起動してください。');
    }
  }, []);

  /**
   * 設定を読み込み
   */
  const loadSettings = useCallback(() => {
    try {
      const currentContacts = EmergencyConnect.getEmergencyContacts();
      const currentButtonConfig = EmergencyConnect.getButtonConfig();
      
      setContacts(currentContacts);
      setButtonConfig(currentButtonConfig);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  /**
   * SOS発信イベントハンドラー
   */
  const handleSOSTriggered = useCallback((state: EmergencyState) => {
    console.log('SOS triggered:', state);
    setSOSState(state);

    // 通知サービスでSOS送信（エラーを無視）
    try {
      NotificationService.sendEmergencySOS();
    } catch (error) {
      console.warn('SOS notification failed:', error);
    }
  }, []);

  /**
   * 位置情報更新ハンドラー
   */
  const handleLocationUpdate = useCallback((location: any) => {
    console.log('Location updated:', location);
    setLocationInfo(location);
  }, []);

  /**
   * 手動SOSボタン押下
   */
  const handleManualSOS = useCallback(() => {
    try {
      Alert.alert(
        '緊急SOS',
        '緊急事態ですか？SOSを発信しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel'
          },
          {
            text: 'SOS発信',
            style: 'destructive',
            onPress: () => {
              const result = EmergencyConnect.initiateSOS();
              if (result.countdownStarted) {
                setUIState({
                  showCancelButton: true,
                  cancelButtonVisible: true
                });
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error triggering manual SOS:', error);
      Alert.alert('エラー', 'SOS発信に失敗しました。');
    }
  }, []);

  /**
   * SOSキャンセル
   */
  const handleCancelSOS = useCallback(() => {
    try {
      const result = EmergencyConnect.cancelSOS();
      if (result.success) {
        setUIState({
          showCancelButton: false,
          cancelButtonVisible: false
        });
        setSOSState({
          initiated: false,
          sent: false,
          timestamp: null
        });
      }
    } catch (error) {
      console.error('Error cancelling SOS:', error);
    }
  }, []);

  /**
   * 物理ボタンテスト
   */
  const handleTestVolumeButton = useCallback(() => {
    Alert.alert(
      'ボタンテスト',
      'どのボタンをテストしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '音量Up',
          onPress: () => ButtonService.simulateButtonPress('volumeUp')
        },
        {
          text: '音量Down',
          onPress: () => ButtonService.simulateButtonPress('volumeDown')
        }
      ]
    );
  }, []);

  /**
   * 位置情報テスト
   */
  const handleTestLocation = useCallback(async () => {
    try {
      const location = await LocationService.getDetailedLocationInfo();
      if (location.success) {
        Alert.alert(
          '現在位置',
          `住所: ${location.address}\n座標: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n精度: ${Math.round(location.accuracy)}m`
        );
        setLocationInfo(location);
      } else {
        Alert.alert('エラー', location.error || '位置情報の取得に失敗しました。');
      }
    } catch (error) {
      console.error('Error testing location:', error);
      Alert.alert('エラー', '位置情報の取得に失敗しました。');
    }
  }, []);

  // アプリ初期化（コンポーネントマウント時）
  useEffect(() => {
    initializeApp();

    // クリーンアップ
    return () => {
      ButtonService.stopVolumeButtonListener();
      LocationService.stopLocationTracking();
    };
  }, [initializeApp]);

  // 設定変更の監視
  useEffect(() => {
    loadSettings();
  }, [currentScreen, loadSettings]);

  /**
   * メイン画面のレンダリング
   */
  const renderMainScreen = () => (
    <ScrollView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={48} color="#FF3B30" />
        <Text style={styles.title}>EmergencyConnect</Text>
        <Text style={styles.subtitle}>緊急時SOS発信アプリ</Text>
      </View>

      {/* SOS状態表示 */}
      {sosState.sent && (
        <View style={styles.sosStatus}>
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          <Text style={styles.sosStatusText}>
            SOS送信完了 ({new Date(sosState.timestamp!).toLocaleString('ja-JP')})
          </Text>
        </View>
      )}

      {/* メイン SOS ボタン */}
      <TouchableOpacity
        style={[styles.sosButton, sosState.initiated && styles.sosButtonActive]}
        onPress={handleManualSOS}
        disabled={sosState.initiated}
      >
        <Ionicons name="warning" size={64} color="white" />
        <Text style={styles.sosButtonText}>
          {sosState.initiated ? 'SOS発信中...' : 'SOS発信'}
        </Text>
      </TouchableOpacity>

      {/* キャンセルボタン */}
      {uiState.showCancelButton && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSOS}>
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>
      )}

      {/* 設定状況 */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>設定状況</Text>
        
        <View style={styles.statusItem}>
          <Ionicons name="people" size={20} color="#007AFF" />
          <Text style={styles.statusText}>
            緊急連絡先: {contacts.length}件登録済み
          </Text>
        </View>

        <View style={styles.statusItem}>
          <Ionicons name="hardware-chip" size={20} color="#007AFF" />
          <Text style={styles.statusText}>
            物理ボタン: {buttonConfig ? `${buttonConfig.button} (${buttonConfig.action})` : '未設定'}
          </Text>
        </View>

        {locationInfo && (
          <View style={styles.statusItem}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.statusText}>
              位置情報: 取得済み (精度: {Math.round(locationInfo.accuracy)}m)
            </Text>
          </View>
        )}
      </View>

      {/* テスト機能 */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>テスト機能</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={handleTestVolumeButton}>
          <Ionicons name="volume-high" size={20} color="#007AFF" />
          <Text style={styles.testButtonText}>物理ボタンテスト</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={handleTestLocation}>
          <Ionicons name="location-outline" size={20} color="#007AFF" />
          <Text style={styles.testButtonText}>位置情報テスト</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  /**
   * 画面切り替え処理
   */
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'contacts':
        return (
          <ContactList
            contacts={contacts}
            onContactsChange={(newContacts) => {
              EmergencyConnect.setEmergencyContacts(newContacts);
              setContacts(newContacts);
            }}
            onBack={() => setCurrentScreen('main')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            buttonConfig={buttonConfig}
            onButtonConfigChange={(newConfig) => {
              EmergencyConnect.setButtonConfig(newConfig);
              setButtonConfig(newConfig);
            }}
            onBack={() => setCurrentScreen('main')}
          />
        );
      default:
        return renderMainScreen();
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="hourglass" size={48} color="#007AFF" />
        <Text style={styles.loadingText}>初期化中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* メイン画面 */}
      {renderCurrentScreen()}

      {/* タブナビゲーション */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, currentScreen === 'main' && styles.tabItemActive]}
          onPress={() => setCurrentScreen('main')}
        >
          <Ionicons
            name="home"
            size={24}
            color={currentScreen === 'main' ? '#FF3B30' : '#8E8E93'}
          />
          <Text style={[styles.tabText, currentScreen === 'main' && styles.tabTextActive]}>
            ホーム
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentScreen === 'contacts' && styles.tabItemActive]}
          onPress={() => setCurrentScreen('contacts')}
        >
          <Ionicons
            name="people"
            size={24}
            color={currentScreen === 'contacts' ? '#FF3B30' : '#8E8E93'}
          />
          <Text style={[styles.tabText, currentScreen === 'contacts' && styles.tabTextActive]}>
            連絡先
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentScreen === 'settings' && styles.tabItemActive]}
          onPress={() => setCurrentScreen('settings')}
        >
          <Ionicons
            name="settings"
            size={24}
            color={currentScreen === 'settings' ? '#FF3B30' : '#8E8E93'}
          />
          <Text style={[styles.tabText, currentScreen === 'settings' && styles.tabTextActive]}>
            設定
          </Text>
        </TouchableOpacity>
      </View>

      {/* カウントダウンモーダル */}
      <CountdownModal
        visible={uiState.showCancelButton}
        onCancel={handleCancelSOS}
        duration={3}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#007AFF',
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  sosStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  sosStatusText: {
    fontSize: 16,
    color: '#34C759',
    marginLeft: 8,
    fontWeight: '600',
  },
  sosButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 100,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonActive: {
    backgroundColor: '#FF9500',
    transform: [{ scale: 1.1 }],
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 30,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#3C3C43',
    marginLeft: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabItemActive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});

export default EmergencyConnectApp;