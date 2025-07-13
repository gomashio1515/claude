const PowerButtonService = require('../src/services/PowerButtonService');
const TestableLocationService = require('../src/services/TestableLocationService');
const ContactService = require('../src/services/ContactService');
const EmergencyService = require('../src/services/EmergencyService');

describe('EmergencyCall アプリケーション', () => {

  beforeEach(() => {
    // 各テスト前にシングルトンをリセット
    if (EmergencyService.instance) {
      EmergencyService.instance.reset();
    }
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('電源ボタン3回連続押し機能', () => {
    
    it('電源ボタンを3回連続で押した場合、緊急通知が送信されること', () => {
      const powerButtonService = new PowerButtonService();
      const emergencyService = EmergencyService.getInstance();
      
      // 連絡先を設定（エラーを避けるため）
      emergencyService.contactService.setEmergencyContacts([
        { name: 'テスト', phone: '090-1234-5678' }
      ]);
      
      // 電源ボタンを3回連続押し
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      
      // 緊急通知が送信されることを確認
      expect(emergencyService.isNotificationSent()).toBe(true);
    });

    it('電源ボタンを2回押しただけの場合、緊急通知が送信されないこと', () => {
      const powerButtonService = new PowerButtonService();
      const emergencyService = EmergencyService.getInstance();
      
      // 電源ボタンを2回押し
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      
      // 緊急通知が送信されないことを確認
      expect(emergencyService.isNotificationSent()).toBe(false);
    });

    it('電源ボタンを3回押したが間隔が長すぎる場合、緊急通知が送信されないこと', () => {
      const powerButtonService = new PowerButtonService();
      const emergencyService = EmergencyService.getInstance();
      
      // 電源ボタンを間隔を空けて3回押し
      powerButtonService.triggerPowerButton();
      // 5秒待機をシミュレート
      jest.advanceTimersByTime(5000);
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      
      // 緊急通知が送信されないことを確認
      expect(emergencyService.isNotificationSent()).toBe(false);
    });

    it('電源ボタンを4回以上押した場合でも、最初の3回で緊急通知が送信されること', () => {
      const powerButtonService = new PowerButtonService();
      const emergencyService = EmergencyService.getInstance();
      
      // 連絡先を設定（エラーを避けるため）
      emergencyService.contactService.setEmergencyContacts([
        { name: 'テスト', phone: '090-1234-5678' }
      ]);
      
      // 電源ボタンを4回押し
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      
      // 緊急通知が1回だけ送信されることを確認
      expect(emergencyService.getNotificationCount()).toBe(1);
    });

  });

  describe('位置情報・時刻付加機能', () => {

    it('緊急通知送信時に現在の位置情報が自動で付加されること', () => {
      const locationService = new TestableLocationService();
      const emergencyService = EmergencyService.getInstance();
      emergencyService.locationService = locationService;
      
      // 連絡先を設定
      emergencyService.contactService.setEmergencyContacts([
        { name: 'テスト', phone: '090-1234-5678' }
      ]);
      const mockLocation = { latitude: 35.6762, longitude: 139.6503 };
      
      // 位置情報を模擬設定
      locationService.setCurrentLocation(mockLocation);
      
      // 緊急通知を送信
      emergencyService.sendEmergencyNotification();
      
      // 送信された通知に位置情報が含まれることを確認
      const sentMessage = emergencyService.getLastSentMessage();
      expect(sentMessage.location).toEqual(mockLocation);
    });

    it('位置情報が取得できない場合、最後に取得できた位置情報が使用されること', () => {
      const locationService = new TestableLocationService();
      const emergencyService = EmergencyService.getInstance();
      emergencyService.locationService = locationService;
      
      // 連絡先を設定
      emergencyService.contactService.setEmergencyContacts([
        { name: 'テスト', phone: '090-1234-5678' }
      ]);
      const lastKnownLocation = { latitude: 35.6762, longitude: 139.6503 };
      
      // 最後の位置情報を設定
      locationService.setLastKnownLocation(lastKnownLocation);
      // 現在の位置情報取得を失敗させる
      locationService.setLocationUnavailable(true);
      
      // 緊急通知を送信
      emergencyService.sendEmergencyNotification();
      
      // 最後の位置情報が使用されることを確認
      const sentMessage = emergencyService.getLastSentMessage();
      expect(sentMessage.location).toEqual(lastKnownLocation);
    });

    it('緊急通知送信時に正確な発生時刻が自動で付加されること', () => {
      const emergencyService = EmergencyService.getInstance();
      
      // 連絡先を設定
      emergencyService.contactService.setEmergencyContacts([
        { name: 'テスト', phone: '090-1234-5678' }
      ]);
      const mockTimestamp = new Date('2024-01-15T10:30:00Z');
      
      // 時刻を模擬設定
      jest.setSystemTime(mockTimestamp);
      
      // 緊急通知を送信
      emergencyService.sendEmergencyNotification();
      
      // 送信された通知に正確な時刻が含まれることを確認
      const sentMessage = emergencyService.getLastSentMessage();
      expect(sentMessage.timestamp).toEqual(mockTimestamp);
    });

    it('位置情報と時刻の両方が同じメッセージに含まれること', () => {
      const locationService = new TestableLocationService();
      const emergencyService = EmergencyService.getInstance();
      emergencyService.locationService = locationService;
      
      // 連絡先を設定
      emergencyService.contactService.setEmergencyContacts([
        { name: 'テスト', phone: '090-1234-5678' }
      ]);
      const mockLocation = { latitude: 35.6762, longitude: 139.6503 };
      const mockTimestamp = new Date('2024-01-15T10:30:00Z');
      
      locationService.setCurrentLocation(mockLocation);
      jest.setSystemTime(mockTimestamp);
      
      // 緊急通知を送信
      emergencyService.sendEmergencyNotification();
      
      // 位置情報と時刻の両方が含まれることを確認
      const sentMessage = emergencyService.getLastSentMessage();
      expect(sentMessage.location).toEqual(mockLocation);
      expect(sentMessage.timestamp).toEqual(mockTimestamp);
    });

  });

  describe('複数連絡先同時送信機能', () => {

    it('事前に登録された複数の連絡先に同時にメッセージが送信されること', () => {
      const contactService = new ContactService();
      const emergencyService = EmergencyService.getInstance();
      emergencyService.contactService = contactService;
      const contacts = [
        { name: '配偶者', phone: '090-1234-5678' },
        { name: '父親', phone: '090-2345-6789' },
        { name: '母親', phone: '090-3456-7890' }
      ];
      
      // 連絡先を登録
      contactService.setEmergencyContacts(contacts);
      
      // 緊急通知を送信
      emergencyService.sendEmergencyNotification();
      
      // 全ての連絡先にメッセージが送信されることを確認
      contacts.forEach(contact => {
        expect(emergencyService.isMessageSentTo(contact.phone)).toBe(true);
      });
    });

    it('連絡先が1つも登録されていない場合、エラーが発生すること', () => {
      const contactService = new ContactService();
      const emergencyService = EmergencyService.getInstance();
      emergencyService.contactService = contactService;
      
      // 連絡先を空に設定
      contactService.setEmergencyContacts([]);
      
      // 緊急通知送信でエラーが発生することを確認
      expect(() => {
        emergencyService.sendEmergencyNotification();
      }).toThrow('緊急連絡先が登録されていません');
    });

    it('一部の連絡先への送信が失敗しても、他の連絡先には送信が継続されること', () => {
      const contactService = new ContactService();
      const emergencyService = EmergencyService.getInstance();
      emergencyService.contactService = contactService;
      const contacts = [
        { name: '配偶者', phone: '090-1234-5678' },
        { name: '父親', phone: '090-INVALID-NUMBER' },
        { name: '母親', phone: '090-3456-7890' }
      ];
      
      contactService.setEmergencyContacts(contacts);
      
      // 緊急通知を送信
      emergencyService.sendEmergencyNotification();
      
      // 有効な連絡先には送信され、無効な連絡先は失敗することを確認
      expect(emergencyService.isMessageSentTo('090-1234-5678')).toBe(true);
      expect(emergencyService.isMessageSentTo('090-INVALID-NUMBER')).toBe(false);
      expect(emergencyService.isMessageSentTo('090-3456-7890')).toBe(true);
    });

    it('すべての連絡先に同じ内容のメッセージが送信されること', () => {
      const contactService = new ContactService();
      const emergencyService = EmergencyService.getInstance();
      emergencyService.contactService = contactService;
      const contacts = [
        { name: '配偶者', phone: '090-1234-5678' },
        { name: '父親', phone: '090-2345-6789' }
      ];
      
      contactService.setEmergencyContacts(contacts);
      
      // 緊急通知を送信
      emergencyService.sendEmergencyNotification();
      
      // 全ての連絡先に同じ内容が送信されることを確認
      const messageToSpouse = emergencyService.getMessageSentTo('090-1234-5678');
      const messageToFather = emergencyService.getMessageSentTo('090-2345-6789');
      expect(messageToSpouse.content).toEqual(messageToFather.content);
    });

  });

  describe('統合テスト', () => {

    it('電源ボタン3回押しから全機能が連携して動作すること', () => {
      const powerButtonService = new PowerButtonService();
      const locationService = new TestableLocationService();
      const contactService = new ContactService();
      const emergencyService = EmergencyService.getInstance();
      
      // サービスを設定
      emergencyService.locationService = locationService;
      emergencyService.contactService = contactService;
      
      // 初期設定
      const mockLocation = { latitude: 35.6762, longitude: 139.6503 };
      const mockTimestamp = new Date('2024-01-15T10:30:00Z');
      const contacts = [
        { name: '配偶者', phone: '090-1234-5678' },
        { name: '父親', phone: '090-2345-6789' }
      ];
      
      locationService.setCurrentLocation(mockLocation);
      jest.setSystemTime(mockTimestamp);
      contactService.setEmergencyContacts(contacts);
      
      // 電源ボタンを3回押し
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      powerButtonService.triggerPowerButton();
      
      // 全ての機能が連携して動作することを確認
      expect(emergencyService.isNotificationSent()).toBe(true);
      
      contacts.forEach(contact => {
        const sentMessage = emergencyService.getMessageSentTo(contact.phone);
        expect(sentMessage.location).toEqual(mockLocation);
        expect(sentMessage.timestamp).toEqual(mockTimestamp);
        expect(sentMessage.content).toContain('緊急事態');
      });
    });

  });

});