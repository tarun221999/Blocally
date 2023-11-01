/**
 * Constants for the application
 */

const urls = {
    GET: 'GET',
    POST: 'POST',
    BASE_URL: 'https://www.partner-blocally.de:8090/api/', // Production server
    // BASE_URL: 'http://54.187.66.78:8090/api/', // Staging server

    USER_LOGIN: 'UserLogin',
    USER_SOCIAL_LOGIN: 'UserSocialLogin',
    USER_SIGN_UP_OTP_EMAIL: 'UserRegistrationOTPEmail',
    USER_SIGN_UP: 'UserRegistration',
    USER_FORGOT_PASSWORD_OTP_EMAIL: 'UserForgetPasswordOTPEmail',
    USER_FORGOT_PASSWORD: 'UserForgetPassword',
    USER_CHANGE_PASSWORD: 'UserChangePassword',
    USER_UPDATE_PROFILE: 'UserUpdateProfile',

    GET_PRODUCTS: 'GetProducts',
    GET_CATEGORY: 'GetCategory',
    GET_CATEGORY_BOOK: 'GetCategoryBook',
    GET_PRODUCT_DETAIL: 'GetProductDetail',
    GET_PRODUCT_MENU: 'GetProductMenu',
    GET_ADVERTISEMENTS: 'GetAdvertisements',

    GET_ENTREPRENEURS_BY_CATEGORY: 'GetEntrepreneursByCategory',
    GET_ENTREPRENEUR_DETAIL: 'GetEntrepreneurDetail',

    GET_FAVORITE_ENTREPRENEURS: 'GetFavEntrepreneurs',
    GET_ENTREPRENEUR_DEALS: 'GetEntrepreneurAllProducts',
    GET_FAVORITE_PRODUCTS: 'GetFavProducts',
    MANAGE_FAVORITES: 'ManageFavourites',
    GET_ENTREPRENEUR_PRODUCTS: 'GetEntrepreneurProducts',

    ADD_DEAL: 'AddDeal',
    MANAGE_DEAL: 'ManageDeal',
    REMOVE_DEAL: 'RemoveDeal',
    GET_DEALS: 'GetDeals',
    GET_DEAL_DETAIL: 'GetDealDetail',
    REDEEM_DEAL: 'RedeemDeal',
    CHECK_IN_DEAL: 'CheckInDeal',
    SAVE_DEAL: 'SaveDeal',
    SYNC_DEAL: 'SyncDeal',
    DELETE_DEAL: 'DeleteDeal',

    GET_APPOINTMENTS: 'GetAppointments',
    CANCEL_APPOINTMENT: 'CancelAppointment',
    DELETE_APPOINTMENT: 'DeleteAppointment',

    UPDATE_NICK_NAME: 'UserUpdateNickName',
    GET_MESSAGES: 'GetMessages',
    DELETE_MESSAGES: 'DeleteMessages',
    GET_MESSAGE_CHAT: 'GetMessagesChat',
    SEND_MESSAGE: 'SendMessage',
    ADD_APPOINTMENT: 'AddAppointment',
    GET_AVAILABLE_SCHEDULER: 'GetAvailableScheduler',
    GET_MESSAGES_CHAT_PAST: 'GetMessagesChatPast',
    GET_MESSAGES_CHAT_NEW: 'GetMessagesChatNew',

    USER_NOTIFICATION_SETTINGS: 'UserNotificationSettings',
    USER_LOGOUT: 'UserLogout',
    USER_DELETE_ACCOUNT: 'UserDeleteAccount',

    ADD_STATS: 'AddStats',

    SEND_ENTREPRENEUR_REQUEST: 'SendEntrepreneurRequest',

    GET_ENTREPRENEURS_WITH_BONUS_DEALS: 'GetEntrepreneursWithBonusDeals',
    GET_ENTREPRENEUR_BONUS_DEALS: 'GetEntrepreneurBonusDeals',
    ADD_BONUS_DEAL: 'AddBonusDeal',

    GET_NOTIFICATIONS: 'GetNotifications',
    DELETE_NOTIFICATION: 'DeleteNotification',

    GET_UNREAD_COUNT: 'GetUnreadCount',
    GET_SETTINGS: 'GetSettings',

    CHECK_BOOKING_ACTIVE: 'CheckBookingsActive',

    TERMS_AND_CONDITIONS: 'https://b-locally.de/agb/',
    DATA_PROTECTION_URL: 'https://b-locally.de/datenschutz/',
}

const screenNames = {
    // Common screens
    SPLASH_SCREEN: "SPLASH_SCREEN",
    CHOOSE_TYPE_OF_USER_SCREEN: "CHOOSE_TYPE_OF_USER_SCREEN",
    LOGIN_SCREEN: "LOGIN_SCREEN",
    FORGOT_PASSWORD_SCREEN: "FORGOT_PASSWORD_SCREEN",
    ENTER_OTP_SCREEN: "ENTER_OTP_SCREEN",
    RESET_PASSWORD_SCREEN: "RESET_PASSWORD_SCREEN",

    // User's screens
    SIGN_UP_SCREEN: "SIGN_UP_SCREEN",
    SOCIAL_SIGN_UP_SCREEN: "SOCIAL_SIGN_UP_SCREEN",
    USER_HOME_SCREEN: "USER_HOME_SCREEN",
    MEIN_REGENSBURG: "MEIN_REGENSBURG",
    BOOK: "BOOK",
    LOCATIONS: "LOCATIONS",
    FAVORITES: "FAVORITES",
    MY_AREA: "MY_AREA",
    VIEW_ALL_SCREEN: "VIEW_ALL_SCREEN",
    SUB_CATEGORIES_SCREEN: "SUB_CATEGORIES_SCREEN",
    HOT_DEAL_DETAIL_SCREEN: "HOT_DEAL_DETAIL_SCREEN",
    ACTION_EVENT_DETAIL_SCREEN: "ACTION_EVENT_DETAIL_SCREEN",
    MENU_SCREEN: "MENU_SCREEN",
    BOOK_FILTER_CATEGORIES_SCREEN: "BOOK_FILTER_CATEGORIES_SCREEN",
    USER_SETTINGS_SCREEN: "USER_SETTINGS_SCREEN",
    USER_CHANGE_PASSWORD_SCREEN: "USER_CHANGE_PASSWORD_SCREEN",
    USER_PROFILE_SCREEN: "USER_PROFILE_SCREEN",
    ENTREPRENEUR_DETAIL_SCREEN: "ENTREPRENEUR_DETAIL_SCREEN",
    MY_HOT_DEALS_SCREEN: "MY_HOT_DEALS_SCREEN",
    MY_HOT_DEAL_DETAIL_SCREEN: "MY_HOT_DEAL_DETAIL_SCREEN",
    ENTER_QR_CODE_SCREEN: "ENTER_QR_CODE_SCREEN",
    QR_SCAN_SCREEN: "QR_SCAN_SCREEN",
    MY_HOT_DEAL_REDEEM_SCREEN: "MY_HOT_DEAL_REDEEM_SCREEN",
    MESSENGER_SCREEN: "MESSENGER_SCREEN",
    MESSAGE_SCREEN: "MESSAGE_SCREEN",
    MY_APPOINTMENTS_SCREEN: "MY_APPOINTMENTS_SCREEN",
    ADD_APPOINTMENT_SCREEN: "ADD_APPOINTMENT_SCREEN",
    SHOW_QR_CODE_SCREEN: "SHOW_QR_CODE_SCREEN",

    WEB_VIEW_SCREEN: "WEB_VIEW_SCREEN",
    CHOOSE_TIME_SCREEN: "CHOOSE_TIME_SCREEN",
    CHOOSE_PREDEFINED_TIME_SCREEN: "CHOOSE_PREDEFINED_TIME_SCREEN",

    CONTACT_US_SCREEN: "CONTACT_US_SCREEN",
    NOTIFICATIONS_SCREEN: "NOTIFICATIONS_SCREEN",

    VIEW_ALL_MENU_IMAGES_SCREEN: "VIEW_ALL_MENU_IMAGES_SCREEN",
    FULL_IMAGE_SCREEN: "FULL_IMAGE_SCREEN",
    PDF_VIEWER_SCREEN: "PDF_VIEWER_SCREEN",
    WEB_VIEW_FOR_PDF_SCREEN: "WEB_VIEW_FOR_PDF_SCREEN",

    // Entrepreneur's screens
    ENTREPRENEUR_SIGN_UP_SCREEN: "ENTREPRENEUR_SIGN_UP_SCREEN",
}

const databaseConstants = {
    DEALS_SCHEMA: "DEALS",
    PRODUCT_SCHEDULER_SCHEMA: "PRODUCT_SCHEDULER",
    PRODUCT_MENU_SCHEMA: "PRODUCT_MENU",
    SCHEMA_VERSION: 1
}

const userTypes = {
    USER: "1",
    ENTREPRENEUR: "2",
}

const gender = {
    MALE: 1,
    FEMALE: 2,
    OTHER: 3,
}

const itemTypes = {
    ACTION: 1,
    EVENT: 2,
    HOT_DEAL: 3,
    BOOK: 4,
    BONUS_DEAL: 5
}

const categoryTypes = {
    CATEGORY: "C",
    SUB_CATEGORY: "SC",
    FILTER_CATEGORY: "FC",
}

const productSortBy = {
    DISTANCE: 1,
    DATE: 2,
    SPECIFIC_DATE: 3
}

const productOrderBy = {
    ASCENDING: 1,
    DESCENDING: 2
}

const appointmentRequestStatus = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
    CANCELLED: 4,
    ACTION_PERFORMED: 5, // Not a status but adding to avoid hard coded checks
}

const appointmentSortType = {
    PENDING: 1,
    UPCOMING: 2,
    PAST: 3,
    REJECTED: 4,
}

const favoriteType = {
    PRODUCT: 1,
    ENTREPRENEUR: 2,
}

const favoriteRequests = {
    ADD_TO_FAVORITE: 1,
    REMOVE_FAVORITE: 0
}

const appTypes = {
    USER_APP: 1,
    ENTREPRENEUR_APP: 2,
}

const dealStatuses = {
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

const scheduleTypes = {
    DAYS: 1,
    DATES: 2
}

const statsTypes = {
    ACTION_CLICK: 1,
    EVENT_CLICK: 2,
    HOT_DEAL_CLICK: 3,
    CLICK_ON_CALL: 4,
    REDIRECT_TO_WEBSITE: 5,
    PROFILE_VISITED: 6,
    DEALS_SAVED_BOOKED: 7,
    NEW_CHAT_INITIATED: 8,
    SAVED_AS_FAVORITE: 9,
    TOTAL_REQUESTS: 10,
    REQUESTS_ACCEPTED: 11,
    REQUESTS_REJECTED: 12,
    REQUESTS_NOT_ANSWERED: 13,
    DEALS_REDEEMED: 14,
    CLICK_ON_INFO: 15,
    REDIRECT_TO_GOOGLE_MAP: 16,
    MESSENGER_CLICK: 26,
}

const notificationTypes = {
    MESSAGE: 1,
    FOR_PRODUCT: 2,
    FROM_SUPER_ADMIN: 3,
    MARK_ENT_FAV: 4,
    APPOINTMENT: 5,
}

const constants = {
    SPLASH_WAIT_TIME: 3000,
    BACK_WAIT_TIME: 3000,
    HANDLING_TIMEOUT: 500,
    PAGE_SIZE: 10,
    MIN_HEIGHT_FOR_FLAT_LIST: 180,
    CARD_UPPER_VIEW_HEIGHT_PERCENTAGE: 14.5,
    BIG_CARD_UPPER_HEIGHT_PERCENTAGE: 16,
    ADS_INTERVAL: 4000,
    LOGO_VIEW_HEIGHT_PERCENTAGE: 0.10,
    HEADER_IMAGE_HEIGHT_PERCENTAGE: 0.5234,
    MESSENGER_LISTING_REFRESH_INTERVAL: 5000,
    MESSAGE_REFRESH_INTERVAL: 5000,
    SAVED_DEAL_TIMER_INTERVAL: 1000,
    SHORT_DESCRIPTION_TRIM: 20,
    ANDROID: "android",
    IOS: "ios",
    TYPE_OF_USER: "TYPE_OF_USER",
    AUTH_TOKEN: "AUTH_TOKEN",
    GUEST_AUTH_TOKEN: "guestlogin",
    IS_USER_LOGGED_IN: "IS_USER_LOGGED_IN",
    LOGGED_IN_USER: "LOGGED_IN_USER",
    APPLE_USER: "APPLE_USER",
    EMAIL_REGULAR_EXPRESSION: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    MOBILE_REGULAR_EXPRESSION: /^\d+$/,
    COORDINATES: "COORDINATES",
    SELECTED_LANGUAGE: "SELECTED_LANGUAGE",
    CURRENT_SELECTED_LANGUAGE: "",
    CURRENT_COUNT_FOR_FAILURE: 5,
    EXTENSION_MINUTES: 30,
    APPOINTMENT_EXTENSION_MINUTES: 60,
    REDEEM_END_EXTENSION_MINUTES: 180,
    DISTANCE_FOR_CHECK_IN: 100, // meters
    EXTRA_DAYS_FOR_APPOINTMENTS: 180, // days
    INTERVAL_FOR_APPOINTMENTS: 5, // minutes
    CONTACT_US_EMAIL_ID: "contactus@blocally.de",
    CHAR_MAX_LIMIT: 20,
    CONTACT_NAME_LIMIT: 50,
    EMAIL_CHAR_MAX_LIMIT: 50,
    PHONE_CHAR_MAX_LIMIT: 15,
    PHONE_CHAR_MIN_LIMIT: 7, // if changing, then change in strings.js also mobile_should_be
    ADDRESS_CHAR_MAX_LIMIT: 100,
    NUM_OF_GUESTS_MAX_LIMIT: 3,
    NUM_OF_MAX_DEALS_LIMIT: 4,
    MAX_NUM_OF_DEAL: 1000,
    APPOINTMENT_NOTE_MAX_LIMIT: 200,
    OTP_CHAR_MAX_LIMIT: 4,
    // FCM
    FCM_TOKEN: "FCM_TOKEN",
    FCM_CHANNEL_ID: "BLocally-Channel",
    FCM_CHANNEL_NAME: "General",
    FCM_CHANNEL_DESCRIPTION: "Notifications regarding deals",
    FCM_GROUP_NOTIFICATION_ID: "BLocally-Group-Notification",
    FCM_GROUP_ID: "BLocally-Group",
    FCM_GROUP_NAME: "General",
    FCM_TAG: "BLocally-Tag",
    IS_CHAT_SCREEN: false,
    CURRENT_CHAT_ENT_ID: -1,

    SHOULD_SHOW_TIME_POPUP: "SHOULD_SHOW_TIME_POPUP",

    // API Response codes
    INVALID_AUTH_TOKEN_CODE: 102,
    PRODUCT_UNPUBLISHED: 135,
    ADD_APPOINTMENT_LIMIT_REACHED: 137,
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
    tabTextSize: 12,
    buttonWidth: '100%',
    cardBorderRadius: 15,
    errorTextSize: 12,
    scrollViewHorizontalPadding: 30,
}

const fontNames = {
    regularFont: "SFProDisplay-Regular",
    boldFont: "SFProDisplay-Bold",
    lightFont: "SFProDisplay-Light",
    mediumFont: "SFProDisplay-Medium",
}

const languages = {
    english: "en",
    german: "de"
}

const checkinType = {
    SAVED: 1,
    BOOKED: 2,
    BONUS: 3
}

const productDuration = {
    DAILY: 1,
    WEEKLY: 2,
    MONTHLY: 3,
    YEARLY: 4
}

export {
    urls, screenNames, constants, sizes, userTypes, fontNames, itemTypes, categoryTypes, gender,
    languages, productSortBy, appointmentRequestStatus, favoriteType, favoriteRequests, appTypes,
    dealStatuses, productOrderBy, appointmentSortType, scheduleTypes, statsTypes, databaseConstants,
    notificationTypes, checkinType, productDuration,
}