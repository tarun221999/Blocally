import React, { Component } from 'react'
import { View } from 'react-native'
import ImageComponent from './ImageComponent'
import TextComponent from './TextComponent'
import colors from '../config/Colors';

export default class TabIconWithBadge extends React.Component {
    render() {
        const { iconName, badgeCount, color, size } = this.props;
        return (
            <View >
                {badgeCount > 0 && (
                    <View
                        style={{
                            position: 'absolute', top: -3, right: -10, backgroundColor: colors.primaryColor,
                            borderRadius: 7, minWidth: 14, height: 14, justifyContent: 'center',
                            alignItems: 'center', padding: 2
                        }}>
                        <TextComponent style={{ color: colors.white, fontSize: 7, fontWeight: 'bold' }}>
                            {badgeCount}
                        </TextComponent>
                    </View>
                )}
                <ImageComponent
                    source={iconName} />
            </View>
        );
    }
}