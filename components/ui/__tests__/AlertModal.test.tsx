import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AlertModal } from '../AlertModal';

describe('AlertModal', () => {
  it('renders correct title and message when visible', () => {
    const { getByText } = render(
      <AlertModal
        visible={true}
        title="Test Title"
        message="Test Message"
        onClose={() => {}}
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Message')).toBeTruthy();
  });

  it('triggers onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <AlertModal
        visible={true}
        title="Test Title"
        message="Test Message"
        onClose={onCloseMock}
      />
    );

    fireEvent.press(getByText('Aceptar'));
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('renders custom buttons correctly and fires their callbacks', () => {
    const onCustomPress = jest.fn();
    const { getByText } = render(
      <AlertModal
        visible={true}
        title="Test Title"
        message="Test Message"
        buttons={[
          { text: 'Custom Action', onPress: onCustomPress }
        ]}
      />
    );

    const btn = getByText('Custom Action');
    expect(btn).toBeTruthy();
    
    fireEvent.press(btn);
    expect(onCustomPress).toHaveBeenCalled();
  });
});
