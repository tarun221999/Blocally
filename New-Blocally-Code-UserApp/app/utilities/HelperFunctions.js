import { Alert, Dimensions, Linking, Image } from 'react-native'
import { StackActions, NavigationActions } from 'react-navigation'
import strings from '../config/strings'
import AsyncStorageHelper from './AsyncStorageHelper'
import { constants, languages, screenNames, urls, databaseConstants } from '../config/constants'
import NetInfo from "@react-native-community/netinfo";
import { getDistance } from 'geolib';
import { hitApi } from '../api/APICall'
import notifee from '@notifee/react-native';
import ProductMenuSchema from '../database/ProductMenuSchema'
import ProductSchedulerSchema from '../database/ProductSchedulerSchema'
import DealsSchema from '../database/DealsSchema'
import Realm from 'realm'

/**
 * File having common helper functions for reuse
 */

/**
 * Function to show Alert Message
 * @param title - Title of Alert
 * @param message - Message to be shown in Alert
 * @param okText - Optional Param - text to be shown for Ok button
 * @param cancelText - Optional Param - text to be shown for Cancel button
 * @param onOkPress - Optional Param - click listener for Ok button
 */
const alertDialog = (title, message, okText, cancelText, onOkPress) => {
    if (!okText) {
        okText = ""
    }
    if (!cancelText) {
        cancelText = ""
    }

    setTimeout(() => {
        Alert.alert(
            title,
            message,
            [
                {
                    text: okText ? okText : strings.ok,
                    onPress: () => {
                        if (onOkPress) {
                            onOkPress();
                        } else {
                            /* Do Nothing */
                        }
                    }
                },
                cancelText && {
                    text: cancelText,
                    onPress: () => { /* Do nothing */ },
                    style: 'cancel'
                }
            ]
        );
    }, constants.HANDLING_TIMEOUT)

}

// returns current device's screen dimensions
const getScreenDimensions = () => {
    return Dimensions.get('screen')
}

// returns the passed image's dimensions
const getImageDimensions = (image) => {
    return Image.resolveAssetSource(image)
}

// Returns boolean whether the user is logged in or not
const isUserLoggedIn = async () => {
    return AsyncStorageHelper.getStringAsync(constants.IS_USER_LOGGED_IN)
        .then((isUserLoggedIn) => {
            return isUserLoggedIn
        })
}

// Returns the currently logged in User object
const getLoggedInUser = async () => {
    return AsyncStorageHelper.getStringAsync(constants.LOGGED_IN_USER)
        .then((userStr) => {
            let userObject = JSON.parse(userStr)
            return userObject
        })
}

// Returns the currently logged in User's auth token
const getAuthToken = async () => {
    return isUserLoggedIn()
        .then((isUserLoggedIn) => {
            if (isUserLoggedIn && isUserLoggedIn === 'true') {
                return AsyncStorageHelper.getStringAsync(constants.LOGGED_IN_USER)
                    .then((userStr) => {
                        let userObject = JSON.parse(userStr)
                        return userObject.authToken
                    })
            } else {
                return constants.GUEST_AUTH_TOKEN
            }
        })
}

/**
 * Common function to change the stack
 * @param navigation - Navigation object
 * @param screenName - Next screen where to take user
 * @param params - Optional Param - Params that need to be passed to new screen
 */
const startStackFrom = (navigation, screenName, params) => {
    const resetAction = StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate(
            {
                routeName: screenName,
                params
            }
        )],
    })
    navigation.dispatch(resetAction)
}

/**
 * Common function to get unread counts from the API
 * And set in the app and as badge count
 */ 
const getUnreadCounts = async (navigation) => {
    isUserLoggedIn()
        .then((isUserLoggedIn) => {
            if (isUserLoggedIn && isUserLoggedIn === 'true') {
                getCommonParamsForAPI().then((commonParams) => {
                    const params = {
                        ...commonParams,
                    }

                    hitApi(urls.GET_UNREAD_COUNT, urls.POST, params, null, (jsonResponse) => {
                        let unreadMessages = jsonResponse.response.unreadMessagesCount;
                        let unreadAppointments = jsonResponse.response.unreadAppointmentsCount;
                        let unreadNotifications = jsonResponse.response.unreadAdminNotificationsCount;
                        let count = unreadMessages + unreadAppointments + unreadNotifications;
                        const setParamsForMyArea = NavigationActions.setParams({
                            params: {
                                badgeCount: count,
                                unreadMessages,
                                unreadAppointments,
                                unreadNotifications
                            },
                            key: screenNames.MY_AREA,
                        });
                        navigation.dispatch(setParamsForMyArea);
                        // firebase.notifications().setBadge(count)
                        notifee.setBadgeCount(count)
                    })
                })
            }
        })
}

// Get currently chosen language by the user
const getSelectedLanguage = async () => {
    return AsyncStorageHelper.getStringAsync(constants.SELECTED_LANGUAGE)
        .then((selectedLanguage) => {
            if (selectedLanguage) {
                return selectedLanguage;
            } else {
                // Commenting the following as only German is required

                // if not yet set, then set default language
                /* let defaultLanguage = strings.getLanguage()
                if (defaultLanguage.includes("de")) {
                    defaultLanguage = languages.german
                } else {
                    defaultLanguage = languages.english
                } */

                // Changing to German only
                let defaultLanguage = languages.german
                return AsyncStorageHelper.saveStringAsync(constants.SELECTED_LANGUAGE, defaultLanguage)
                    .then(() => {
                        return defaultLanguage;
                    })
            }
        })
}

// Returns the common params required to hit APIs
const getCommonParamsForAPI = async () => {
    return getSelectedLanguage().then(async (selectedLanguage) => {
        return getAuthToken().then((authToken) => {
            const params = {
                authToken: authToken,
                lang: selectedLanguage,
            }
            return params
        })
    })
}

// Returns boolean if network is connected or not
const isNetworkConnected = async () => {
    return NetInfo.fetch().then(state => {
        return state.isConnected
    })
}

// Common function to open a URL in the browser
const openUrlInBrowser = (url) => {
    if (url) {
        if (!(url.startsWith('http') || url.startsWith('https'))) {
            url = 'http://' + url;
        }
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                console.log("Cannot open URL " + url);
            }
        });
    }
}

// Common function to open a number in the dialer
const openNumberInDialer = (number) => {
    if (number) {
        let url = `tel:${"+" + number}`
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url)
            } else {
                console.log("Cannot open URL " + url);
            }
        });
    }
}

// Returns only the date
const getOnlyDate = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let d = localDateTime.getUTCDate()
    if (d < 10) {
        d = "0" + d;
    }
    return d;
}

// Returns only the month
const getOnlyMonth = (utcDateTime) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    let localDateTime = new Date(utcDateTime);
    return monthNames[localDateTime.getUTCMonth()]
}

// Returns parsed time
const parseTime = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let hours = localDateTime.getUTCHours()
    let minutes = localDateTime.getUTCMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes + " Uhr"
}

// Returns parsed time without any units
const parseTimeWithoutUnit = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let hours = localDateTime.getUTCHours()
    let minutes = localDateTime.getUTCMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes
}

// Returns parsed date
const parseDate = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let month = localDateTime.getUTCMonth() + 1;
    let d = localDateTime.getUTCDate()
    if (d < 10) {
        d = "0" + d;
    }
    if (month < 10) {
        month = "0" + month
    }
    return d + "." + month + "." + localDateTime.getUTCFullYear()
}

// Returns parsed Date & Time
const parseDateTime = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let d = localDateTime.getUTCDate()
    if (d < 10) {
        d = "0" + d;
    }
    let month = localDateTime.getUTCMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    let hours = localDateTime.getUTCHours()
    let minutes = localDateTime.getUTCMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return d + "." + month + "." + localDateTime.getUTCFullYear() + " " + hours + ":" + minutes + " Uhr"
}

// Returns parsed local date
const parseLocalDate = (localDateTime) => {
    let d = localDateTime.getDate()
    if (d < 10) {
        d = "0" + d;
    }
    let month = localDateTime.getMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    return d + "." + month + "." + localDateTime.getFullYear()
}

// Returns parsed local date & time
const parseLocalDateTime = (localDateTime) => {
    let d = localDateTime.getDate()
    if (d < 10) {
        d = "0" + d;
    }
    let month = localDateTime.getMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    let hours = localDateTime.getHours()
    let minutes = localDateTime.getMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return d + "." + month + "." + localDateTime.getFullYear() + " " + hours + ":" + minutes + " Uhr"
}

// Returns parsed local time
const parseLocalTime = (localDateTime) => {
    let hours = localDateTime.getHours()
    let minutes = localDateTime.getMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes + " Uhr"
}

// Returns parsed local time without units
const parseLocalTimeWithoutUnit = (localDateTime) => {
    let hours = localDateTime.getHours()
    let minutes = localDateTime.getMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

// Returns day from utc date time
const getDayFromUtcDateTime = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime)
    return localDateTime.getUTCDay()
}

/**
 * Common function to parse text to be shown on card
 * @param shortDescription - The Text to be parsed
 * @param length - Optional param - number to substr the characters, if not passed default value is used
 * @returns parsed text
 */
const parseTextForCard = (shortDescription, length) => {
    if (shortDescription) {
        if (shortDescription.length > (length ? length : constants.SHORT_DESCRIPTION_TRIM)) {
            shortDescription = shortDescription.substr(0, length ? length : constants.SHORT_DESCRIPTION_TRIM) + "..."
        }
        return shortDescription
    } else {
        return "";
    }
}

// Returns parsed discount value
const parseDiscountApplied = (discount) => {
    let decimalPlaces = 2;
    return +(Math.round(discount + "e+" + decimalPlaces) + "e-" + decimalPlaces);
}

// Returns current local date time in required format
const getCurrentLocalDateTime = () => {
    let localDateTime = new Date();
    let date = localDateTime.getDate()
    if (date < 10) {
        date = "0" + date
    }
    let month = localDateTime.getMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    let hours = localDateTime.getHours()
    let minutes = localDateTime.getMinutes()
    let seconds = localDateTime.getSeconds()
    if (hours < 10) {
        hours = "0" + hours
    }
    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    return localDateTime.getFullYear() + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}

// Returns current UTC date time in required format
const getCurrentUTCDateTime = () => {
    let localDateTime = new Date();
    let date = localDateTime.getUTCDate()
    if (date < 10) {
        date = "0" + date
    }
    let month = localDateTime.getUTCMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    let hours = localDateTime.getUTCHours()
    let minutes = localDateTime.getUTCMinutes()
    let seconds = localDateTime.getUTCSeconds()
    if (hours < 10) {
        hours = "0" + hours
    }
    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    return localDateTime.getUTCFullYear() + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}

// Returns current date time in ISO format
const getCurrentISODateTime = () => {
    let localDateTime = new Date();

    let offset = getExactTimeOffset()
    localDateTime.setMinutes(localDateTime.getMinutes() + offset)

    return localDateTime.toISOString();
}

// Returns hours and minutes calculated from passed minutes
const getHoursMinutesFromMinutes = (minutes) => {
    let hours = Math.floor(minutes / 60)
    minutes = Math.floor(minutes % 60)
    return (hours > 0 ? hours + " h " : "") + (minutes > 0 ? minutes + (minutes === 1 ? " min" : " mins") : "")
}

/**
 * Get minutes left from current date time till the date time passed
 */
const getMinutesTillDate = (utcFromServer) => {
    let today = new Date();
    let serverLocalDate = new Date(utcFromServer);

    var diff = Math.abs(today - serverLocalDate);
    var minutes = Math.floor((diff / 1000) / 60);
    return minutes;
}

// Get number of minutes between two date objects
const getMinutesBetweenTwoDates = (date1, date2) => {
    var diff = Math.abs(date1 - date2);
    var minutes = Math.floor((diff / 1000) / 60);
    return minutes;
}

/**
 * Adds number of minutes to the date object
 * Not being used as of now
 */
const addMinutesToADate = (utcDateTime, minutes) => {
    let localDateTime = new Date(utcDateTime);
    localDateTime.setMinutes(localDateTime.getMinutes() + minutes)
    let d = localDateTime.getUTCDate()
    if (d < 10) {
        d = "0" + d;
    }
    let month = localDateTime.getUTCMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    return d + "." + month + "." + localDateTime.getUTCFullYear()
}

/**
 * Adds Minutes to date object and returns only time
 * Not being used as of now
 */
const addMinutesToADateGetTime = (utcDateTime, minutesToBeAdded) => {
    let localDateTime = new Date(utcDateTime);
    localDateTime.setMinutes(localDateTime.getMinutes() + minutesToBeAdded)

    let hours = localDateTime.getUTCHours()
    let minutes = localDateTime.getUTCMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes + " Uhr"
}

// Combine date and time to a single new date object
const combineDateTime = (date, time) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0)
}

// Returns UTC date time from the passed local date time object
const getUTCDateTimeFromLocalDateTime = (localDateTime) => {
    let date = localDateTime.getUTCDate()
    if (date < 10) {
        date = "0" + date
    }
    let month = localDateTime.getUTCMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    let hours = localDateTime.getUTCHours()
    let minutes = localDateTime.getUTCMinutes()
    let seconds = localDateTime.getUTCSeconds()
    if (hours < 10) {
        hours = "0" + hours
    }
    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    return localDateTime.getUTCFullYear() + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}

// Returns local date time in format from date object
const getLocalDateTimeFromLocalDateTime = (localDateTime) => {
    let date = localDateTime.getDate()
    if (date < 10) {
        date = "0" + date
    }
    let month = localDateTime.getMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    let hours = localDateTime.getHours()
    let minutes = localDateTime.getMinutes()
    let seconds = localDateTime.getSeconds()
    if (hours < 10) {
        hours = "0" + hours
    }
    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    return localDateTime.getFullYear() + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}

// Returns date time in ISO format from passed local date object
const getISODateTimeFromLocalDateTime = (localDateTime) => {
    return localDateTime.toISOString();
}

// Returns format string from local date time
const getStringDateFromLocalDateTime = (localDateTime) => {
    let date = localDateTime.getDate()
    if (date < 10) {
        date = "0" + date
    }
    let month = localDateTime.getMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    return localDateTime.getFullYear() + "-" + month + "-" + date
}

// Returns boolean value if a date lies in Start and End Date object
const checkIfDateIsInRange = (d, start, end) => {
    return (start <= d && d <= end);
}

// Returns boolean value if a date lies in Start and End Date object
const checkIfDateIsInRangeHotDeal = (d, start, end) => {
    return (start <= d && d < end);
}

// Returns boolean if a time lies in start and end date objects
const checkIfTimeIsInRange = (d, start, end) => {
    if (start.getHours() < d.getHours() && d.getHours() < end.getHours()) {
        return true;
    } else if (start.getHours() == d.getHours()) {
        if (d.getHours() == end.getHours()) {
            if (start.getMinutes() <= d.getMinutes() && d.getMinutes() <= end.getMinutes()) {
                return true
            } else {
                return false
            }
        } else if (start.getMinutes() <= d.getMinutes()) {
            return true
        } else {
            return false
        }
    } else if (d.getHours() == end.getHours()) {
        if (d.getMinutes() <= end.getMinutes()) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

// Returns boolean if two dates are same day
const checkIfDatesAreSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

// Returns boolean if two utc dates are same day
const checkIfUTCDatesAreSameDay = (date1, date2) => {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate();
}

// Returns boolean if two times are same
const checkIfTimesAreSame = (date1, date2) => {
    return date1.getHours() === date2.getHours() &&
        date1.getMinutes() === date2.getMinutes() &&
        date1.getSeconds() === date2.getSeconds()
}

// Returns the time offset
const getTimeOffset = () => {
    // const date = new Date();
    // return (date.getTimezoneOffset() * -1);

    // Changing to 0, as per change in requirement
    return 0;
}

// Returns the time offset
const getExactTimeOffset = () => {
    const date = new Date();
    return (date.getTimezoneOffset() * -1);
}

// Returns the time offset of the passed date
const getExactTimeOffsetFromDate = (date) => {
    return (date.getTimezoneOffset() * -1);
}

// Common function to adjust time as per day light saving
const adjustTimeForDaylight = (date) => {
    let current = new Date();
    let currentOffset = current.getTimezoneOffset() * -1

    let receivedOffset = date.getTimezoneOffset() * -1

    if (receivedOffset > currentOffset) {
        let diff = receivedOffset - currentOffset
        date.setMinutes(date.getMinutes() - diff)
    } else if (receivedOffset < currentOffset) {
        let diff = currentOffset - receivedOffset
        date.setMinutes(date.getMinutes() + diff)
    }

    return date
}

// Returns the day of the week value
const getDayOfWeek = () => {
    const date = new Date();
    return (date.getDay() + 1);
}

// Returns value in German currency
const toGermanCurrency = (amount, decimals, decimal_sep, thousands_sep) => {
    let n = amount;
    let c = isNaN(decimals) ? 2 : Math.abs(decimals);
    let d = decimal_sep || '.';
    let t = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
    let sign = (n < 0) ? '-' : '';
    let i = parseInt(n = Math.abs(n).toFixed(c)) + '';
    let j;
    j = ((j = i.length) > 3) ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
}

// Returns value in Currency format
const getCurrencyFormat = (amount) => {
    var currency = { euro: '€', pound: '£', dollar: '$' };
    if (constants.CURRENT_SELECTED_LANGUAGE === languages.german) {
        return toGermanCurrency(amount, 2, ',', '.') + ' ' + currency.euro;
    } else {
        return toGermanCurrency(amount, 2, '.', ',') + ' ' + currency.euro;
    }
}

/**
 * Common function to handle response in case of error
 * @param navigation - Navigation object
 * @param jsonResponse - The json response object that is received
 */
const handleErrorResponse = (navigation, jsonResponse) => {
    setTimeout(() => {
        if (jsonResponse) {
            if (jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                    clearAndMoveToLogin(navigation, jsonResponse)
                } else {
                    alertDialog("", jsonResponse.message)
                }
            } else {
                alertDialog("", strings.could_not_connect_server)
            }
        } else {
            alertDialog("", strings.something_went_wrong)
        }
    }, constants.HANDLING_TIMEOUT)
}

// Clear every local data and move to Login screen
const clearAndMoveToLogin = (navigation, jsonResponse) => {
    alertDialog("", jsonResponse.message, strings.ok, "", () => {
        Realm.open({
            schema: [ProductMenuSchema, ProductSchedulerSchema, DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                try {
                    realm.write(() => {
                        realm.deleteAll();
                    });
                } catch (e) {
                    // Do nothing
                }
            })
            .catch(error => {
                // console.log(error);
            });

        AsyncStorageHelper.clearAsyncStorage().then(() => {
            startStackFrom(navigation, screenNames.LOGIN_SCREEN);
        })
    })
}

// Returns only initials from the name
const getInitialsFromName = (name) => {
    let initials = name.match(/\b\w/g) || [];
    initials = ((initials.shift() || '') + (initials.shift() || '')).toUpperCase();
    return initials;
}

/**
 * Common function to assign colors for Appointments
 * @param oldData - Old data array
 * @param newData - New data received
 * @param colorsArrayLength - Colors array
 * @returns updated data
 */
const assignColors = (oldData, newData, colorsArrayLength) => {
    if (oldData.length > 0) {
        for (let i = 0, colorIndex = 0; i < newData.length; i++) {
            let currentAppointment = newData[i]
            if (i === 0) {
                let previousAppointment = oldData[oldData.length - 1]
                let currentDate = new Date(currentAppointment.appointmentDateTime ? currentAppointment.appointmentDateTime :
                    currentAppointment.appointmentStartDateTime)
                let previousDate = new Date(previousAppointment.appointmentDateTime ? previousAppointment.appointmentDateTime :
                    previousAppointment.appointmentStartDateTime)

                colorIndex = previousAppointment.bgColorIndex

                if (!checkIfUTCDatesAreSameDay(currentDate, previousDate)) {
                    colorIndex++
                    if (colorIndex === colorsArrayLength) {
                        colorIndex = 0
                    }
                }
                currentAppointment.bgColorIndex = colorIndex
            } else {
                let previousAppointment = newData[i - 1]

                let currentDate = new Date(currentAppointment.appointmentDateTime ? currentAppointment.appointmentDateTime :
                    currentAppointment.appointmentStartDateTime)
                let previousDate = new Date(previousAppointment.appointmentDateTime ? previousAppointment.appointmentDateTime :
                    previousAppointment.appointmentStartDateTime)

                if (!checkIfUTCDatesAreSameDay(currentDate, previousDate)) {
                    colorIndex++
                    if (colorIndex === colorsArrayLength) {
                        colorIndex = 0
                    }
                }
                currentAppointment.bgColorIndex = colorIndex
            }
        }
    } else {
        for (let i = 0, colorIndex = 0; i < newData.length; i++) {
            let currentAppointment = newData[i]
            if (i === 0) {
                currentAppointment.bgColorIndex = colorIndex
            } else {
                let previousAppointment = newData[i - 1]

                let currentDate = new Date(currentAppointment.appointmentDateTime ? currentAppointment.appointmentDateTime :
                    currentAppointment.appointmentStartDateTime)
                let previousDate = new Date(previousAppointment.appointmentDateTime ? previousAppointment.appointmentDateTime :
                    previousAppointment.appointmentStartDateTime)

                if (!checkIfUTCDatesAreSameDay(currentDate, previousDate)) {
                    colorIndex++
                    if (colorIndex === colorsArrayLength) {
                        colorIndex = 0
                    }
                }
                currentAppointment.bgColorIndex = colorIndex
            }
        }
    }
    return newData
}

// Comparison of deals based on distance for sorting
const compareDealsForDistance = (one, two) => {
    let comparison = 0;
    if (one.distance > two.distance) {
        comparison = 1;
    } else if (one.distance < two.distance) {
        comparison = -1;
    }
    return comparison;
}

// Comparison of checked in deals for sorting
const compareCheckedInDeals = (one, two) => {
    let comparison = 0;
    let dateOne = new Date(one.dealAddedOn)
    let dateTwo = new Date(two.dealAddedOn)

    if (dateOne.getTime() < dateTwo.getTime()) {
        comparison = 1;
    } else if (dateOne.getTime() > dateTwo.getTime()) {
        comparison = -1;
    }
    return comparison;
}

// Comparison of redeemed deals for sorting
const compareRedeemedDeals = (one, two) => {
    let comparison = 0;
    let dateOne = new Date(one.dealRedeemedOn)
    let dateTwo = new Date(two.dealRedeemedOn)

    if (dateOne.getTime() < dateTwo.getTime()) {
        comparison = 1;
    } else if (dateOne.getTime() > dateTwo.getTime()) {
        comparison = -1;
    }
    return comparison;
}

// Comparison of expired deals for sorting
const compareExpiredDeals = (one, two) => {
    let comparison = 0;
    let dateOne = new Date(one.dealExpiredOn)
    let dateTwo = new Date(two.dealExpiredOn)

    if (dateOne.getTime() < dateTwo.getTime()) {
        comparison = 1;
    } else if (dateOne.getTime() > dateTwo.getTime()) {
        comparison = -1;
    }
    return comparison;
}

// Comparison of appointments for sorting
const compareAppointmentDateTimes = (one, two) => {
    let comparison = 0;
    let dateOne = new Date(one.startDateTime)
    let dateTwo = new Date(two.startDateTime)

    if (dateOne.getTime() < dateTwo.getTime()) {
        comparison = -1;
    } else if (dateOne.getTime() > dateTwo.getTime()) {
        comparison = 1;
    }
    return comparison;
}

// Returns plain text from HTML string
const getPlainTextFromHtml = (htmlText) => {
    if (htmlText) {
        return htmlText.replace(/<[^>]+>/g, '')
    } else {
        return ""
    }
}

// Returns calculated distance from lat & longs
const calculateDistance = (lat1, long1, lat2, long2) => {
    let distance = getDistance(
        { latitude: lat1, longitude: long1 },
        { latitude: lat2, longitude: long2 }
    );
    // console.log("distance " + distance)
    return distance / 1000;
}

// Returns distance in KM from passed Meters
const getKmFromMeters = (distanceInMeters) => {
    return distanceInMeters / 1000;
}

// Returns number of milliseconds from passed minutes
const getMillisecondsFromMinutes = (minutes) => {
    return minutes * 60 * 1000;
}

// Function to sort circular issue
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

// Comparison of chat messages for sorting
const compareMessages = (one, two) => {
    let comparison = 0;
    if (one.messageChatId > two.messageChatId) {
        comparison = 1;
    } else if (one.messageChatId < two.messageChatId) {
        comparison = -1;
    }
    return comparison;
}

// Export all the functions
export {
    alertDialog, getScreenDimensions, isUserLoggedIn, getAuthToken, getCommonParamsForAPI, isNetworkConnected, openUrlInBrowser,
    startStackFrom, getLoggedInUser, getImageDimensions, parseDate, parseDateTime, getOnlyDate, getOnlyMonth, parseTime,
    parseTextForCard, parseDiscountApplied, getHoursMinutesFromMinutes, getCurrentUTCDateTime, getMinutesTillDate,
    getMinutesBetweenTwoDates, addMinutesToADate, getCurrencyFormat, parseTimeWithoutUnit, addMinutesToADateGetTime,
    getSelectedLanguage, handleErrorResponse, getInitialsFromName, combineDateTime, getUTCDateTimeFromLocalDateTime,
    checkIfDateIsInRange, checkIfDatesAreSameDay, getTimeOffset, getCurrentISODateTime, parseLocalDateTime,
    getISODateTimeFromLocalDateTime, getDayOfWeek, assignColors, getStringDateFromLocalDateTime, checkIfTimesAreSame,
    parseLocalTimeWithoutUnit, parseLocalDate, checkIfTimeIsInRange, compareDealsForDistance, getPlainTextFromHtml,
    calculateDistance, getKmFromMeters, getMillisecondsFromMinutes, getCircularReplacer, openNumberInDialer,
    parseLocalTime, getDayFromUtcDateTime, compareCheckedInDeals, compareRedeemedDeals, compareExpiredDeals,
    getUnreadCounts, compareMessages, getCurrentLocalDateTime, getLocalDateTimeFromLocalDateTime,
    getExactTimeOffset, checkIfUTCDatesAreSameDay, getExactTimeOffsetFromDate, adjustTimeForDaylight,
    compareAppointmentDateTimes, clearAndMoveToLogin, checkIfDateIsInRangeHotDeal
}