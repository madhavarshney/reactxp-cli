import * as RX from 'reactxp';
import React from 'react';

const styles = {
  container: RX.Styles.createViewStyle({
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  }),
  helloWorld: RX.Styles.createTextStyle({
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 28,
  }),
  welcome: RX.Styles.createTextStyle({
    fontSize: 32,
    marginBottom: 12,
  }),
  instructions: RX.Styles.createTextStyle({
    fontSize: 16,
    color: '#aaa',
    marginBottom: 16,
  }),
  docLink: RX.Styles.createLinkStyle({
    fontSize: 16,
    color: 'blue',
    marginBottom: 16,
  }),
};

export class App extends RX.Component {
  constructor(props) {
    super(props);
    this._translationValue = RX.Animated.createValue(-100);
    this._animatedStyle = RX.Styles.createAnimatedTextStyle({
        transform: [{ translateY: this._translationValue }]
    });
  }

  componentDidMount() {
    RX.Animated.timing(this._translationValue, {
      duration: 500,
      toValue: 0,
      easing: RX.Animated.Easing.OutBack()
    }).start();
  }

  render() {
    return (
      <RX.View useSafeInsets={true}>
        <RX.View style={styles.container}>
          <RX.Animated.Text style={[styles.helloWorld, this._animatedStyle]}>
            Hello World
          </RX.Animated.Text>
          <RX.Text style={styles.welcome}>
            Welcome to ReactXP
          </RX.Text>
          <RX.Text style={styles.instructions}>
            Edit App.js to get started
          </RX.Text>
          <RX.Link style={styles.docLink} url={'https://microsoft.github.io/reactxp/docs'}>
            View ReactXP documentation
          </RX.Link>
        </RX.View>
      </RX.View>
    );
  }
}
