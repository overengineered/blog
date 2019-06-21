import React from 'react';
import {Button, SafeAreaView, Switch, Text, View} from 'react-native';

const server = 'https://enzzig7fs9o5j.x.pipedream.net';

function CheckBox({value, label, onValueChange, testID}) {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', padding: 10}}>
      <Text>{label}</Text>
      <Switch onValueChange={onValueChange} value={value} testID={testID}/>
    </View>
  );
}

export default function Example() {
  const [awesome, setAwesome] = React.useState(false);
  const [stunning, setStunning] = React.useState(false);
  const sendData = () => {
    fetch(server, {method: 'PUT', body: JSON.stringify({awesome, stunning})});
  };
  return (
    <SafeAreaView>
      <Text style={{fontSize: 20, fontWeight: 'bold', alignSelf: 'center'}}>React Native is:</Text>
      <CheckBox value={awesome} label="Awesome" onValueChange={setAwesome} testID="awesome"/>
      <CheckBox value={stunning} label="Stunning" onValueChange={setStunning} testID="stunning"/>
      <Button title="Send" onPress={sendData} testID="submit"/>
    </SafeAreaView>
  );
}
