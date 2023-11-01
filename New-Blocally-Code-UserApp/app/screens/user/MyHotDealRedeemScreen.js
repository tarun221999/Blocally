import React, { Component } from 'react'
import { View, TouchableOpacity, StyleSheet, ScrollView, Modal, Linking } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, fontNames, sizes, screenNames,
} from '../../config/constants'
import {
    getScreenDimensions, parseDate, startStackFrom, getCurrencyFormat,
} from '../../utilities/HelperFunctions'
import FastImage from 'react-native-fast-image'

/**
 * NOT BEING USED AS OF NOW
 */

export default class MyHotDealRedeemScreen extends Component {
    constructor(props) {
        super(props)
        this.isSuccess = this.props.navigation.state.params.IS_SUCCESS
        this.redeemedOn = this.props.navigation.state.params.REDEEMED_ON
        this.currentDeal = this.props.navigation.state.params.CURRENT_DEAL
        this.message = this.props.navigation.state.params.MESSAGE

        this.screenDimensions = getScreenDimensions()
        this.headerImageHeight = this.screenDimensions.height * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <TitleBarComponent
                    title={this.currentDeal.dealTitle}
                    navigation={this.props.navigation} />

                <View>
                    <View style={[commonStyles.headerBorder, commonStyles.centerInContainer, {
                        width: '100%', height: this.headerImageHeight, backgroundColor: colors.white
                    }]}>
                        <ImageComponent source={require('../../assets/placeholderLogo.png')} />
                        <FastImage
                            source={{
                                uri: this.currentDeal.dealImage ? this.currentDeal.dealImage : "",
                            }}
                            resizeMode={FastImage.resizeMode.cover}
                            style={commonStyles.productImage} />
                    </View>
                    <View style={{ marginStart: 'auto' }}>
                        <View style={commonStyles.rowContainer}>
                            {/* <TouchableOpacity
                                onPress={this.manageProductFavorite}>
                                <ImageComponent
                                    source={this.currentDeal.isMarkedAsFavourite ?
                                        require('../../assets/bookmarkSelected.png')
                                        : require('../../assets/bookmark.png')}
                                />
                            </TouchableOpacity> */}
                            <ImageComponent
                                style={{ marginStart: 5 }}
                                source={require('../../assets/hotDeal.png')}
                            />
                        </View>
                    </View>
                </View>

                <ScrollView style={{ marginTop: -40, }}>
                    <View style={[commonStyles.rowContainer, { marginTop: 10, marginHorizontal: 50 }]}>
                        <View>
                            <TextComponent style={{ fontSize: sizes.largeTextSize }}>
                                {this.currentDeal.dealTitle}
                            </TextComponent>

                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 5 }}>
                                {strings.saved_on + " - "}
                                <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                    {parseDate(this.currentDeal.dealAddedOn)}
                                </TextComponent>
                            </TextComponent>

                            {this.currentDeal.dealAppointmentId &&
                                <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                    {strings.appointment_date + " - "}
                                    <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                        {parseDate(this.currentDeal.appointmentDate)}
                                    </TextComponent>
                                </TextComponent>
                            }

                            {this.isSuccess &&
                                <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                    {strings.redeemed_on + " - "}
                                    <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                        {parseDate(this.redeemedOn)}
                                    </TextComponent>
                                </TextComponent>
                            }
                        </View>
                        <TextComponent style={{ marginStart: 'auto', color: colors.greenTextColor }}>
                            {getCurrencyFormat(this.currentDeal.dealOP)}
                        </TextComponent>
                    </View>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <TextComponent style={{ marginHorizontal: 50, marginTop: 20, fontSize: sizes.xLargeTextSize }}>
                        {this.isSuccess ? strings.hot_deal_redeem_success : this.message == "" ? strings.hot_deal_redeem_failed : this.message}
                    </TextComponent>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <ImageComponent
                        style={{alignSelf: 'center', marginTop: 80}}
                        source={this.isSuccess ? require('../../assets/redeemSuccess.png') :
                        require('../../assets/redeemFail.png')} />
                    <TextComponent style={{
                        fontSize: 25, fontFamily: fontNames.boldFont,
                        color: this.isSuccess ? colors.green : colors.red, alignSelf: 'center', marginTop: 10
                    }}>
                        {this.isSuccess ? strings.redeemed_successfully : strings.redemption_failed}
                    </TextComponent>

                    <ButtonComponent
                        isFillRequired={true}
                        color={colors.purpleButtonLight}
                        style={styles.button}
                        onPress={() => {
                            if (this.isSuccess) {
                                startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
                            } else {
                                this.props.navigation.goBack(null)
                            }
                        }}>
                        {this.isSuccess ? strings.done : strings.back}
                    </ButtonComponent>
                </ScrollView>
            </View>
        )
    }



    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    dottedLine: {
        width: '100%',
        resizeMode: 'stretch',
        marginTop: 20,
        zIndex: 1,
    },
    row: {
        flexDirection: 'row',
        marginVertical: 20,
        marginHorizontal: 50,
        alignItems: 'center'
    },
    text: {
        color: colors.greyTextColor,
        marginStart: 20,
        paddingEnd: 40
    },
    line: {
        height: 1,
        marginHorizontal: 50,
        backgroundColor: colors.lightLineColor
    },
    button: {
        width: '80%',
        marginTop: 80,
        alignSelf: 'center'
    }
});