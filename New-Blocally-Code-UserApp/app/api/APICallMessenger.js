import { urls, screenNames, constants, databaseConstants } from '../config/constants'
import strings from '../config/strings'
import { alertDialog } from '../utilities/HelperFunctions'
import NetInfo from "@react-native-community/netinfo";
import NavigationService from '../config/NavigationService';
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'
import ProductMenuSchema from '../database/ProductMenuSchema'
import ProductSchedulerSchema from '../database/ProductSchedulerSchema'
import DealsSchema from '../database/DealsSchema'
import Realm from 'realm'

let counter = 0

/**
 * Functions to hit APIs for Messenger
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
                    // console.log("API Response " + api + " " + JSON.stringify(jsonResponse))

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
                                if (jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                                    if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
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
                                                    // alertDialog("", error);
                                                });

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
                    }, constants.HANDLING_TIMEOUT)
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
                                let obj = {
                                    isComingFromException: true
                                };
                                failureCallBack(obj)
                            } else {
                                alertDialog("", strings.something_went_wrong)
                            }
                        }, constants.HANDLING_TIMEOUT)
                    }
                })
        } else {
            if (showLoader) {
                showLoader(false)
            }
            setTimeout(() => {
                alertDialog("", strings.internet_not_connected)
            }, constants.HANDLING_TIMEOUT)
        }
    });
}

export { hitApi }