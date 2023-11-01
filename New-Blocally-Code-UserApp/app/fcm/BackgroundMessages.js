import { Platform } from 'react-native'
import { constants } from '../config/constants'
import colors from '../config/colors'
import notifee, { AndroidBadgeIconType, AndroidDefaults, AndroidGroupAlertBehavior, AndroidImportance } from '@notifee/react-native';

/**
 * Background FCM Handler for Android
 */
export default async (message) => {
    // handle your message
    let data = message.data;

    let badgeCount = data.badge;
    if (typeof badgeCount == 'string') {
        badgeCount = parseInt(badgeCount)
    }

    notifee.setBadgeCount(badgeCount)

    const groupNotification = {
        title: Platform.OS === constants.ANDROID ? data.title : message.notification.title,
        body: Platform.OS === constants.ANDROID ? data.body : message.notification.body,
        android: {
            channelId: constants.FCM_GROUP_ID,
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
        data: data
    };

    const notification = {
        id: message.messageId,
        title: Platform.OS === constants.ANDROID ? data.title : message.notification.title,
        body: Platform.OS === constants.ANDROID ? data.body : message.notification.body,
        android: {
            autoCancel: true,
            channelId: constants.FCM_CHANNEL_ID,
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
        data: data
    };


    // if (Platform.OS === constants.ANDROID) {
    // }

    // Showing group notification only for 24 and above
    if (Platform.OS === constants.ANDROID && Platform.Version >= 24) {
        // notification.android.setGroup(constants.FCM_GROUP_ID)
        notifee.displayNotification(groupNotification);
    }
    notifee.displayNotification(notification);

    return Promise.resolve();
}