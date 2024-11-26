import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Login from './Login';
import Home from './Home';
export class App extends Component {
  render() {
    return (
      <View style={styles.container}>
       <Home/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Take up the entire screen space
  
  },
});

export default App;
