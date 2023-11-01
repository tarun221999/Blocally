import { StackActions, NavigationActions } from 'react-navigation';
let _navigator;

/**
 * Common functions for Navigation
 */

function setTopLevelNavigator(navigatorRef) {
    _navigator = navigatorRef;
}

function navigate(routeName, params) {
    _navigator.dispatch(
        NavigationActions.navigate({
            routeName,
            params,
        })
    );
}

function startStackFrom(routeName) {
    const resetAction = StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate(
            {
                routeName: routeName,
            }
        )],
    })
    _navigator.dispatch(resetAction)
}

export default {
    navigate,
    setTopLevelNavigator,
    startStackFrom,
};