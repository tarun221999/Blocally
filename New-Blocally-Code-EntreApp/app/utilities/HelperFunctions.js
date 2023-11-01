import { Dimensions, Image, Alert, Linking } from 'react-native'
import React, { Component } from 'react'
import TextComponent from '../components/TextComponent'
import { StackActions, NavigationActions } from 'react-navigation'
import NetInfo from "@react-native-community/netinfo"
import { constants, languages, fontNames, screenNames } from '../config/Constants'
import AsyncStorageHelper from './AsyncStorageHelper'
import strings from '../config/Strings'
import Colors from '../config/Colors'

// Returns only initials from the name
const getInitialsFromName = (name) => {
    let initials = name.match(/\b\w/g) || [];
    initials = ((initials.shift() || '') + (initials.shift() || '')).toUpperCase();
    return initials;
}

// returns current device's screen dimensions
const getScreenDimensions = () => {
    return Dimensions.get('window')
}

/**
 * Common function to change the stack
 * @param navigation - Navigation object
 * @param screenName - Next screen where to take user
 * @param params - Optional Param - Params that need to be passed to new screen
 */
const startStackFrom = (navigation, screenName) => {
    const resetAction = StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate(
            {
                routeName: screenName,
            }
        )],
    })
    navigation.dispatch(resetAction)
}

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

// Returns boolean if network is connected or not
const isNetworkConnected = async () => {
    return NetInfo.fetch().then(state => {
        return state.isConnected
    })
}

// Returns boolean whether the user is logged in or not
const isUserLoggedIn = async () => {
    return AsyncStorageHelper.getStringAsync(constants.IS_USER_LOGGED_IN)
        .then((isUserLoggedIn) => {
            return isUserLoggedIn
        })
}

// returns the passed image's dimensions
const getImageDimensions = (image) => {
    return Image.resolveAssetSource(image)
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

// Returns the current user's business id
const getBuissnessId = async () => {
    return AsyncStorageHelper.getStringAsync(constants.BUISSNESS_ID)
        .then((id) => {
            return id
        })
}

// Returns the currently logged in User's auth token
const getAuthToken = async () => {
    return isUserLoggedIn()
        .then(async (isUserLoggedIn) => {
            if (isUserLoggedIn && isUserLoggedIn === 'true') {
                return AsyncStorageHelper.getStringAsync(constants.LOGGED_IN_USER)
                    .then((userStr) => {
                        let userObject = JSON.parse(userStr)
                        return userObject.authToken
                    })
            } else {
                return null
            }
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
    return localDateTime.toISOString();
}

// Returns parsed Date & Time
const parseDateTime = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let d = localDateTime.getUTCDate()
    if(d < 10){
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

// Combine date and time to a single new date object
const combineDateTime = (date, time) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0)
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

// Returns UTC Date
const getUTConlyDate = (localDateTime) => {
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

// Returns parsed date
const parseDate = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let d = localDateTime.getUTCDate()
    if(d < 10){
        d = "0" + d;
    }
    let month = localDateTime.getUTCMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    return d + "." + month + "." + localDateTime.getUTCFullYear()
}

// Returns parsed local date
const parseLocalDate = (localDateTime) => {
    let d = localDateTime.getDate()
    if(d < 10){
        d = "0" + d;
    }
    let month = localDateTime.getMonth() + 1;
    if (month < 10) {
        month = "0" + month
    }
    return d + "." + month + "." + localDateTime.getFullYear()
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

// Adds one date to the passed date
const plusOneDay = (date) => {
    date.setDate(date.getDate() + 1);
    return date
}

// Returns current milliseconds
const getCurrentMilliseconds = () => {
    let date = new Date();
    date.setMinutes(date.getMinutes() + getExactTimeOffset());
    return date.getTime()
}

// Returns the color based on index
const getColor = (index) => {
    if (index % 4 === 1) {
        return Colors.randomPurple
    }
    else if (index % 4 === 2) {
        return Colors.randomGreen
    }
    else if (index % 4 === 3) {
        return Colors.randomOliveGreen
    }
    else if (index % 4 === 4 || index % 4 === 0) {
        return Colors.randomBrickRed
    }
}

// Returns parsed time
const parseTime = (utcDateTime, toReturnUnit) => {
    let localDateTime = new Date(utcDateTime);
    let hours = localDateTime.getUTCHours()
    let minutes = localDateTime.getUTCMinutes()
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    let unitDate = toReturnUnit ? " Uhr" : ""
    let temp = hours + ":" + minutes + unitDate
    return temp
}

// Returns parsed time
const parseTime2 = (utcDateTime) => {
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

// Returns only date
const getOnlyDate = (utcDateTime) => {
    let localDateTime = new Date(utcDateTime);
    let d = localDateTime.getUTCDate()
    if(d < 10){
        d = "0" + d;
    }
    return d;
}

// Returns only month
const getOnlyMonth = (utcDateTime) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    let localDateTime = new Date(utcDateTime);
    return monthNames[localDateTime.getUTCMonth()]
}

// Returns Text Component with bold text
const getBoldText = (text) => {
    return <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: 13, color: Colors.black }}>{text}</TextComponent>
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

// Constant for item types
const itemTypes = {
    ACTION: 1,
    EVENT: 2,
    HOT_DEAL: 3,
    BOOK: 4,
    BONUS_DEAL: 5
}

// Returns type for type of screen
const getTypeOfScreenName = (type) => {
    return type === itemTypes.ACTION ? strings.actions
        : type === itemTypes.EVENT ? strings.events :
            type === itemTypes.BONUS_DEAL ? strings.bonus_deals
                : strings.hot_deals
}

// Returns header based on type
const getHeaderNameByScreenType = (type) => {
    return type === itemTypes.ACTION ? require('../assets/actionsHeader.png') : type === itemTypes.EVENT ? require('../assets/eventsHeader.png') : require('../assets/hotDealsHeader.png')
}

// Returns icon based on product type
const getIconByDealType = (type) => {
    return type === itemTypes.HOT_DEAL ? require('../assets/hotDeal.png')
        : type === itemTypes.BONUS_DEAL ? require('../assets/bonusBadge.png')
            : ""
}

// Returns stats value
const getStatsValueByIndex = (productObject, index) => {
    if (index == 0) {
        return productObject.totalClicks
    } else if (index == 1) {
        return productObject.hotDealBooked
    } else if (index == 2) {
        return productObject.hotDealCheckIn
    } else if (index == 3) {
        return productObject.hotDealRedeemed
    } else if (index == 4) {
        return productObject.hotDealScanned
    } else {
        return productObject.productInfoButtonClick
    }
}

// Returns stats for bonus deal
const getBonusStatsValueByIndex = (productObject, index) => {
    if (index == 0) {
        return productObject.totalClicks
    } else if (index == 1) {
        return productObject.hotDealSaved
    } else if (index == 2) {
        return productObject.hotDealRedeemed
    } else if (index == 3) {
        return productObject.hotDealScanned
    } else if (index == 4) {
        return productObject.dealExpired
    } else if (index == 5) {
        return productObject.productInfoButtonClick
    }
}

// Returns stats for Actions & Events
const getActionEventStatsValueByIndex = (productObject, index) => {
    if (index == 0) {
        return productObject.totalClicks
    } else if (index == 1) {
        return productObject.hotDealBooked
    } else if (index == 2) {
        return productObject.productCallButtonClick
    } else if (index == 3) {
        return productObject.productMessenger
    } else if (index == 4) {
        return productObject.productRedirectToWebsite
    } else if (index == 5) {
        return productObject.productInfoButtonClick
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

// Returns boolean value if a date lies in Start and End Date object
const checkIfDateIsInRange = (d, start, end) => {
    return (start <= d && d <= end);
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

// Assign colors to holidays
const assignColorsForHolidays = (oldData, newData, colorsArrayLength) => {
    if (oldData.length > 0) {
        for (let i = 0, colorIndex = 0; i < newData.length; i++) {
            let current = newData[i]
            if (i === 0) {
                let previous = oldData[oldData.length - 1]
                let currentDate = new Date(current.startDateTime)
                let previousDate = new Date(previous.startDateTime)

                colorIndex = previous.bgColorIndex

                if (!checkIfUTCDatesAreSameDay(currentDate, previousDate)) {
                    colorIndex++
                    if (colorIndex === colorsArrayLength) {
                        colorIndex = 0
                    }
                }
                current.bgColorIndex = colorIndex
            } else {
                let previous = newData[i - 1]

                let currentDate = new Date(current.startDateTime)
                let previousDate = new Date(previous.startDateTime)

                if (!checkIfUTCDatesAreSameDay(currentDate, previousDate)) {
                    colorIndex++
                    if (colorIndex === colorsArrayLength) {
                        colorIndex = 0
                    }
                }
                current.bgColorIndex = colorIndex
            }
        }
    } else {
        for (let i = 0, colorIndex = 0; i < newData.length; i++) {
            let current = newData[i]
            if (i === 0) {
                current.bgColorIndex = colorIndex
            } else {
                let previous = newData[i - 1]

                let currentDate = new Date(current.startDateTime)
                let previousDate = new Date(previous.startDateTime)

                if (!checkIfUTCDatesAreSameDay(currentDate, previousDate)) {
                    colorIndex++
                    if (colorIndex === colorsArrayLength) {
                        colorIndex = 0
                    }
                }
                current.bgColorIndex = colorIndex
            }
        }
    }
    return newData
}

// Returns plain text from HTML string
const getPlainTextFromHtml = (htmlText) => {
    if (htmlText) {
        return htmlText.replace(/<[^>]+>/g, '')
    } else {
        return ""
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
            if (jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                    alertDialog("", jsonResponse.message, strings.ok, "", () => {
                        AsyncStorageHelper.clearAsyncStorage().then(() => {
                            startStackFrom(navigation, screenNames.LOGIN_SCREEN);
                        })
                    })
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

// Changes 1/0 to true/false
const changeToBooleanForAppointments = (data) => {
    data.forEach(appointment => {
        if(appointment.isMessageActive == 1){
            appointment.isMessageActive = true
        } else if (appointment.isMessageActive == 0) {
            appointment.isMessageActive = false
        }
        if(appointment.productEnableMessage == 1){
            appointment.productEnableMessage = true
        } else if (appointment.productEnableMessage == 0) {
            appointment.productEnableMessage = false
        }
    });
    return data;
}

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

export {
    getInitialsFromName, getUTConlyDate, getTimeOffset, getStatsValueByIndex, combineDateTime, getUTCDateTimeFromLocalDateTime,
    assignColors, checkIfDatesAreSameDay, getBuissnessId, getCurrencyFormat, toGermanCurrency, parseTimeWithoutUnit, parseTime2,
    itemTypes, getTypeOfScreenName, getHeaderNameByScreenType, getScreenDimensions, startStackFrom, alertDialog, getAuthToken,
    isNetworkConnected, getLoggedInUser, getIconByDealType, getCommonParamsForAPI, getImageDimensions, parseTextForCard,
    parseDiscountApplied, getSelectedLanguage, getCurrentUTCDateTime, getCurrentISODateTime, parseDateTime, parseDate, getColor,
    parseTime, getOnlyDate, getOnlyMonth, getBoldText, getPlainTextFromHtml, handleErrorResponse, plusOneDay,
    getBonusStatsValueByIndex, parseLocalDate, getCircularReplacer, changeToBooleanForAppointments,
    checkIfDateIsInRange, getActionEventStatsValueByIndex, assignColorsForHolidays, parseLocalTime,
    compareMessages, openUrlInBrowser, getLocalDateTimeFromLocalDateTime, getCurrentLocalDateTime, getExactTimeOffset,
    isUserLoggedIn, checkIfUTCDatesAreSameDay, getCurrentMilliseconds,
}