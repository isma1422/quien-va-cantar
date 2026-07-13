import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders title correctly', () => {
    const { getByText } = render(<Button title="Press Me" />);
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders ActivityIndicator when loading', () => {
    const { queryByText } = render(<Button title="Press Me" loading={true} />);
    
    // Title text should not be visible when loading
    expect(queryByText('Press Me')).toBeNull();
  });
});
