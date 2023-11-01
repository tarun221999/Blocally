import React, { Component } from 'react'
import { View, StyleSheet, TouchableHighlight, ScrollView, Modal, StatusBar, FlatList, TouchableOpacity, Alert } from 'react-native'
import { NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import TextInputComponent from '../components/TextInputComponent'
import ImageComponent from '../components/ImageComponent'
import commonStyles from '../styles/Styles'
import commonStyles2 from '../styles/StylesUser'
import strings from '../config/Strings'
import colors from '../config/Colors'
import {
    isUserLoggedIn, startStackFrom, alertDialog, getColor, parseTime, getOnlyMonth, getOnlyDate,
    combineDateTime, getUTCDateTimeFromLocalDateTime, getUTConlyDate, assignColorsForHolidays,
    getLocalDateTimeFromLocalDateTime, getTimeOffset, getCurrentMilliseconds,
} from '../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, constants, urls, productSortBy, productOrderBy, isTotalBlock } from '../config/Constants'
import {
    getCommonParamsForAPI, getScreenDimensions, getImageDimensions, parseTextForCard, parseDiscountApplied,
    parseLocalDate, parseDate, getBuissnessId, plusOneDay, handleErrorResponse
} from '../utilities/HelperFunctions'
import TitleBarComponent from '../components/TitleBarComponent'
import { hitApi } from '../api/ApiCall'
import LoaderComponent from '../components/LoaderComponent'
import ButtonComponent from '../components/ButtonComponent'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-material-dropdown';
import { Calendar, } from 'react-native-calendars'

/**
 * Listing of Holidays Screen
 */
export default class HolidaysScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModalLoader: false,
            showAddHolidayPopup: false,
            isEdit: false,
            showFilter: false,
            currentSortBy: productSortBy.DATE,
            currentOrderBy: productOrderBy.ASCENDING,
            showDatePicker: false,
            timePicker: false,

            holidayListArray: [],

            holidayDate: '',
            holidayFromTime: '',
            holidayToTime: '',

            holidayDateFull: null,
            holidayFromTimeFull: null,
            holidayToTimeFull: null,

            typeOfTime: 0,
            errorThere: false,
            holidayErrorText: '',
            filterTypeDatePicker: false,
            currentFilterDate: null,
            fromFilterDate: null,
            toFilterDate: null,
            pullToRefreshWorking: false,
            shouldShowHolidayListArrayEmpty: false,
            fulldayoff: false,
            selectedProduct: 0,
            productsArray: [],
            selectedHolidayId: null,

            isTotalBlock: isTotalBlock.BLOCK_OPENING_HOURS,

            searchText: "",
            blockOptionsArray: [
                {
                    id: null,
                    value: strings.choose
                },
                {
                    id: isTotalBlock.BLOCK_OPENING_HOURS,
                    value: strings.block_opening_time
                },
                {
                    id: isTotalBlock.BLOCK_PRODUCTS,
                    value: strings.block_products
                },
                {
                    id: isTotalBlock.COMPLETE_BLOCK,
                    value: strings.complete_block
                }
            ],
            selectedBlockOptionPosition: 0, // position dependent check for showing product drop down
            selectedProductForFilter: 0,
        }

        this.shouldHitPagination = true
        this.apiCount = 0;
        this.didFocusSubscription = null
        this.todayDate = new Date()

        this.holidayArrayPageIndex = 1
        this.holidayArrayPaginationRequired = true

        this.colorsArray = [colors.appointmentColorOne, colors.appointmentColorTwo, colors.appointmentColorThree, colors.appointmentColorFour]
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.holidays}
                    navigation={this.props.navigation}
                    icon={this.state.showFilter ? require('../assets/filterSelected.png') : require('../assets/filter.png')}
                    onIconPress={() => {
                        this.changeShowFilterVisibility(!this.state.showFilter)
                    }} />

                {this.state.showAddHolidayPopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{
                                width: '90%', backgroundColor: colors.white, padding: 15, borderRadius: 10
                            }}>
                                <TouchableOpacity
                                    style={{ alignSelf: 'flex-end', padding: 5 }}
                                    onPress={() => {
                                        this.setState({
                                            showAddHolidayPopup: false,

                                            holidayDate: '',
                                            holidayFromTime: '',
                                            holidayToTime: '',
                                            selectedProduct: 0,

                                            holidayFromTimeFull: null,
                                            holidayToTimeFull: null,
                                            holidayDateFull: null,

                                            typeOfTime: 0,
                                            timePicker: false,
                                            DateTimePicker: false,
                                            errorThere: false,
                                            holidayErrorText: '',
                                            fulldayoff: false,
                                            selectedHolidayId: null,
                                            selectedProduct: 0,
                                        })
                                    }}>
                                    <ImageComponent
                                        source={require('../assets/crossPurple.png')} />
                                </TouchableOpacity>
                                <TextComponent
                                    style={{
                                        alignSelf: 'center', color: colors.primaryColor,
                                        fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont
                                    }}>
                                    {this.state.isEdit ? strings.edit_holiday : strings.add_holiday}
                                </TextComponent>

                                <TextComponent style={{ marginTop: 10, textAlign: 'center' }}>
                                    {strings.for_what_content}
                                </TextComponent>

                                <TouchableOpacity style={[commonStyles.rowContainer, { padding: 5, marginTop: 10 }]}
                                    onPress={() => {
                                        this.setState({
                                            isTotalBlock: isTotalBlock.BLOCK_OPENING_HOURS,
                                            selectedProduct: 0,
                                        })
                                    }}>
                                    <ImageComponent source={
                                        this.state.isTotalBlock === isTotalBlock.BLOCK_OPENING_HOURS ?
                                            require('../assets/radioButton.png') :
                                            require('../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5, }}>{strings.block_opening_time}</TextComponent>
                                </TouchableOpacity>

                                <TouchableOpacity style={[commonStyles.rowContainer, { padding: 5, marginTop: 5 }]}
                                    onPress={() => {
                                        this.setState({
                                            isTotalBlock: isTotalBlock.BLOCK_PRODUCTS,
                                            selectedProduct: 0,
                                        })
                                    }}>
                                    <ImageComponent source={
                                        this.state.isTotalBlock === isTotalBlock.BLOCK_PRODUCTS ?
                                            require('../assets/radioButton.png') :
                                            require('../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5, }}>{strings.block_products}</TextComponent>
                                </TouchableOpacity>

                                <TouchableOpacity style={[commonStyles.rowContainer, { padding: 5, marginTop: 5 }]}
                                    onPress={() => {
                                        this.setState({
                                            isTotalBlock: isTotalBlock.COMPLETE_BLOCK,
                                            selectedProduct: 0,
                                        })
                                    }}>
                                    <ImageComponent source={
                                        this.state.isTotalBlock === isTotalBlock.COMPLETE_BLOCK ?
                                            require('../assets/radioButton.png') :
                                            require('../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5, }}>{strings.complete_block}</TextComponent>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'column', marginTop: 20 }}>
                                    {this.state.isTotalBlock === isTotalBlock.BLOCK_PRODUCTS &&
                                        <View style={{ marginTop: 0, width: '100%', alignSelf: 'center', }}>
                                            <TextComponent style={{ color: colors.primaryColor }}>
                                                {strings.add_product}
                                            </TextComponent>
                                            <Dropdown
                                                data={this.state.productsArray}
                                                value={this.state.productsArray[this.state.selectedProduct].value}
                                                pickerStyle={{ borderWidth: 0 }}
                                                onChangeText={(value, index, data) => {
                                                    this.setState({
                                                        selectedProduct: index
                                                    })
                                                }}
                                                dropdownOffset={{ top: 0, bottom: 0, borderWidth: 0 }}
                                                rippleInsets={{ top: 0, bottom: 0, borderWidth: 0 }}
                                                inputContainerStyle={{ borderBottomColor: 'transparent' }}
                                            />
                                        </View>
                                    }

                                    <View
                                        style={{
                                            width: '100%', backgroundColor: colors.black, height: 2,
                                            marginBottom: 20
                                        }} />

                                    <View style={{ width: '100%', height: 20, flexDirection: 'row', alignSelf: 'center' }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1, height: 20, flexDirection: 'column', justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            onPress={() => {
                                                this.setState({
                                                    showDatePicker: true,
                                                    filterTypeDatePicker: false,
                                                })
                                            }}>
                                            <TextComponent>
                                                {this.state.holidayDate.length != 0 ? this.state.holidayDate
                                                    : strings.date_star}
                                            </TextComponent>
                                            <View style={{
                                                width: '100%', height: 2,
                                                backgroundColor: colors.black, marginTop: 8
                                            }} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            disabled={this.state.fulldayoff ? true : false}
                                            style={{
                                                flex: 1, height: 20, justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            onPress={() => {
                                                this.setState({
                                                    timePicker: true,
                                                    typeOfTime: 0
                                                })
                                            }}>
                                            <TextComponent>
                                                {this.state.fulldayoff ? ' - ' :
                                                    (this.state.holidayFromTime.length != 0 ?
                                                        this.state.holidayFromTime : strings.from_time)}
                                            </TextComponent>
                                            <View style={{ width: '90%', height: 2, backgroundColor: colors.black, marginTop: 8 }}></View>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            disabled={this.state.fulldayoff ? true : false}
                                            style={{
                                                flex: 1, height: 20, justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            onPress={() => {
                                                this.setState({
                                                    timePicker: true,
                                                    typeOfTime: 1
                                                })
                                            }}>
                                            <TextComponent>
                                                {this.state.fulldayoff ? ' - ' :
                                                    (this.state.holidayToTime.length != 0 ?
                                                        this.state.holidayToTime : strings.to_time)}
                                            </TextComponent>
                                            <View style={{ width: '90%', height: 2, backgroundColor: colors.black, marginTop: 8 }}></View>
                                        </TouchableOpacity>
                                    </View>
                                    {this.state.errorThere &&
                                        <View style={{ marginTop: 20, alignSelf: 'center' }}>
                                            <TextComponent style={{ color: colors.red }}>
                                                {this.state.holidayErrorText}
                                            </TextComponent>
                                        </View>}
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.setState({ fulldayoff: !this.state.fulldayoff })
                                        }}
                                        style={{ flexDirection: 'row', marginTop: 30, alignSelf: 'center' }}>
                                        <ImageComponent
                                            source={!this.state.fulldayoff ?
                                                require('../assets/checkboxEmpty.png') : require('../assets/checkbox.png')} />
                                        <TextComponent style={{ marginLeft: 5 }}>{strings.full_day_off}</TextComponent>
                                    </TouchableOpacity>
                                </View>

                                <View style={[commonStyles.rowContainer, commonStyles.centerInContainer, {
                                    width: "80%", alignSelf: 'center', marginTop: 20
                                }]}>
                                    <ButtonComponent
                                        isFillRequired={true}
                                        style={[styles.popupButton, { marginStart: 10, }]}
                                        onPress={() => {
                                            if (!this.state.fulldayoff) {
                                                // No Full Holiday Case
                                                if (this.state.holidayToTimeFull != null &&
                                                    this.state.holidayFromTimeFull != null &&
                                                    this.state.holidayDateFull != null) {
                                                    let dateCurrent = new Date()
                                                    let combinedDateTemp3 = combineDateTime(this.state.holidayDateFull, this.state.holidayFromTimeFull)
                                                    let diff = combinedDateTemp3 > dateCurrent
                                                    if (diff) {
                                                        let combinedDateTemp1 = combineDateTime(this.state.holidayDateFull, this.state.holidayFromTimeFull)
                                                        let combinedDateTemp2 = combineDateTime(this.state.holidayDateFull, this.state.holidayToTimeFull)

                                                        if (combinedDateTemp2 <= combinedDateTemp1) {
                                                            // case of midnight holiday
                                                            let increMentedFullDay = plusOneDay(this.state.holidayDateFull)
                                                            let nextDayCombined = combineDateTime(increMentedFullDay, this.state.holidayToTimeFull)
                                                            this.setState({
                                                                errorThere: false,
                                                                showAddHolidayPopup: false,
                                                                timePicker: false,
                                                                DateTimePicker: false,
                                                            }, () => {
                                                                this.addHoliday(getLocalDateTimeFromLocalDateTime(combinedDateTemp1), getLocalDateTimeFromLocalDateTime(nextDayCombined))
                                                            })
                                                        } else {
                                                            this.setState({
                                                                errorThere: false,
                                                                showAddHolidayPopup: false,
                                                                timePicker: false,
                                                                DateTimePicker: false,
                                                            }, () => {
                                                                this.addHoliday(getLocalDateTimeFromLocalDateTime(combinedDateTemp1), getLocalDateTimeFromLocalDateTime(combinedDateTemp2))
                                                            })
                                                        }
                                                    } else {
                                                        this.setState({
                                                            holidayErrorText: strings.error_holiday_future,
                                                        }, () => {
                                                            this.setState({
                                                                errorThere: true
                                                            })
                                                        })
                                                    }
                                                } else {
                                                    if (this.state.holidayDateFull === null) {
                                                        this.setState({
                                                            holidayErrorText: strings.holiday_date,
                                                        }, () => {
                                                            this.setState({
                                                                errorThere: true
                                                            })
                                                        })
                                                    } else if (this.state.holidayFromTimeFull === null && this.state.fulldayoff != true) {
                                                        this.setState({
                                                            holidayErrorText: strings.holiday_from_time,
                                                        }, () => {
                                                            this.setState({
                                                                errorThere: true
                                                            })
                                                        })
                                                    } else if (this.state.holidayToTimeFull === null && this.state.fulldayoff != true) {
                                                        this.setState({
                                                            holidayErrorText: strings.holiday_to_time,
                                                        }, () => {
                                                            this.setState({
                                                                errorThere: true
                                                            })
                                                        })
                                                    } else {
                                                        this.setState({
                                                            holidayErrorText: strings.error_holiday_mandatory,
                                                        }, () => {
                                                            this.setState({
                                                                errorThere: true
                                                            })
                                                        })
                                                    }
                                                }
                                            } else {
                                                // Full Holiday Case
                                                if (this.state.holidayDateFull != null) {
                                                    // setting time of full day off to 0000 nd 2359
                                                    let timeStart = new Date()
                                                    let timeEnd = new Date()
                                                    timeStart.setHours(0, 0, 0)
                                                    timeEnd.setHours(23, 59, 0)

                                                    let tempStart = combineDateTime(this.state.holidayDateFull, timeStart)
                                                    let tempEnd = combineDateTime(this.state.holidayDateFull, timeEnd)

                                                    this.setState({
                                                        errorThere: false,
                                                        showAddHolidayPopup: false,
                                                        timePicker: false,
                                                        DateTimePicker: false,
                                                    }, () => {
                                                        this.addHoliday(getLocalDateTimeFromLocalDateTime(tempStart), getLocalDateTimeFromLocalDateTime(tempEnd))
                                                    })
                                                } else {
                                                    this.setState({
                                                        holidayErrorText: strings.error_holiday_date,
                                                    }, () => {
                                                        this.setState({
                                                            errorThere: true
                                                        })
                                                    })
                                                }
                                            }
                                        }}>
                                        {strings.done}
                                    </ButtonComponent>
                                </View>
                            </View>
                        </View>
                    </Modal>
                }

                {this.state.showDatePicker &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 10 }}
                                    onPress={() => {
                                        this.setState({ showDatePicker: false })
                                    }}>
                                    <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                                </TouchableOpacity>

                                <Calendar
                                    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                                    minDate={this.state.filterTypeDatePicker ? null : this.todayDate}
                                    // Handler which gets executed on day press. Default = undefined
                                    onDayPress={(day) => {
                                        // setting day in the required format for processing further
                                        let date = new Date(day.year, (day.month - 1), day.day)

                                        if (!this.state.filterTypeDatePicker) {
                                            this.setState({
                                                holidayDate: parseLocalDate(date) + '',
                                                holidayDateFull: date,
                                                showDatePicker: false,
                                                errorThere: false,
                                            })
                                        } else {
                                            let filterFromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
                                            let filterToDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 0, 0)

                                            this.setState({
                                                currentSortBy: productSortBy.SPECIFIC_DATE,
                                                currentOrderBy: productOrderBy.ASCENDING,
                                                showDatePicker: false,
                                                currentFilterDate: date,

                                                fromFilterDate: getLocalDateTimeFromLocalDateTime(filterFromDate),
                                                toFilterDate: getLocalDateTimeFromLocalDateTime(filterToDate),

                                                filterTypeDatePicker: false,
                                                errorThere: false,
                                            }, () => {
                                                this.hitAllApis()
                                            })
                                            this.sortByValue = productSortBy.DATE
                                        }
                                    }}
                                    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
                                    monthFormat={'yyyy MM'}
                                    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
                                    firstDay={1}
                                    onPressArrowLeft={substractMonth => substractMonth()}
                                    onPressArrowRight={addMonth => addMonth()}
                                />
                            </View>
                        </View>
                    </Modal>
                }

                <View style={{ flex: 1 }}>
                    {this.state.showFilter &&
                        <View style={[{
                            width: '100%', position: 'absolute', padding: 10, zIndex: 10
                        }, commonStyles2.elevationAndShadow,]}>
                            <View style={[commonStyles.rowContainer, { justifyContent: 'center', marginTop: 10 }]}>
                                <ButtonComponent
                                    isFillRequired={this.state.currentSortBy === productSortBy.SPECIFIC_DATE ?
                                        true : false}
                                    icon={this.state.currentSortBy === productSortBy.SPECIFIC_DATE ?
                                        require('../assets/calendar31White.png') :
                                        require('../assets/calendar31.png')}
                                    iconStyle={{ marginRight: 5 }}
                                    style={{ width: '28%', height: 20, marginLeft: 5, padding: 0, paddingHorizontal: 5 }}
                                    fontStyle={{ fontSize: sizes.smallTextSize }}
                                    onPress={() => {
                                        this.setState({
                                            showDatePicker: true,
                                            filterTypeDatePicker: true
                                        })
                                    }}>
                                    {this.state.currentFilterDate ? parseLocalDate(this.state.currentFilterDate) : strings.choose_by_date}
                                </ButtonComponent>

                                <ButtonComponent
                                    isFillRequired={true}
                                    icon={require('../assets/sync.png')}
                                    iconStyle={{ marginRight: 5, width: 10, height: 10 }}
                                    style={{ width: '28%', height: 20, marginStart: 5, padding: 0, paddingHorizontal: 5 }}
                                    fontStyle={{ fontSize: sizes.smallTextSize }}
                                    onPress={() => {
                                        this.setState({
                                            searchText: "",
                                            currentFilterDate: null,
                                            fromFilterDate: null,
                                            toFilterDate: null,
                                            currentSortBy: productSortBy.DATE,
                                            currentOrderBy: productOrderBy.ASCENDING,
                                            selectedBlockOptionPosition: 0,
                                            selectedProductForFilter: 0,
                                            showModalLoader: true,
                                        }, () => {
                                            this.hitAllApis()
                                        })
                                    }}>
                                    {strings.reset}
                                </ButtonComponent>
                            </View>

                            <View style={{ marginTop: 20, marginHorizontal: 10 }}>
                                <TextComponent style={{ marginBottom: 10 }}>
                                    {strings.capacity_type}
                                </TextComponent>

                                <Dropdown
                                    data={this.state.blockOptionsArray}
                                    value={this.state.blockOptionsArray[this.state.selectedBlockOptionPosition].value}
                                    pickerStyle={{ borderWidth: 0 }}
                                    onChangeText={(value, index, data) => {
                                        this.setState({
                                            selectedBlockOptionPosition: index,
                                            selectedProductForFilter: 0
                                        })
                                    }}
                                    dropdownOffset={{ top: 0, bottom: 0, borderWidth: 0 }}
                                    rippleInsets={{ top: 0, bottom: 0, borderWidth: 0 }}
                                    inputContainerStyle={{ borderBottomColor: 'transparent' }}
                                />

                                {this.state.selectedBlockOptionPosition === 2 &&
                                    <Dropdown
                                        data={this.state.productsArray}
                                        value={this.state.productsArray[this.state.selectedProductForFilter].value}
                                        pickerStyle={{ borderWidth: 0 }}
                                        onChangeText={(value, index, data) => {
                                            this.setState({
                                                selectedProductForFilter: index
                                            })
                                        }}
                                        dropdownOffset={{ top: 0, bottom: 0, borderWidth: 0 }}
                                        rippleInsets={{ top: 0, bottom: 0, borderWidth: 0 }}
                                        inputContainerStyle={{ borderBottomColor: 'transparent' }}
                                    />
                                }

                                <ButtonComponent
                                    isFillRequired={true}
                                    icon={require('../assets/searchWhite.png')}
                                    iconStyle={{ marginLeft: 10, width: 13, height: 13, }}
                                    style={{ width: '30%', height: 20, marginTop: 10, padding: 0, paddingRight: 10, alignSelf: 'center' }}
                                    fontStyle={{ fontSize: sizes.mediumTextSize }}
                                    onPress={() => {
                                        this.holidayArrayPageIndex = 1
                                        this.holidayArrayPaginationRequired = true
                                        this.setState({
                                            holidayListArray: [],
                                            showModalLoader: true
                                        }, () => {
                                            this.getHolidayList()
                                        })
                                    }}>
                                    {strings.search}
                                </ButtonComponent>

                            </View>
                        </View>
                    }

                    <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
                        <View style={{ width: '100%', }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '70%', alignSelf: 'center', marginTop: 20, borderWidth: 1.5, borderRadius: 30, paddingVertical: 12 }}
                                onPress={() => {
                                    this.props.navigation.navigate(screenNames.ADD_HOLIDAY_SCREEN, {
                                        IS_EDIT: false,
                                        HOLIDAY_TO_EDIT: null
                                    })
                                }}>
                                <ImageComponent
                                    source={require('../assets/calenderIcon.png')} />
                                <TextComponent style={{
                                    marginLeft: 7, fontFamily: fontNames.regularFont, fontSize: 15,
                                }}>
                                    {strings.add_holiday}
                                </TextComponent>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            onRefresh={this.onPullToRefresh}
                            refreshing={this.state.pullToRefreshWorking}
                            data={this.state.holidayListArray}
                            style={{ marginTop: 20, width: '100%', alignSelf: 'center', marginLeft: 10 }}
                            renderItem={({ item, index }) =>
                                <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                    flex: 1, paddingBottom: 0,
                                    width: '92%', alignSelf: 'center'
                                }]}>
                                    <View style={[commonStyles.cardRadius, { flexDirection: 'row', backgroundColor: colors.white }]}>
                                        <View
                                            style={{
                                                justifyContent: 'center', alignItems: 'center', flex: 0.3,
                                                backgroundColor: this.colorsArray[item.bgColorIndex], paddingVertical: 18, paddingHorizontal: 0,
                                                borderTopLeftRadius: 12, borderBottomLeftRadius: 12
                                            }}>
                                            <TextComponent style={{ color: colors.white, fontSize: 18 }}>
                                                {getOnlyDate(item.startDateTime) + " " + getOnlyMonth(item.startDateTime)}
                                            </TextComponent>
                                        </View>
                                        <View style={{
                                            flexDirection: 'column', flex: 0.6, justifyContent: 'center', marginLeft: 10,
                                            backgroundColor: colors.white
                                        }}>
                                            {/* check added when the param for product available in api */}
                                            {item.productTitle &&
                                                <TextComponent
                                                    numberOfLines={1}
                                                    style={{
                                                        marginLeft: 5, color: colors.black,
                                                        marginLeft: 10, fontSize: 13
                                                    }}>
                                                    {item.productTitle}
                                                </TextComponent>
                                            }

                                            {(item.isTotalBlock && item.isTotalBlock == isTotalBlock.COMPLETE_BLOCK) &&
                                                <TextComponent
                                                    numberOfLines={1}
                                                    style={{
                                                        marginLeft: 5, color: colors.black,
                                                        marginLeft: 10, fontSize: 13
                                                    }}>
                                                    {strings.complete_block}
                                                </TextComponent>
                                            }

                                            {(item.isTotalBlock && item.isTotalBlock == isTotalBlock.BLOCK_OPENING_HOURS) &&
                                                <TextComponent
                                                    numberOfLines={1}
                                                    style={{
                                                        marginLeft: 5, color: colors.black,
                                                        marginLeft: 10, fontSize: 13
                                                    }}>
                                                    {strings.regular_operation}
                                                </TextComponent>
                                            }

                                            <View style={{
                                                marginTop: item.productTitle ? 4 : 0
                                                //  check added when the param for product available in api so when no product selected then no margin top
                                            }}>
                                                <TextComponent style={{
                                                    marginLeft: 5, color: colors.greyButtonColor, marginLeft: 10,
                                                    fontSize: 14
                                                }}>
                                                    {item.isFullDayOff ? strings.full_day_off : parseTime(item.startDateTime, false)
                                                        + ' - ' + parseTime(item.endDateTime, true)}
                                                </TextComponent>
                                            </View>

                                        </View>
                                        {getCurrentMilliseconds() < new Date(item.startDateTime).getTime() ?
                                            <View style={{ flex: 0.1, justifyContent: 'center', paddingLeft: 15 }}>
                                                <TouchableOpacity
                                                    style={{ alignSelf: 'flex-end', padding: 10, marginRight: 0, paddingVertical: 20 }}
                                                    onPress={() => {
                                                        // this function will get the block detail if any product selected then it returns array of product with one item
                                                        // otherwise the array is empty
                                                        // so when no product returned then set selectedproduct to 0

                                                        this.props.navigation.navigate(screenNames.ADD_HOLIDAY_SCREEN, {
                                                            IS_EDIT: true,
                                                            HOLIDAY_TO_EDIT: item
                                                        })
                                                    }}>
                                                    <ImageComponent
                                                        source={require('../assets/editHoliday.png')} />
                                                </TouchableOpacity>
                                            </View>
                                            : <View />
                                        }
                                        <View style={{ flex: 0.1, justifyContent: 'center', paddingLeft: 10 }}>
                                            <TouchableOpacity
                                                style={{ alignSelf: 'flex-end', padding: 10, marginRight: 10, paddingVertical: 20 }}
                                                onPress={() => {
                                                    setTimeout(() => {
                                                        alertDialog("", strings.sure_delete_holiday, strings.yes, strings.no, () => {
                                                            this.deleteHoliday(item.blockDateId)
                                                        })
                                                    }, constants.HANDLING_TIMEOUT)
                                                }}>
                                                <ImageComponent
                                                    source={require('../assets/crossGrey.png')} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item, index) => index.toString()}
                            onEndReached={({ distanceFromEnd }) => {
                                if (distanceFromEnd < 0) {
                                    return;
                                }
                                if (this.holidayArrayPaginationRequired && this.shouldHitPagination) {
                                    this.shouldHitPagination = false
                                    this.holidayArrayPageIndex++
                                    this.getHolidayList()
                                }
                            }}
                            onEndReachedThreshold={0.5}
                            ListEmptyComponent={
                                this.state.shouldShowHolidayListArrayEmpty &&
                                <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}>
                                    <TextComponent>{strings.no_records_found}</TextComponent>
                                </View>
                            }
                        />
                    </View>

                    {this.state.timePicker &&
                        <DateTimePicker
                            value={this.todayDate}
                            mode={'time'}
                            is24Hour={true}
                            display="default"
                            onChange={(event, date) => {
                                if (date) {
                                    if (this.state.typeOfTime === 0) {
                                        this.setState({
                                            holidayFromTime: this.getShowTime(date),
                                            holidayFromTimeFull: date,
                                            timePicker: false,
                                            errorThere: false,
                                        })
                                    } else {
                                        this.setState({
                                            holidayToTime: this.getShowTime(date),
                                            holidayToTimeFull: date,
                                            timePicker: false,
                                            errorThere: false,
                                        })
                                    }
                                } else {
                                    this.setState({
                                        timePicker: false
                                    })
                                }
                            }} />
                    }
                </View>
            </View >
        );
    }

    componentDidMount() {
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                setTimeout(() => {
                    this.hitAllApis()
                }, constants.HANDLING_TIMEOUT)
            }
        );
    }

    // Hit all required APIs of the screen
    hitAllApis = () => {
        this.holidayArrayPageIndex = 1
        this.holidayArrayPaginationRequired = true

        this.setState({
            showModalLoader: true,
            shouldShowHolidayListArrayEmpty: false,
            holidayListArray: [],
            productsArray: []
        }, () => {
            this.getHolidayList()
            this.getProductList()
        })
    }

    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.hitAllApis()
        })
    }

    componentWillUnmount() {
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }
    }

    // API to get listing of holidays added by ent
    getHolidayList() {
        getCommonParamsForAPI().then((commonParams) => {
            let productId = (this.state.productsArray && this.state.productsArray.length > 0) ?
                this.state.productsArray[this.state.selectedProductForFilter].productId
                : null
            const params = {
                ...commonParams,
                pageIndex: this.holidayArrayPageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                dateFrom: this.state.currentSortBy === productSortBy.SPECIFIC_DATE ? this.state.fromFilterDate : null,
                dateTo: this.state.currentSortBy === productSortBy.SPECIFIC_DATE ? this.state.toFilterDate : null,
                sortBy: this.state.currentSortBy,
                orderBy: this.state.currentOrderBy,
                searchText: this.state.searchText,
                productType: this.state.blockOptionsArray[this.state.selectedBlockOptionPosition].id,
                productId
            }

            this.apiCount++
            hitApi(urls.GetEntrepreneurHoliday, urls.POST, params, null, (res) => {
                if (res.response.data && res.response.data.length < constants.PAGE_SIZE) {
                    this.holidayArrayPaginationRequired = false
                }

                let newData = res.response.data;
                let tempArray = this.state.holidayListArray
                newData = assignColorsForHolidays(tempArray, newData, this.colorsArray.length);
                tempArray.push(...newData)

                this.setState({
                    holidayListArray: tempArray,
                    shouldShowHolidayListArrayEmpty: true
                }, () => {
                    this.shouldHitPagination = true
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get listing of products
    getProductList() {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }

            this.apiCount++
            hitApi(urls.GetProductsBlockDate, urls.POST, params, null, (res) => {
                let tempArray = res.response.data
                let finalArrayToSave = []
                const body = {
                    productId: null,
                    productTitle: "productTitle",
                    productType: "productType",
                    value: strings.select_product,
                }
                finalArrayToSave.push(body)
                for (let i = 0; i < tempArray.length; i++) {
                    const body = {
                        productId: tempArray[i].productId,
                        productTitle: tempArray[i].productTitle,
                        productType: tempArray[i].productType,
                        value: tempArray[i].productTitle,
                    }
                    finalArrayToSave.push(body)
                }
                this.setState({
                    productsArray: finalArrayToSave
                }, () => {
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                setTimeout(() => {
                    handleErrorResponse(this.props.navigation, jsonResponse)
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // API to delete holiday
    deleteHoliday(holidayId) {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                blockDateId: holidayId,
            }

            hitApi(urls.DeleteEntrepreneurHoliday, urls.POST, params, this.showModalLoader, (res) => {
                setTimeout(() => {
                    this.hitAllApis()
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // API to add/update holiday
    addHoliday(fromTime, toTime) {
        this.holidayArrayPageIndex = 1
        getCommonParamsForAPI().then((commonParams) => {
            let curr_api_type;
            let params;
            if (this.state.selectedHolidayId === null) {
                // Add New holiday Case
                curr_api_type = urls.AddEntrepreneurHoliday
                let productIds = [];
                if (this.state.selectedProduct > 0) {
                    let product_id_selected = this.state.productsArray[this.state.selectedProduct].productId
                    let product = {
                        productId: product_id_selected
                    };
                    productIds.push(product);
                }

                params = {
                    ...commonParams,
                    startDateTime: fromTime,
                    endDateTime: toTime,
                    isFullDayOff: this.state.fulldayoff,
                    productIds,
                    isTotalBlock: this.state.isTotalBlock,
                }
            } else {
                // Update holiday Case
                curr_api_type = urls.UpdateEntrepreneurBlockDate
                let productIds = [];
                if (this.state.selectedProduct > 0) {
                    let product_id_selected = this.state.productsArray[this.state.selectedProduct].productId
                    let product = {
                        productId: product_id_selected
                    };
                    productIds.push(product);
                }
                params = {
                    ...commonParams,
                    startDateTime: fromTime,
                    endDateTime: toTime,
                    isFullDayOff: this.state.fulldayoff,
                    blockDateId: this.state.selectedHolidayId,
                    productIds,
                    isTotalBlock: this.state.isTotalBlock,
                }
            }

            hitApi(curr_api_type, urls.POST, params, this.showModalLoader, (res) => {
                this.setState({
                    holidayDate: '',
                    holidayFromTime: '',
                    holidayToTime: '',

                    holidayFromTimeFull: null,
                    holidayToTimeFull: null,
                    holidayDateFull: null,

                    typeOfTime: 0,
                    errorThere: false,
                    holidayErrorText: '',
                    fulldayoff: false,
                    selectedHolidayId: null,
                    selectedProduct: 0,
                    shouldShowHolidayListArrayEmpty: false,
                }, () => {
                    setTimeout(() => {
                        this.hitAllApis()
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    addEntrepreneurBlockDate(blockDateId, bid) {
        let product_id_selected = this.state.productsArray[this.state.selectedProduct].productId
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                businessId: bid,
                blockDateId: this.state.selectedHolidayId === null ? blockDateId : this.state.selectedHolidayId,
                productIds: [{
                    productId: product_id_selected
                }]
            }
            hitApi(urls.AddProductsBlockDate, urls.POST, params, this.showModalLoader, (res) => {
                setTimeout(() => {
                    this.hitAllApis()
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    changeShowFilterVisibility = (visible) => {
        this.setState({
            showFilter: visible
        })
    }

    showModalLoader = (shouldShow) => {
        if (shouldShow) {
            this.setState({
                showModalLoader: shouldShow,
            })
        } else {
            if (this.apiCount === 0) {
                this.setState({
                    showModalLoader: shouldShow,
                    pullToRefreshWorking: false
                })
            } else {
                this.setState({
                    pullToRefreshWorking: false
                })
            }
        }
    }

    // returns time to show
    getShowTime(date) {
        let hours = date.getHours()
        let minutes = date.getMinutes()
        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        let strTime = hours + ":" + minutes + " Uhr"
        return strTime
    }

    getSelectedProductIndex(productId) {
        let value;
        for (let i = 0; i < this.state.productsArray.length; i++) {
            if (this.state.productsArray[i].productId === productId) {
                value = i;
                break;
            }
        }
        return value;
    }

    // api to get details of a holiday/block date
    getBlockDateDetail = (item) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                blockDateId: item.blockDateId,
                timeOffset: getTimeOffset(),
            }
            hitApi(urls.GetEntrepreneurBlockDateDetail, urls.POST, params, this.showModalLoader, (res) => {
                setTimeout(() => {
                    let holiday = res.response.data[0];

                    if (holiday.productIds && holiday.productIds.length > 0) {
                        // case when product is selected
                        let productIndexSelected = this.getSelectedProductIndex(holiday.productIds[0].productId)

                        // setting the values of edited holiday on the add holiday popup
                        // changing from UTC to LOCAL time
                        let startDateLocal = new Date(item.startDateTime)
                        let endDateLocal = new Date(item.endDateTime)
                        this.setState({
                            selectedHolidayId: item.blockDateId,
                            fulldayoff: item.isFullDayOff === 0 ? false : true,

                            //holiday date setting
                            holidayDate: parseDate(startDateLocal) + '',
                            holidayDateFull: startDateLocal,

                            //holiday From time setting
                            holidayFromTime: this.getShowTime(startDateLocal),
                            holidayFromTimeFull: startDateLocal,

                            //holiday To time setting
                            holidayToTime: this.getShowTime(endDateLocal),
                            holidayToTimeFull: endDateLocal,

                            selectedProduct: productIndexSelected,
                            isTotalBlock: item.isTotalBlock,
                        }, () => {
                            this.setState({
                                isEdit: true,
                                showAddHolidayPopup: true,
                            })
                        })
                    } else {
                        // case when no product is selected
                        // setting the values of edited holiday on the add holiday popup
                        // changing from UTC to LOCAL time
                        let startDateLocal = new Date(item.startDateTime)
                        let endDateLocal = new Date(item.endDateTime)
                        this.setState({
                            selectedHolidayId: item.blockDateId,
                            fulldayoff: item.isFullDayOff === 0 ? false : true,

                            //holiday date setting
                            holidayDate: parseDate(startDateLocal) + '',
                            holidayDateFull: startDateLocal,

                            //holiday From time setting
                            holidayFromTime: this.getShowTime(startDateLocal),
                            holidayFromTimeFull: startDateLocal,

                            //holiday To time setting
                            holidayToTime: this.getShowTime(endDateLocal),
                            holidayToTimeFull: endDateLocal,

                            selectedProduct: 0,
                            isTotalBlock: item.isTotalBlock,
                        }, () => {
                            this.setState({
                                isEdit: true,
                                showAddHolidayPopup: true,
                            })
                        })
                    }
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }
}

const styles = StyleSheet.create({

});