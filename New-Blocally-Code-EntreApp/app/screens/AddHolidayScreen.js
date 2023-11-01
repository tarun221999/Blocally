import React, { Component } from 'react'
import { View, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import ImageComponent from '../components/ImageComponent'
import commonStyles from '../styles/Styles'
import commonStyles2 from '../styles/StylesUser'
import strings from '../config/Strings'
import colors from '../config/Colors'
import {
    isUserLoggedIn, startStackFrom, alertDialog, getColor, parseTime, getOnlyMonth, getOnlyDate,
    combineDateTime, getUTCDateTimeFromLocalDateTime, getUTConlyDate, assignColorsForHolidays,
    getLocalDateTimeFromLocalDateTime, getExactTimeOffset,
} from '../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, constants, urls, productSortBy, productOrderBy, isTotalBlock } from '../config/Constants'
import {
    getCommonParamsForAPI, getScreenDimensions, getImageDimensions, parseTextForCard, parseDiscountApplied,
    parseLocalDate, parseDate, getBuissnessId, plusOneDay
} from '../utilities/HelperFunctions'
import TitleBarComponent from '../components/TitleBarComponent'
import { hitApi } from '../api/ApiCall'
import LoaderComponent from '../components/LoaderComponent'
import ButtonComponent from '../components/ButtonComponent'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-material-dropdown';
import { Calendar, } from 'react-native-calendars'
import DateTimePickerModal from "react-native-modal-datetime-picker";

/**
 * Screen to Add Holidays
 */
export default class AddHolidayScreen extends Component {
    constructor(props) {
        super(props)

        this.state = {
            showModalLoader: false,
            isEdit: this.props.navigation.state.params.IS_EDIT,
            showDatePicker: false,
            timePicker: false,

            holidayDate: '',
            holidayFromTime: '',
            holidayToTime: '',

            holidayDateFull: null,
            holidayFromTimeFull: null,
            holidayToTimeFull: null,

            typeOfTime: 0,
            errorThere: false,
            holidayErrorText: '',

            fulldayoff: false,

            productsArray: [],
            selectedProduct: 0,
            selectedHolidayId: null,

            isTotalBlock: isTotalBlock.BLOCK_OPENING_HOURS,
        }

        this.todayDate = new Date()
        this.holidayToEdit = this.props.navigation.state.params.HOLIDAY_TO_EDIT
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={this.state.isEdit ? strings.edit_holiday : strings.add_holiday}
                    navigation={this.props.navigation} />

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
                                    <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}} />
                                </TouchableOpacity>

                                <Calendar
                                    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                                    minDate={this.todayDate}
                                    // Handler which gets executed on day press. Default = undefined
                                    onDayPress={(day) => {
                                        // setting day in the required format for processing further
                                        let date = new Date(day.year, (day.month - 1), day.day)

                                        this.setState({
                                            holidayDate: parseLocalDate(date) + '',
                                            holidayDateFull: date,
                                            showDatePicker: false,
                                            errorThere: false,
                                        })
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

                <View style={[commonStyles.container, { marginTop: 10, marginHorizontal: 20 }]}>
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
                            style={[{ marginStart: 10, }]}
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

                                            if (combinedDateTemp2.getTime() == combinedDateTemp1.getTime()) {
                                                this.setState({
                                                    holidayErrorText: strings.start_end_should_not_be_same,
                                                }, () => {
                                                    this.setState({
                                                        errorThere: true
                                                    })
                                                })
                                            } else if (combinedDateTemp2.getTime() < combinedDateTemp1.getTime()) {
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

                <DateTimePickerModal
                    isVisible={this.state.timePicker}
                    date={this.todayDate}
                    confirmTextIOS={strings.confirm}
                    cancelTextIOS={strings.cancel}
                    mode={'time'}
                    is24Hour={true}
                    onConfirm={(date) => {
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
                    }}
                    onCancel={() => {
                        this.setState({
                            timePicker: false
                        })
                    }} />
            </View>
        );
    }

    componentDidMount() {
        this.getProductList()
    }

    // API to get listing of products
    getProductList() {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }
            hitApi(urls.GetProductsBlockDate, urls.POST, params, this.showModalLoader, (res) => {
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
                    setTimeout(() => {
                        if (this.state.isEdit) {
                            this.getBlockDateDetail(this.holidayToEdit)
                        }
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    // API to add/update holiday
    addHoliday(fromTime, toTime) {
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

                    holidayDateFull: null,
                    holidayFromTimeFull: null,
                    holidayToTimeFull: null,

                    typeOfTime: 0,
                    errorThere: false,
                    holidayErrorText: '',
                    fulldayoff: false,
                    selectedHolidayId: null,
                    selectedProduct: 0,
                }, () => {
                    setTimeout(() => {
                        this.props.navigation.goBack(null);
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    // API to get details of a holiday/block date
    getBlockDateDetail = (item) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                blockDateId: item.blockDateId,
                timeOffset: getExactTimeOffset(),
            }
            hitApi(urls.GetEntrepreneurBlockDateDetail, urls.POST, params, this.showModalLoader, (res) => {
                setTimeout(() => {
                    let holiday = res.response.data[0];

                    if (holiday.productIds && holiday.productIds.length > 0) {
                        // case when product is selected
                        let productIndexSelected = this.getSelectedProductIndex(holiday.productIds[0].productId)

                        let startDateLocal = new Date(holiday.startDateTime)

                        let endDateLocal = new Date(holiday.endDateTime)
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
                            // Not showing now
                            /* this.setState({
                                isEdit: true,
                                showAddHolidayPopup: true,
                            }) */
                        })
                    } else {
                        // case when no product is selected
                        // setting the values of edited holiday on the add holiday popup
                        // changing from UTC to LOCAL time

                        let startDateLocal = new Date(holiday.startDateTime)                        
                        let endDateLocal = new Date(holiday.endDateTime)

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
                            // Not showing now
                            /* this.setState({
                                isEdit: true,
                                showAddHolidayPopup: true,
                            }) */
                        })
                    }
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // Get index of product based on product id
    getSelectedProductIndex(productId) {
        let value = 0;
        for (let i = 0; i < this.state.productsArray.length; i++) {
            if (this.state.productsArray[i].productId === productId) {
                value = i;
                break;
            }
        }
        return value;
    }

    // Returns time to show from date
    getShowTime = (date) => {
        let current = new Date();
        
        let currentOffset = current.getTimezoneOffset() * -1
        let receivedOffset = date.getTimezoneOffset() * -1
        
        if(receivedOffset > currentOffset) {
            let diff = receivedOffset - currentOffset
            date.setMinutes(date.getMinutes() - diff)
        } else if (receivedOffset < currentOffset) {
            let diff = currentOffset - receivedOffset
            date.setMinutes(date.getMinutes() + diff)
        }

        let hours = date.getHours()
        let minutes = date.getMinutes()
        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        let strTime = hours + ":" + minutes + " Uhr"/*  + " " + amPm */
        return strTime
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow,
        })
    }
}