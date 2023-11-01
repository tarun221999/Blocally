import { Platform } from 'react-native'
import colors from '../config/Colors';
import { constants } from '../config/Constants'
import notifee, { AndroidBadgeIconType, AndroidDefaults, AndroidGroupAlertBehavior, AndroidImportance } from '@notifee/react-native';

/**
 * Background FCM Handler for Android
 */
export default async (message) => {
    let data = message.data;

    let badgeCount = data.badge;
    if (typeof badgeCount == 'string') {
        badgeCount = parseInt(badgeCount)
    }

    notifee.setBadgeCount(badgeCount)

    const groupId = constants.FCM_GROUP_ID;

    // Create a notification
    const groupNotification = {
        title: Platform.OS === constants.ANDROID ? data.title : message.notification.title,
        body: Platform.OS === constants.ANDROID ? data.body : message.notification.body,
        android: {
            channelId: groupId,
            smallIcon: '@mipmap/ic_notification_icon',
            autoCancel: true,
            color: colors.primaryHexColor,
            group: constants.FCM_GROUP_ID,
            groupSummary: true,
            groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
            pressAction: {
                id: 'default',
            },
        },
    };


    const channelId = constants.FCM_CHANNEL_ID;
    const notification = {
        id: message.messageId,
        title: Platform.OS === constants.ANDROID ? data.title : message.notification.title,
        body: Platform.OS === constants.ANDROID ? data.body : message.notification.body,
        data: data,
        android: {
            autoCancel: true,
            channelId: channelId,
            color: colors.primaryHexColor,
            badgeIconType: AndroidBadgeIconType.LARGE,
            smallIcon: '@mipmap/ic_notification_icon',
            tag: constants.FCM_TAG,
            priority: AndroidImportance.HIGH,
            defaults: [AndroidDefaults.SOUND, AndroidDefaults.VIBRATE],
            groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
            pressAction: {
                id: 'default',
            },
        },
    };

    if (Platform.OS === constants.ANDROID && Platform.Version >= 28) {
        notification.android.group = constants.FCM_GROUP_ID;
        notifee.displayNotification(groupNotification);
    }

    notifee.displayNotification(notification);

    return Promise.resolve();
}