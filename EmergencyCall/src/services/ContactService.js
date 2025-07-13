/**
 * ContactService - 緊急連絡先管理サービス
 * 
 * リファクタリング改善点:
 * - Set/Mapデータ構造で重複排除と検索効率化
 * - 連絡先バリデーション強化
 * - 不変性保持とカプセル化
 * - エラーメッセージの国際化対応準備
 * - パフォーマンス最適化
 */
class ContactService {
  // 【改善1】連絡先の最大数制限（安全性とパフォーマンス）
  static MAX_CONTACTS = 10;
  
  // 【改善2】エラーメッセージを定数化
  static ErrorMessages = {
    CONTACT_REQUIRED: '連絡先には電話番号が必要です',
    NO_CONTACTS: '緊急連絡先が登録されていません',
    DUPLICATE_PHONE: 'この電話番号は既に登録されています',
    MAX_CONTACTS_EXCEEDED: `緊急連絡先は最大${ContactService.MAX_CONTACTS}件まで登録可能です`,
    INVALID_PHONE_FORMAT: '電話番号の形式が正しくありません'
  };

  constructor() {
    // 【改善3】Mapを使用して電話番号による高速検索を実現
    this._contactsByPhone = new Map();
    // 【改善4】順序保持のための配列も保持
    this._contactOrder = [];
  }

  /**
   * 緊急連絡先を一括設定
   * 【改善5】バリデーション強化と重複チェック
   */
  setEmergencyContacts(contacts) {
    if (!Array.isArray(contacts)) {
      contacts = [];
    }

    this._clearAllContacts();
    
    // 【改善6】各連絡先をバリデーションしながら追加
    contacts.forEach((contact, index) => {
      try {
        this._addValidatedContact(contact);
      } catch (error) {
        console.warn(`ContactService: Invalid contact at index ${index}:`, error.message);
      }
    });
  }

  /**
   * 緊急連絡先取得（不変コピーを返す）
   * 【改善7】防御的コピーで外部変更を防止
   */
  getEmergencyContacts() {
    return this._contactOrder.map(contact => ({...contact}));
  }

  /**
   * 緊急連絡先を追加
   * 【改善8】重複チェックと制限チェック強化
   */
  addEmergencyContact(contact) {
    this._validateContactFormat(contact);
    this._checkContactLimits();
    this._checkDuplicatePhone(contact.phone);
    
    this._addValidatedContact(contact);
  }

  /**
   * 電話番号で連絡先を削除
   * 【改善9】存在チェックと効率的な削除
   */
  removeEmergencyContact(phone) {
    if (!this._contactsByPhone.has(phone)) {
      return false; // 存在しない場合はfalseを返す
    }

    this._contactsByPhone.delete(phone);
    this._contactOrder = this._contactOrder.filter(contact => contact.phone !== phone);
    return true;
  }

  /**
   * 電話番号で連絡先を検索
   * 【改善10】O(1)検索の提供
   */
  findContactByPhone(phone) {
    const contact = this._contactsByPhone.get(phone);
    return contact ? {...contact} : null;
  }

  hasEmergencyContacts() {
    return this._contactsByPhone.size > 0;
  }

  /**
   * 連絡先数を取得
   * 【改善11】統計情報の提供
   */
  getContactCount() {
    return this._contactsByPhone.size;
  }

  /**
   * 緊急連絡先の検証
   * 【改善12】詳細な検証情報を返す
   */
  validateEmergencyContacts() {
    if (!this.hasEmergencyContacts()) {
      throw new Error(ContactService.ErrorMessages.NO_CONTACTS);
    }
    
    // 【改善13】各連絡先の有効性もチェック
    const invalidContacts = this._contactOrder.filter(contact => 
      !this._isValidPhoneNumber(contact.phone)
    );
    
    if (invalidContacts.length > 0) {
      throw new Error(`無効な電話番号が含まれています: ${invalidContacts.map(c => c.phone).join(', ')}`);
    }
    
    return {
      isValid: true,
      contactCount: this.getContactCount(),
      validContacts: this.getContactCount() - invalidContacts.length
    };
  }

  /**
   * 【改善14】プライベートメソッドでロジック分離
   */
  _validateContactFormat(contact) {
    if (!contact || typeof contact !== 'object') {
      throw new Error(ContactService.ErrorMessages.CONTACT_REQUIRED);
    }
    
    if (!contact.phone || typeof contact.phone !== 'string') {
      throw new Error(ContactService.ErrorMessages.CONTACT_REQUIRED);
    }
    
    if (!this._isValidPhoneNumber(contact.phone)) {
      throw new Error(ContactService.ErrorMessages.INVALID_PHONE_FORMAT);
    }
  }

  _checkContactLimits() {
    if (this.getContactCount() >= ContactService.MAX_CONTACTS) {
      throw new Error(ContactService.ErrorMessages.MAX_CONTACTS_EXCEEDED);
    }
  }

  _checkDuplicatePhone(phone) {
    if (this._contactsByPhone.has(phone)) {
      throw new Error(ContactService.ErrorMessages.DUPLICATE_PHONE);
    }
  }

  _addValidatedContact(contact) {
    const normalizedContact = this._normalizeContact(contact);
    this._contactsByPhone.set(normalizedContact.phone, normalizedContact);
    this._contactOrder.push(normalizedContact);
  }

  _normalizeContact(contact) {
    return {
      name: contact.name || '名前未設定',
      phone: this._normalizePhoneNumber(contact.phone),
      // 【改善15】追加のメタデータ
      addedAt: new Date().toISOString(),
      priority: contact.priority || 'normal'
    };
  }

  _normalizePhoneNumber(phone) {
    // 【改善16】電話番号の正規化（ハイフン除去等）
    return phone.replace(/[-\s()]/g, '');
  }

  _isValidPhoneNumber(phone) {
    // 【改善17】日本の電話番号形式の基本チェック
    const normalizedPhone = this._normalizePhoneNumber(phone);
    return /^(0\d{9,10}|(\+81|81)\d{9,10})$/.test(normalizedPhone);
  }

  _clearAllContacts() {
    this._contactsByPhone.clear();
    this._contactOrder = [];
  }

  /**
   * 【改善18】デバッグ用ステータス情報
   */
  getStatus() {
    return {
      contactCount: this.getContactCount(),
      maxContacts: ContactService.MAX_CONTACTS,
      hasContacts: this.hasEmergencyContacts(),
      contacts: this._contactOrder.map(c => ({
        name: c.name,
        phone: c.phone,
        priority: c.priority
      }))
    };
  }

  // テスト用メソッド（改善済み）
  reset() {
    this._clearAllContacts();
  }
}

module.exports = ContactService;