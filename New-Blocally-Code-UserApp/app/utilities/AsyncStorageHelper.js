import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper class for AsyncStorage related functions
 */
export default class AsyncStorageHelper {

    /**
     * Save String to AsyncStorage
     * @param key - Key
     * @param value - Value to be saved
     */
    static saveStringAsync = async (key, value) => {
        try {
            await AsyncStorage.setItem(key, value)
        } catch (e) {
            // console.log("save failed " + e)
        }
    }

    /**
     * Returns the saved String value
     * @param key - Key
     * @returns the string value
     */
    static getStringAsync = async (key) => {
        try {
            const value = await AsyncStorage.getItem(key)
            if (value !== null) {
                return value
            } else {
                return null
            }
        } catch (e) {
            // console.log("read failed " + e)
            return null
        }
    }

    /**
     * Clean the Async Storage
     */
    static clearAsyncStorage = async () => {
        try {
            await AsyncStorage.clear()
          } catch(e) {
            // console.log("clear failed " + e)
          }
    }
}