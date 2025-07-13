/**
 * SettingsScreen - 設定画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonConfig {
  button: string;
  action: string;
}

interface SettingsScreenProps {
  buttonConfig: ButtonConfig | null;
  onButtonConfigChange: (config: ButtonConfig) => void;
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  buttonConfig,
  onButtonConfigChange,
  onBack
}) => {
  const [selectedButton, setSelectedButton] = useState(buttonConfig?.button || 'volumeUp');
  const [selectedAction, setSelectedAction] = useState(buttonConfig?.action || 'triplePress');
  const [locationTracking, setLocationTracking] = useState(true);
  const [backgroundSOS, setBackgroundSOS] = useState(true);

  // ボタン選択肢
  const buttonOptions = [
    { key: 'volumeUp', label: '音量アップボタン', icon: 'volume-high' },
    { key: 'volumeDown', label: '音量ダウンボタン', icon: 'volume-low' },
    { key: 'power', label: '電源ボタン', icon: 'power' },
  ];

  // アクション選択肢
  const actionOptions = [
    { key: 'triplePress', label: '3回連続押し', description: '0.5秒間隔で3回押す' },
    { key: 'longPress', label: '長押し', description: '3秒間長押し' },
    { key: 'quintupletPress', label: '5回連続押し', description: '0.5秒間隔で5回押す' },
  ];

  /**
   * 設定保存
   */
  const saveButtonConfig = () => {
    try {
      const newConfig = {
        button: selectedButton,
        action: selectedAction
      };

      onButtonConfigChange(newConfig);
      
      Alert.alert(
        '設定保存',
        'ボタン設定を保存しました。',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving button config:', error);
      Alert.alert('エラー', '設定の保存に失敗しました。');
    }
  };

  /**
   * 設定テスト
   */
  const testButtonConfig = () => {
    const buttonLabel = buttonOptions.find(b => b.key === selectedButton)?.label;
    const actionLabel = actionOptions.find(a => a.key === selectedAction)?.label;

    Alert.alert(
      'ボタンテスト',
      `${buttonLabel}の${actionLabel}でSOSが発信されます。\n\n実際に試してみますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'テスト実行',
          onPress: () => {
            Alert.alert(
              'テスト実行中',
              `${buttonLabel}を${actionLabel}してください。\n\n（実際にはSOS信号は送信されません）`
            );
          }
        }
      ]
    );
  };

  /**
   * 設定リセット
   */
  const resetSettings = () => {
    Alert.alert(
      '設定リセット',
      'すべての設定をリセットしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            setSelectedButton('volumeUp');
            setSelectedAction('triplePress');
            setLocationTracking(true);
            setBackgroundSOS(true);
            
            const defaultConfig = {
              button: 'volumeUp',
              action: 'triplePress'
            };
            
            onButtonConfigChange(defaultConfig);
            
            Alert.alert('完了', '設定をリセットしました。');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveButtonConfig}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 物理ボタン設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>物理ボタン設定</Text>
          <Text style={styles.sectionDescription}>
            SOS発信に使用するボタンと操作方法を選択してください
          </Text>

          {/* ボタン選択 */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>使用するボタン</Text>
            {buttonOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionItem,
                  selectedButton === option.key && styles.optionItemSelected
                ]}
                onPress={() => setSelectedButton(option.key)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={selectedButton === option.key ? '#007AFF' : '#8E8E93'}
                />
                <Text
                  style={[
                    styles.optionText,
                    selectedButton === option.key && styles.optionTextSelected
                  ]}
                >
                  {option.label}
                </Text>
                {selectedButton === option.key && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* アクション選択 */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>操作方法</Text>
            {actionOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionItem,
                  selectedAction === option.key && styles.optionItemSelected
                ]}
                onPress={() => setSelectedAction(option.key)}
              >
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionText,
                      selectedAction === option.key && styles.optionTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
                {selectedAction === option.key && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* テストボタン */}
          <TouchableOpacity style={styles.testButton} onPress={testButtonConfig}>
            <Ionicons name="play-circle" size={20} color="#007AFF" />
            <Text style={styles.testButtonText}>設定をテスト</Text>
          </TouchableOpacity>
        </View>

        {/* 位置情報設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>位置情報設定</Text>

          <View style={styles.switchItem}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchText}>リアルタイム位置追跡</Text>
              <Text style={styles.switchDescription}>
                継続的に位置情報を更新し、正確な現在地を送信します
              </Text>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={setLocationTracking}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* バックグラウンド動作設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>バックグラウンド動作</Text>

          <View style={styles.switchItem}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchText}>バックグラウンドSOS</Text>
              <Text style={styles.switchDescription}>
                アプリが閉じていてもSOS機能を有効にします
              </Text>
            </View>
            <Switch
              value={backgroundSOS}
              onValueChange={setBackgroundSOS}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* アプリ情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ情報</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>バージョン</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>開発者</Text>
            <Text style={styles.infoValue}>EmergencyConnect Team</Text>
          </View>
        </View>

        {/* リセットボタン */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
            <Ionicons name="refresh" size={20} color="#FF3B30" />
            <Text style={styles.resetButtonText}>設定をリセット</Text>
          </TouchableOpacity>
        </View>

        {/* 注意事項 */}
        <View style={styles.section}>
          <Text style={styles.warningTitle}>⚠️ 重要な注意事項</Text>
          <Text style={styles.warningText}>
            • このアプリは医療機器ではありません{'\n'}
            • 緊急時は119番への通報も行ってください{'\n'}
            • 設定変更後は必ずテストを実行してください{'\n'}
            • 位置情報の精度は環境により変動します
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  optionItemSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#007AFF',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  testButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  infoLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  infoValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '600',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});

export default SettingsScreen;