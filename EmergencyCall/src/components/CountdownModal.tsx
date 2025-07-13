/**
 * CountdownModal - SOSカウントダウン表示モーダル
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CountdownModalProps {
  visible: boolean;
  onCancel: () => void;
  duration: number; // 秒数
}

const CountdownModal: React.FC<CountdownModalProps> = ({
  visible,
  onCancel,
  duration = 3
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!visible) {
      setTimeLeft(duration);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, duration]);

  useEffect(() => {
    if (visible) {
      // アニメーション開始
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [timeLeft, scaleAnim, visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 警告アイコン */}
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color="#FF3B30" />
          </View>

          {/* カウントダウン表示 */}
          <Animated.View
            style={[
              styles.countdownContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Text style={styles.countdownNumber}>{timeLeft}</Text>
          </Animated.View>

          {/* メッセージ */}
          <Text style={styles.title}>SOS信号を送信します</Text>
          <Text style={styles.subtitle}>
            {timeLeft > 0 ? `${timeLeft}秒後に自動送信されます` : '送信中...'}
          </Text>

          {/* キャンセルボタン */}
          {timeLeft > 0 && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          )}

          {/* プログレスバー */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${((duration - timeLeft) / duration) * 100}%`
                }
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: Dimensions.get('window').width - 40,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  countdownContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#FF6B6B',
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
});

export default CountdownModal;