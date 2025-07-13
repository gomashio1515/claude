/**
 * ContactList - 緊急連絡先管理画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface ContactListProps {
  contacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
  onBack: () => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onContactsChange,
  onBack
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  /**
   * 連絡先追加/編集フォームのリセット
   */
  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '' });
    setEditingContact(null);
  };

  /**
   * 連絡先追加/編集モーダルを開く
   */
  const openAddModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || ''
      });
    } else {
      resetForm();
    }
    setShowAddModal(true);
  };

  /**
   * 連絡先保存
   */
  const saveContact = () => {
    // バリデーション
    if (!formData.name.trim()) {
      Alert.alert('エラー', '名前を入力してください。');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('エラー', '電話番号を入力してください。');
      return;
    }

    // 電話番号の形式チェック
    const phoneRegex = /^[0-9-]+$/;
    if (!phoneRegex.test(formData.phone) || formData.phone.length < 10) {
      Alert.alert('エラー', '正しい電話番号を入力してください。');
      return;
    }

    try {
      let newContacts: Contact[];

      if (editingContact) {
        // 編集の場合
        newContacts = contacts.map(contact =>
          contact.id === editingContact.id
            ? {
                ...contact,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim() || undefined
              }
            : contact
        );
      } else {
        // 新規追加の場合
        const newContact: Contact = {
          id: Date.now(), // 簡易的なID生成
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined
        };
        newContacts = [...contacts, newContact];
      }

      onContactsChange(newContacts);
      setShowAddModal(false);
      resetForm();

      Alert.alert(
        '保存完了',
        editingContact ? '連絡先を更新しました。' : '連絡先を追加しました。'
      );
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('エラー', '連絡先の保存に失敗しました。');
    }
  };

  /**
   * 連絡先削除
   */
  const deleteContact = (contact: Contact) => {
    Alert.alert(
      '連絡先削除',
      `${contact.name} を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            const newContacts = contacts.filter(c => c.id !== contact.id);
            onContactsChange(newContacts);
          }
        }
      ]
    );
  };

  /**
   * 連絡先アイテムのレンダリング
   */
  const renderContactItem = (contact: Contact) => (
    <View key={contact.id} style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {contact.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
          {contact.email && (
            <Text style={styles.contactEmail}>{contact.email}</Text>
          )}
        </View>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openAddModal(contact)}
        >
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteContact(contact)}
        >
          <Ionicons name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>緊急連絡先</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openAddModal()}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 連絡先リスト */}
      <ScrollView style={styles.content}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyStateText}>緊急連絡先が登録されていません</Text>
            <Text style={styles.emptyStateSubtext}>
              緊急時に連絡する人を追加してください
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => openAddModal()}
            >
              <Text style={styles.emptyStateButtonText}>連絡先を追加</Text>
            </TouchableOpacity>
          </View>
        ) : (
          contacts.map(renderContactItem)
        )}
      </ScrollView>

      {/* 追加/編集モーダル */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingContact ? '連絡先編集' : '連絡先追加'}
            </Text>
            <TouchableOpacity style={styles.modalSaveButton} onPress={saveContact}>
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>名前 *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="例: 田中太郎"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>電話番号 *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="例: 090-1234-5678"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="例: tanaka@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.note}>
              * は必須項目です。緊急時にはSMSと電話で連絡します。
            </Text>
          </ScrollView>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contactItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: '#8E8E93',
  },
  contactActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  note: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default ContactList;