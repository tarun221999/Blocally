const urls = {
    GET: 'GET',
    POST: 'POST',
    BASE_URL: 'https://www.partner-blocally.de:8090/api/', // Production server
    // BASE_URL: 'http://54.187.66.78:8090/api/', // Staging server

    LOGIN: 'UserLoginEnt',

    USER_FORGOT_PASSWORD_OTP_EMAIL: "UserForgetPasswordOTPEmail",
    USER_FORGOT_PASSWORD: 'UserForgetPassword',

    GET_PRODUCTS: 'GetProductsEnt',
    GET_CATEGORY: 'GetCategory',
    GET_DEALS: 'GetDealsEnt',
    GET_PRODUCT_DETAIL_ENT: 'GetProductDetailEnt',

    GET_APPOINTMENTS: 'GetAppointmentsEnt',
    GET_MESSAGES: 'GetMessagesEnt',
    GET_MESSAGES_CHAT: 'GetMessagesChat',
    SEND_MESSAGE: 'SendMessage',
    GET_DEALS_LIST: 'GetDealsListEnt',
    GET_MESSAGE_CHAT: "GetMessagesChat",
    GET_PRODUCT_MENU: "GetProductMenu",
    MANAGE_APPOINTMENT: "ManageAppointment",
    DELETE_PRODUCT: "DeleteProduct",
    MANAGE_PRODUCT: "ManageProduct",
    SEND_ENTREPRENEUR_REQUEST: "SendEntrepreneurRequest",
    USER_LOGOUT: "UserLogout",
    USER_CHANGE_PASSWORD: "UserChangePassword",
    USER_UPDATE_PROFILE: 'UserUpdateProfile',
    GET_EMPLOYEE_PROFILE: 'GetEmployeeProfile',

    REDEEM_DEAL: 'RedeemDeal',
    SCAN_BONUS_DEAL: 'ScanBonusDeal',
    SYNC_DEAL: 'SyncDeal',

    GetEntrepreneurHoliday: "GetEntrepreneurBlockDate",
    DeleteEntrepreneurHoliday: "DeleteEntrepreneurBlockDate",
    DELETE_MESSAGES: 'DeleteMessages',
    GetStatsEnt: "GetStatsEnt",
    AddEntrepreneurHoliday: "AddEntrepreneurBlockDate",
    CANCEL_APPOINTMENT: "CancelAppointment",

    GET_MESSAGES_CHAT_PAST: 'GetMessagesChatPast',
    GET_MESSAGES_CHAT_NEW: 'GetMessagesChatNew',
    DELETE_APPOINTMENT:'DeleteAppointment',
    AddProductsBlockDate:"AddProductsBlockDate",
    GetProductsBlockDate:"GetProductsBlockDate",
    UpdateEntrepreneurBlockDate:"UpdateEntrepreneurBlockDate",
    GetEntrepreneurBlockDateDetail:"GetEntrepreneurBlockDateDetail",

    GET_NOTIFICATIONS: 'GetNotifications',
    DELETE_NOTIFICATION: 'DeleteNotification',

    GET_UNREAD_COUNT: 'GetUnreadCount',
}

const screenNames = {
    SPLASH_SCREEN: "SPLASH_SCREEN",
    LOGIN_SCREEN: "LOGIN_SCREEN",
    FORGOT_PASSWORD_SCREEN: "FORGOT_PASSWORD_SCREEN",
    SIGN_UP_SCREEN: "SIGN_UP_SCREEN",
    HOME_SCREEN: "HOME_SCREEN",
    PURCHASE: "PURCHASE",
    APPOINTMENT: "APPOINTMENT",

    PURCHASE_LISTING_SCREEN: "PURCHASE_LISTING_SCREEN",
    PURCHASE_DETAIL_SCREEN: "PURCHASE_DETAIL_SCREEN",
    FAVORITES: "FAVORITES",
    MESSENGER: "MESSENGER",
    MY_AREA: "MY_AREA",
    MESSENGER_SCREEN: "MESSENGER_SCREEN",
    MEIN_REGENSBURG: "MEIN_REGENSBURG",
    HOT_DEAL_DETAIL_SCREEN: "HOT_DEAL_DETAIL_SCREEN",
    PROFILE_SCREEEN: "PROFILE_SCREEN",
    MESSENGER_CHAT_SCREEN: "MESSENGER_CHAT_SCREEN",
    ENTER_OTP_SCREEN: "ENTER_OTP_SCREEN",
    RESET_PASSWORD_SCREEN: "RESET_PASSWORD_SCREEN",
    MENU_SCREEN: "MENU_SCREEN",
    CHANGE_PASSWORD_SCREEN: "CHANGE_PASSWORD_SCREEN",
    HOLIDAYS_SCREEN: "HOLIDAYS_SCREEN",
    WEB_VIEW_SCREEN: "WEB_VIEW_SCREEN",
    VIEW_ALL_DEALS_SCREEN: "VIEW_ALL_DEALS_SCREEN",

    NOTIFICATIONS_SCREEN: "NOTIFICATIONS_SCREEN",

    // Employee related screens
    EMPLOYEE_HOME_SCREEN: "EMPLOYEE_HOME_SCREEN",
    EMP_HOME_SCREEN: "EMP_HOME_SCREEN",
    SYNC_DATA: "SYNC_DATA",
    QR_SCAN_SCREEN: "QR_SCAN_SCREEN",
    SYNC_DATA_SCREEN: "SYNC_DATA_SCREEN",
    EMPLOYEE_PROFILE_SCREEN: "EMPLOYEE_PROFILE_SCREEN",
    EMPLOYEE_SETTINGS_SCREEN: "EMPLOYEE_SETTINGS_SCREEN",
}

const constants = {
    PAGE_SIZE_20: 20,
    HANDLING_TIMEOUT: 500,
    SPLASH_WAIT_TIME: 3000,
    BACK_WAIT_TIME: 3000,
    LOGO_VIEW_HEIGHT_PERCENTAGE: 0.10,
    PAGE_SIZE: 10,
    MIN_HEIGHT_FOR_FLAT_LIST: 225,
    CARD_UPPER_VIEW_HEIGHT_PERCENTAGE: 14.5,
    ADS_INTERVAL: 4000,
    CURRENT_COUNT_FOR_FAILURE: 5,
    HEADER_IMAGE_HEIGHT_PERCENTAGE: 0.5234,
    ANDROID: "android",
    IOS: "ios",
    TYPE_OF_USER: "TYPE_OF_USER",
    AUTH_TOKEN: "AUTH_TOKEN",
    GUEST_AUTH_TOKEN: "guestlogin",
    IS_USER_LOGGED_IN: "IS_USER_LOGGED_IN",
    LOGGED_IN_USER: "LOGGED_IN_USER",
    EMAIL_REGULAR_EXPRESSION: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    MOBILE_REGULAR_EXPRESSION: /^\d+$/,
    COORDINATES: "COORDINATES",
    SELECTED_LANGUAGE: "SELECTED_LANGUAGE",
    MESSAGE_REFRESH_INTERVAL: 3000,
    HOT_DEALS_SCANNED_COUNT: "HOT_DEALS_SCANNED_COUNT",
    BONUS_DEALS_SCANNED_COUNT: "BONUS_DEALS_SCANNED_COUNT",
    BUISSNESS_ID:"BUISSNESS_ID",
    INVALID_AUTH_TOKEN_CODE: 102,
    CHAR_MAX_LIMIT: 20,
    EMAIL_CHAR_MAX_LIMIT: 50,
    PHONE_CHAR_MAX_LIMIT: 15,
    PHONE_CHAR_MIN_LIMIT: 7, // if changing, then change in strings.js also mobile_should_be
    ADDRESS_CHAR_MAX_LIMIT: 100,
    OTP_CHAR_MAX_LIMIT: 4,
    QR_CODE_MAX_LIMIT: 10,
    TEXT_FOR_USER_ID: "SID-",
    // FCM
    FCM_TOKEN: "FCM_TOKEN",
    FCM_CHANNEL_ID: "BLocally-Entrepreneur-Channel",
    FCM_CHANNEL_NAME: "General",
    FCM_CHANNEL_DESCRIPTION: "General Notifications",
    FCM_GROUP_NOTIFICATION_ID: "BLocally-Entrepreneur-Group-Notification",
    FCM_GROUP_ID: "BLocally-Entrepreneur-Group",
    FCM_GROUP_NAME: "General",
    FCM_TAG: "BLocally-Entrepreneur-Tag",
    IS_CHAT_SCREEN: false,
    CURRENT_CHAT_ID: -1,
}

const databaseConstants = {
    DEALS_SCHEMA: "DEALS",
    SCHEMA_VERSION: 1
}

const fontNames = {
    regularFont: "Quicksand-Regular",
    boldFont: "Quicksand-Bold",
    lightFont: "Quicksand-Light",
    mediumFont: "Quicksand-Medium"
}

const sizes = {
    headerTextSize: 24,
    xLargeTextSize: 18,
    largeTextSize: 16,
    normalTextSize: 14,
    mediumTextSize: 12,
    smallTextSize: 10,
    xSmallTextSize: 8,
    buttonTextSize: 16,
    tabTextSize: 10,
    buttonWidth: '100%',
    cardBorderRadius: 15,
    errorTextSize: 12,
    scrollViewHorizontalPadding: 30,
    detailTextSize: 13,
    xxSmallText: 6,
    CARD_UPPER_VIEW_HEIGHT_PERCENTAGE: 14.5
}

const languages = {
    english: "en",
    german: "de"
}

const itemTypes = {
    ACTION: 1,
    EVENT: 2,
    HOT_DEAL: 3,
    BOOK: 4,
    BONUS_DEAL: 5
}

const appointmentRequestStatus = {
    REQUESTED: 1,
    APPROVED: 2,
    REJECTED: 3,
    CANCELLED: 4,
    ACTION_PERFORMED: 5, // Not a status but adding to avoid hard coded checks
}

const categoryTypes = {
    CATEGORY: "C",
    SUB_CATEGORY: "SC",
    FILTER_CATEGORY: "FC",
}

const appTypes = {
    USER_APP: 1,
    ENTREPRENEUR_APP: 2,
}

const appointmentSortType = {
    PENDING: 1,
    UPCOMING: 2,
    PAST: 3,
    REJECTED: 4,
}

const userTypes = {
    USER: "1",
    ENTREPRENEUR: "2",
    EMPLOYEE: "4"
}

const productSortBy = {
    DATE: 1,
    SPECIFIC_DATE: 2,
}
const productOrderBy = {
    ASCENDING: 1,
    DESCENDING: 2
}
const scheduleTypes = {
    DAYS: 1,
    DATES: 2
}
const statsTypes = {
    CLICK_ON_CALL: 4,
    REDIRECT_TO_WEBSITE: 5
}

const dealStatuses = {
    BONUS_DEAL: 0,
    SAVED: 1,
    REDEEMED: 2,
    EXPIRED: 3,
    BOOKED: 4,
    CHECKED_IN: 5,
    NO_RESPONSE: 6,
    DEAL_APPOINTMENT_REJECTED: 7,
    DEAL_APPOINTMENT_CANCELLED: 8,
    DEAL_SCANNED: 9,
}

const notificationTypes = {
    MESSAGE: 1,
    FOR_PRODUCT: 2,
    FROM_SUPER_ADMIN: 3,
    MARK_ENT_FAV: 4,
    APPOINTMENT: 5,
}

export {
    screenNames, fontNames, constants, sizes, urls, itemTypes, categoryTypes, languages, statsTypes,
    appointmentRequestStatus, appTypes, appointmentSortType, userTypes, databaseConstants, productSortBy, 
    productOrderBy, scheduleTypes, dealStatuses, notificationTypes,
}