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
        // paddingTop: 8,
        // paddingBottom: 10,
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
        color: colors.black,
        // backgroundColor: colors.red,
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
        color: colors.black,
    },
    floatingFieldInput: {
        width: '100%',
        borderBottomWidth: 1.5,
        borderColor: colors.black,
    },
    floatingLabelInput: {
        color: colors.greyTextColor,
        paddingLeft: 0,
        fontFamily: fontNames.regularFont,
        fontSize: sizes.normalTextSize,
    },
    floatingInput: {
        borderWidth: 0,
        paddingLeft: 0,
        paddingBottom: 0,
        paddingTop: 1,
        fontFamily: fontNames.regularFont,
        color: colors.black,
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
        marginBottom: 14,
        marginStart: 6,
        marginEnd: 15,
        marginTop: 6,
    },
    cardRadius: {
        borderRadius: sizes.cardBorderRadius,
        overflow: 'hidden',
        alignSelf: 'baseline',
        elevation: 7,
    },
    cardTitleText: {
        position: 'absolute',
        fontSize: sizes.smallTextSize,
        color: 'white',
        marginStart: 10,
        marginTop: 3
    },
    cardBigTitleText: {
        position: 'absolute',
        fontSize: sizes.mediumTextSize,
        color: 'white',
        marginStart: 15,
        marginTop: 4
    },
    cardDetailsContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center'
    },
    cardDescriptionText: {
        fontSize: sizes.xSmallTextSize,
    },
    cardBigDescriptionText: {
        fontSize: sizes.smallTextSize,
    },
    cardProductName: {
        fontSize: sizes.xSmallTextSize,
        fontFamily: fontNames.boldFont,
        marginTop: 3
    },
    cardBigProductName: {
        fontSize: 9,
        fontFamily: fontNames.boldFont,
        marginTop: 3
    },
    cardLeftCountText: {
        fontSize: sizes.xSmallTextSize,
        color: colors.red,
        fontFamily: fontNames.boldFont,
        marginTop: 6
    },
    cardLeftText: {
        fontSize: sizes.xSmallTextSize,
        marginTop: -2,
    },
    formScrollView: {
        width: '100%',
        paddingHorizontal: 40,
        paddingVertical: 20
    },
    homeSectionStyle: {
        flexDirection: 'row', width: '100%'
    },
    searchBar: {
        marginLeft: 15,
        marginRight: 15,
        height: 40

    },
    textCardStyle: {
        fontFamily: fontNames.regularFont,
        color: colors.black,
        fontSize: sizes.tabTextSize

    },
    cardMRP: {
        fontSize: sizes.smallTextSize,
        color: colors.greyTextColor,
        textDecorationLine: 'line-through',
    },
    cardOP: {
        fontSize: sizes.smallTextSize,
        marginLeft: 3,
        color: colors.greenTextColor
    },
    cardDiscount: {
        fontSize: sizes.smallTextSize,
        color: colors.greenTextColor,
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
    cardDistance: {
        fontSize: sizes.smallTextSize,
        color: colors.greyTextColor,
        marginLeft: 2
    },
    cardTitleTextAction: {
        position: 'absolute',
        color: 'white',
        marginStart: 20,
        marginTop: 9
    },
    cardBigLeftCountText: {
        fontSize: 11,
        color: colors.red,
        fontFamily: fontNames.boldFont
    },
    cardBigLeftText: {
        fontSize: 11,
        marginTop: 2,
    },
    titleBar: {
        flexDirection: 'row',
        width: '100%',
        height: Platform.OS === constants.IOS ? 44 : 54,
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
        // opacity: 0.9
    },
    titleBarText: {
        fontSize: sizes.headerTextSize,
        color: colors.black,
    },
    modalBackground: {
        backgroundColor: colors.blurBackground
    },
    pagerTitle: {
        /* height: 50,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0, */
        backgroundColor: colors.tabBackground
    },
    indicatorPager: {
        height: '100%',
        flexDirection: 'column-reverse',
        width: '100%',
        backgroundColor: colors.tabBackground
    },
    countryCodeView: {
        height: '50%',
        bottom: -30,
        backgroundColor: 'rgba(0, 0, 0, 0.80)',
        position: 'absolute',
        width: '100%',
        paddingVertical: 20
    },
    badgeCount: {
        backgroundColor: colors.primaryColor,
        borderRadius: 13,
        minWidth: 26,
        height: 26,
        textAlign: 'center',
        overflow: 'hidden',
        color: colors.white,
        marginLeft: 10,
        padding: 5,
        fontSize: sizes.mediumTextSize
    },
    terms: {
        textDecorationLine: 'underline',
    },
});