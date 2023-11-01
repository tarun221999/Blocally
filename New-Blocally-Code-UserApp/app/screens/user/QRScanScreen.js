import React, { Component } from 'react';
import { View } from 'react-native';
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import commonStyles from '../../styles/Styles'
import colors from '../../config/colors'
import strings from '../../config/strings'
// import QRCodeScanner from 'react-native-qrcode-scanner';

/**
 * NOT BEING USED AS OF NOW
 */

export default class QRScanScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModalLoader: false
        }
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.scan_qr}
                    navigation={this.props.navigation} />
                {/* <QRCodeScanner
                    onRead={this.onScanSuccess}
                /> */}
            </View>
        );
    }

    onScanSuccess = (e) => {
        this.props.navigation.state.params.receiveQRCode(e.data)
        this.props.navigation.goBack(null)
    }
}