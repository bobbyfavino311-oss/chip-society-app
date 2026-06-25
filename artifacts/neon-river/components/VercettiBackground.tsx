import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const bgImage = require('@/assets/images/vercetti-bg.png');

export default function VercettiBackground() {
  return (
    <ImageBackground
      source={bgImage}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(0,40,55,0.30)',
          'rgba(255,20,100,0.06)',
          'rgba(0,60,70,0.22)',
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </ImageBackground>
  );
}
