import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { WebContainer } from '../WebContainer';

// Mock Platform to verify different OS behavior
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const Platform = jest.requireActual('react-native/Libraries/Utilities/Platform');
  return {
    ...Platform,
    select: jest.fn((objs) => objs.web || objs.default),
    OS: 'web',
  };
});

describe('WebContainer', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('renders children inside a container on web', () => {
    // Force Platform.OS to web (already mocked)
    const { getByText } = render(
      <WebContainer>
        <Text>Test Web Content</Text>
      </WebContainer>
    );

    expect(getByText('Test Web Content')).toBeTruthy();
  });
});
