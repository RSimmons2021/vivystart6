// Main StripeProvider
import React from 'react';
import { Platform } from 'react-native';
import StripeProviderWeb from './StripeProvider.web';
import StripeProviderNative from './StripeProvider.native';

interface StripeProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return <StripeProviderNative>{children}</StripeProviderNative>;
  } else {
    return <StripeProviderWeb>{children}</StripeProviderWeb>;
  }
};

export { useStripe } from './StripeContext';
export default StripeProvider;
