import React, { Component } from 'react'
import { View, StyleSheet, FlatList, Text } from 'react-native'
import { NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ButtonComponent from '../../components/ButtonComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import HeaderComponent from '../../components/HeaderComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/Strings'
import colors from '../../config/Colors'
import { fontNames, sizes, constants, itemTypes, urls, dealStatuses, databaseConstants, } from '../../config/Constants'
import {
    getCommonParamsForAPI, parseDateTime, alertDialog, getScreenDimensions,
} from '../../utilities/HelperFunctions'
import FastImage from 'react-native-fast-image'
import { hitApi } from '../../api/ApiCall'
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'
import { IndicatorViewPager, PagerTitleIndicator } from 'react-native-best-viewpager'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'

/**
 * Listing of offline data screen
 */
export default class SyncDataScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()

        this.savedDeals = []
        this.state = {
            showModalLoader: false,
            savedHotDeals: [],
            savedBonusCards: [],
            hotDealsCount: "0",
            bonusDealsCount: "0",
            tabs: {
                index: 0,
                routes: [
                    { key: 'first', title: strings.hot_deals  },
                    { key: 'second', title: strings.bonus_cards},
                ],
            }
        }

        this.realm = null
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <NavigationEvents
                    onWillFocus={payload => {
                        this.fetchCounts();
                        this.fetchOfflineData();
                    }}
                    onDidBlur={payload => {
                        this.closeRealm();
                    }}
                />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.pending_data}
                    navigation={this.props.navigation}
                    isHomeScreen={true} />

                <View style={commonStyles.container}>

                    {/* <IndicatorViewPager
                        style={{ flex: 1, flexDirection: 'column-reverse', backgroundColor: colors.white }}
                        indicator={
                            <PagerTitleIndicator
                                titles={[strings.hot_deals + "(" + this.state.hotDealsCount + ")", strings.bonus_cards + "(" + this.state.bonusDealsCount + ")"]}
                                style={{ backgroundColor: colors.white }}
                                itemStyle={{ width: this.screenDimensions.width / 2 }}
                                selectedItemStyle={{ width: this.screenDimensions.width / 2 }}
                                itemTextStyle={styles.indicatorText}
                                selectedItemTextStyle={styles.indicatorSelectedText}
                                selectedBorderStyle={styles.indicatorBorder}
                            />
                        }> */}
                    <TabView
                        onIndexChange={index => this.setState({ index })}
                        navigationState={this.state.tabs}
                        renderTabBar={props => (
                            <TabBar
                              {...props}
                              activeColor={colors.primaryColor}
                              inactiveColor={colors.greyTextColor}
                              indicatorStyle={{ backgroundColor: colors.primaryColor }}
                              style={{ backgroundColor: colors.transparent }}
                              renderLabel={({ route, focused }) => (
                                <Text>{route.title} {route.title == strings.hot_deals ?  "(" + this.state.hotDealsCount + ")" :  "(" + this.state.bonusDealsCount + ")"}</Text>
                              )}
                            />
                          )}
                        renderScene={SceneMap({
                            first: () => <View style={commonStyles.container}>
                                <FlatList
                                    data={this.state.savedHotDeals}
                                    renderItem={({ item }) =>
                                        <View style={{ marginTop: 10, }}>
                                            <View style={{ padding: 10 }}>
                                                <TextComponent style={{ color: colors.primaryColor, fontSize: sizes.largeTextSize }}>
                                                    {strings.deal_code + " - " + item.redeemedCode}
                                                </TextComponent>

                                                <TextComponent style={{ marginTop: 5, fontSize: sizes.largeTextSize }}>
                                                    {strings.redeemed_on + " - " + parseDateTime(item.redeemedOnISO)}
                                                </TextComponent>
                                            </View>
                                            <View style={{ height: 1, width: '100%', backgroundColor: colors.lineColor }} />
                                        </View>
                                    }
                                    keyExtractor={(item, index) => index + ""}
                                    ListEmptyComponent={
                                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                                {strings.no_data_to_sync}
                                            </TextComponent>
                                        </View>
                                    }
                                />
                            </View>,
                            second: () => <View style={commonStyles.container}>
                                <FlatList
                                    data={this.state.savedBonusCards}
                                    renderItem={({ item }) =>
                                        <View style={{ marginTop: 10, }}>
                                            <View style={{ padding: 10 }}>
                                                <TextComponent style={{ color: colors.primaryColor, fontSize: sizes.largeTextSize }}>
                                                    {strings.deal_code + " - " + item.redeemedCode}
                                                </TextComponent>

                                                <TextComponent style={{ marginTop: 5, fontSize: sizes.largeTextSize }}>
                                                    {strings.redeemed_on + " - " + parseDateTime(item.redeemedOnISO)}
                                                </TextComponent>
                                            </View>
                                            <View style={{ height: 1, width: '100%', backgroundColor: colors.lineColor }} />
                                        </View>
                                    }
                                    keyExtractor={(item, index) => index + ""}
                                    ListEmptyComponent={
                                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                                {strings.no_data_to_sync}
                                            </TextComponent>
                                        </View>
                                    }
                                />
                            </View>
                        })}
                    />
                    {/* // </IndicatorViewPager> */}

                    <ButtonComponent
                        style={{ marginTop: 10, marginBottom: 10, width: '50%', alignSelf: 'center' }}
                        color={colors.purpleButton}
                        isFillRequired={true}
                        icon={require('../../assets/sync.png')}
                        onPress={this.onSyncPress}>
                        {strings.sync_now}
                    </ButtonComponent>
                </View>
            </View>
        );
    }

    // show local stored counts for redeemed hot deals and bonus cards
    fetchCounts = () => {
        AsyncStorageHelper.getStringAsync(constants.HOT_DEALS_SCANNED_COUNT)
            .then((value) => {
                if (value) {
                    this.setState({
                        hotDealsCount: value
                    })
                }
            })
        AsyncStorageHelper.getStringAsync(constants.BONUS_DEALS_SCANNED_COUNT)
            .then((value) => {
                if (value) {
                    this.setState({
                        bonusDealsCount: value
                    })
                }
            })
    }

    // get locally stored data
    fetchOfflineData = () => {
        Realm.open({
            schema: [DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                this.realm = realm
                this.savedDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA);
                let savedHotDeals = []
                let savedBonusCards = []
                this.savedDeals.forEach(savedDeal => {
                    if (savedDeal.redeemedCode.toLowerCase().startsWith("hd")) {
                        savedHotDeals.push(savedDeal)
                    } else {
                        savedBonusCards.push(savedDeal)
                    }
                });
                this.setState({
                    savedHotDeals,
                    savedBonusCards
                })
            })
            .catch(error => {
                alertDialog("", error);
            });
    }

    closeRealm = () => {
        if (this.realm !== null && !this.realm.isClosed) {
            this.realm.close();
        }
    }

    // prepare data to sync
    onSyncPress = () => {
        if (this.savedDeals.length > 0) {
            let syncDeal = [];
            this.savedDeals.forEach(savedDeal => {
                if (savedDeal.redeemedCode.toLowerCase().startsWith("hd")) {
                    savedDeal.dealStatusId = dealStatuses.REDEEMED;
                } else {
                    savedDeal.dealStatusId = dealStatuses.BONUS_DEAL;
                }
                let deal = {
                    redeemedCode: savedDeal.redeemedCode,
                    redeemedOn: savedDeal.redeemedOn,
                    dealStatusId: savedDeal.dealStatusId,
                    expiredOn: null,
                }
                syncDeal.push(deal)
            });
            this.hitSyncDealsApi(syncDeal)
        }
    }

    // api to sync data
    hitSyncDealsApi = (syncDeal) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                syncDeal
            }

            hitApi(urls.SYNC_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.realm.write(() => {
                    this.realm.delete(this.savedDeals);
                });
                alertDialog("", strings.data_synced_successfully, strings.ok, "", () => {
                    this.savedDeals = []
                    this.setState({
                        savedHotDeals: [],
                        savedBonusCards: []
                    })
                })
            })
        })
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    indicatorText: {
        color: colors.greyTextColor,
        textAlign: 'center',
        width: 150
    },
    indicatorSelectedText: {
        color: colors.primaryColor,
        textAlign: 'center',
        width: 150,
    },
    indicatorBorder: {
        backgroundColor: colors.primaryColor,
    },
});