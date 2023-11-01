import { urls, constants, screenNames } from '../config/Constants'
import strings from '../config/Strings'
import { alertDialog } from '../utilities/HelperFunctions'
import NetInfo from "@react-native-community/netinfo";
import AsyncStorageHelper from '../utilities/AsyncStorageHelper';
import NavigationService from '../config/NavigationService';

let counter = 0

/**
 * Common Functions to hit APIs
 * @param api - name of the API
 * @param method - Get/Post
 * @param params - Params to be passed
 * @param showLoader - method to manage loader 
 * @param successCallBack - callback to be called in case of success
 * @param failureCallBack - optional param - callback to be called in case of failure
 */
const hitApi = (api, method, params, showLoader, successCallBack, failureCallBack) => {
    NetInfo.fetch().then(state => {
        if (state.isConnected) {
            if (showLoader) {
                showLoader(true)
            }

            // console.log("Url " + (urls.BASE_URL + api))
            // console.log("Params " + JSON.stringify(params))
            fetch(urls.BASE_URL + api, {
                method: method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            })
                .then((response) => response.json())
                .then((jsonResponse) => {
                    // console.log("API Response " + JSON.stringify(jsonResponse))

                    counter = 0;

                    if (showLoader) {
                        showLoader(false)
                    }

                    setTimeout(() => {
                        if (jsonResponse.success === true) {
                            successCallBack(jsonResponse)
                        } else {
                            if (failureCallBack) {
                                failureCallBack(jsonResponse)
                            } else {
                                if (jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                                    if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                                        alertDialog("", jsonResponse.message, strings.ok, "", () => {
                                            AsyncStorageHelper.clearAsyncStorage().then(() => {
                                                NavigationService.startStackFrom(screenNames.LOGIN_SCREEN);
                                            })
                                        })
                                    } else {
                                        alertDialog("", jsonResponse.message)
                                    }
                                } else {
                                    alertDialog("", strings.could_not_connect_server)
                                }
                            }
                        }
                    }, 100)
                })
                .catch((error) => {
                    // console.log(error);

                    counter++
                    if (counter < constants.CURRENT_COUNT_FOR_FAILURE) {
                        hitApi(api, method, params, showLoader, successCallBack, failureCallBack)
                    } else {
                        if (showLoader) {
                            showLoader(false)
                        }
                        setTimeout(() => {
                            if (failureCallBack) {
                                failureCallBack()
                            } else {
                                alertDialog("", strings.something_went_wrong)
                            }
                        }, constants.HANDLING_TIMEOUT)
                    }
                })
        } else {
            alertDialog("", strings.internet_not_connected)
        }
    });
}

export { hitApi }