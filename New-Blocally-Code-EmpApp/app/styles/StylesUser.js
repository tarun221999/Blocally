import { StyleSheet, Platform, StatusBar } from 'react-native'
import colors from '../config/Colors'
import { sizes, constants, fontNames } from '../config/Constants'

/**
 * Common Styles
 */
export default commonStyles = StyleSheet.create({
    statusBar: {
        height: Platform.OS === constants.IOS ? 22 : StatusBar.currentHeight,
        backgroundColor: colors.statusBarColor
    },
    container: {
        flex: 1,
        backgroundColor: colors.white
    },
    centerInContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    rowContainer: {
        flexDirection: 'row'
    },
    componentBackgroundImage: {
        position: 'absolute',
        left: 0,
        top: 0,
        resizeMode: 'cover'
    },
    text: {
        fontFamily: fontNames.regularFont,
        fontSize: sizes.normalTextSize,
        color: colors.blackTextColor,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    headerBorder: {
        borderBottomLeftRadius: 80,
        overflow: 'hidden'
    },
    headerImage: {
        width: '100%',
        resizeMode: 'cover'
    },
    headerTextBackground: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    headerText: {
        fontSize: sizes.headerTextSize,
        color: colors.white,
        marginStart: 15,
        position: 'absolute',
    },
    dynamicHeaderImage: {
        width: '100%',
    },
    image: {
        resizeMode: 'contain',
    },
    textInput: {
        fontFamily: fontNames.regularFont,
        width: '100%',
        padding: 0,
        paddingHorizontal: 5,
        paddingTop: 5,
        paddingBottom: 8,
    },
    textInputBorder: {
        fontFamily: fontNames.regularFont,
        width: '100%',
        padding: 0,
        paddingHorizontal: 5,
        paddingTop: 5,
        paddingBottom: 8,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: colors.primaryColor,
        borderRadius: 30,
    },
    floatingFieldInput: {
        width: '100%',
        borderBottomWidth: 1.5,
        borderColor: colors.black,
    },
    floatingLabelInput: {
        color: colors.greyTextColor,
        paddingStart: 0,
        fontFamily: fontNames.regularFont,
        fontSize: sizes.normalTextSize
    },
    floatingInput: {
        borderWidth: 0,
        paddingLeft: 0,
        paddingBottom: 0,
        paddingTop: 1,
        fontFamily: fontNames.regularFont,
    },
    errorText: {
        color: colors.red,
        fontSize: sizes.errorTextSize,
        width: '100%',
        marginTop: 2
    },
    buttonBgFilled: {
        borderWidth: 1,
        borderColor: colors.primaryColor,
        borderRadius: 30,
        width: sizes.buttonWidth,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10,
    },
    buttonBgOutline: {
        borderWidth: 1,
        borderColor: colors.primaryColor,
        borderRadius: 30,
        width: sizes.buttonWidth,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10,
    },
    buttonText: {
        fontFamily: fontNames.regularFont,
        fontSize: sizes.buttonTextSize,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    cardShadow: {
        shadowColor: colors.black,
        shadowRadius: 3,
        shadowOpacity: 0.6,
        shadowOffset: {
            width: 3,
            height: 5
        },
    },
    cardMargins: {
        marginBottom: 18,
        marginStart: 8,
        marginEnd: 8,
        marginTop: 6,
    },
    cardRadius: {
        borderRadius: sizes.cardBorderRadius,
        overflow: 'hidden',
        alignSelf: 'baseline',
        elevation: 4,
        backgroundColor: colors.white
    },
    cardTitleContainer: {
        position: 'absolute',
        bottom: 0
    },
    cardTitleText: {
        color: colors.white,
        fontSize: 16,
        position: 'absolute',
        left: 10,
        bottom: 8,
    },
    cardTitleTextAction: {
        position: 'absolute',
        color: 'white',
        marginStart: 20,
        marginTop: 7,
        fontSize: 16
    },
    cardBigTitleText: {
        color: colors.white,
        fontSize: 16,
        position: 'absolute',
        left: 10,
        bottom: 8,
    },
    cardBigOpeningText: {
        color: colors.white,
        fontSize: sizes.mediumTextSize,
        position: 'absolute',
        right: 10,
        bottom: 8,
    },
    cardDiscountView: {
        height: 40,
        width: 40,
        borderRadius: 20,
        position: 'absolute',
        right: 0,
        bottom: 15,
        marginRight: 5,
        backgroundColor: colors.green,
        padding: 5,
    },
    cardDetailsContainer: {
        paddingStart: 15,
        paddingEnd: 15,
        justifyContent: 'center',
    },
    cardDescriptionText: {
        fontSize: sizes.mediumTextSize,
    },
    cardBigDescriptionText: {
        fontSize: 13,
    },
    cardProductName: {
        fontSize: 13,
        fontFamily: fontNames.boldFont,
        marginTop: 3
    },
    cardBigProductName: {
        fontSize: 11,
        fontFamily: fontNames.boldFont,
        marginTop: 3
    },
    cardDistance: {
        fontSize: sizes.mediumTextSize,
        color: colors.greyTextColor,
        marginLeft: 2
    },
    cardBigDistance: {
        fontSize: sizes.mediumTextSize,
        color: colors.greyTextColor,
        marginLeft: 2
    },
    cardBigBusinessAddress: {
        fontSize: sizes.mediumTextSize,
    },
    cardBigOpenHours: {
        marginStart: 'auto',
        fontSize: sizes.mediumTextSize
    },
    cardMRP: {
        fontSize: sizes.mediumTextSize,
        color: colors.greyTextColor,
        textDecorationLine: 'line-through',
    },
    cardOP: {
        fontSize: sizes.mediumTextSize,
        marginLeft: 3,
        color: colors.greenTextColor
    },
    cardLeftCountText: {
        fontSize: sizes.smallTextSize,
        color: colors.red,
        fontFamily: fontNames.boldFont,
        marginTop: 3
    },
    cardBigLeftCountText: {
        fontSize: 11,
        color: colors.red,
        fontFamily: fontNames.boldFont
    },
    cardLeftText: {
        fontSize: sizes.mediumTextSize,
        alignSelf:'center'
    },
    cardBigLeftText: {
        fontSize: 11,
        marginTop: 2,
    },
    cardInfoButton: {
        width: 90,
        height: 20,
        padding: 0,
        backgroundColor: colors.primaryColor
    },
    cardInfoButtonText: {
        fontSize: 13,
        color: colors.white
    },
    titleBar: {
        flexDirection: 'row',
        width: '100%',
        height: 42,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: colors.black,
        shadowRadius: 3,
        shadowOpacity: 0.6,
        shadowOffset: {
            width: 3,
            height: 5
        },
    },
    titleBarText: {
        fontSize: 21,
        color: colors.black,
    },
    formScrollView: {
        width: '100%',
        paddingHorizontal: 40,
        paddingBottom: 20,
    },
    modalBackground: {
        backgroundColor: colors.blurBackground
    },
    loginPopupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
        marginEnd: 5
    },
    countryCodeView: {
        height: '50%',
        bottom: -30,
        backgroundColor: 'rgba(0, 0, 0, 0.80)',
        position: 'absolute',
        width: '100%',
        paddingVertical: 20
    },
    verticalLine: {
        width: 1,
        height: '100%',
        backgroundColor: colors.primaryColor,
        marginStart: 10
    },
    terms: {
        textDecorationLine: 'underline',
    },
    productImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    cardBadgeIcon: {
        position: 'absolute',
        right: 0,
        top: 0
    },
    elevationAndShadow: {
        elevation: 4,
        shadowColor: colors.black,
        shadowRadius: 3,
        shadowOpacity: 0.6,
        shadowOffset: {
            width: 3,
            height: 5
        },
        backgroundColor: colors.white,
    }
});