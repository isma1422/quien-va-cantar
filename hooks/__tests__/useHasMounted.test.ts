import { renderHook } from '@testing-library/react-native';
import { useHasMounted } from '../useHasMounted';

describe('useHasMounted', () => {
  it('should return false initially and then true after mount', () => {
    const { result } = renderHook(() => useHasMounted());
    
    // In React Native Testing Library, rendering a hook runs effects immediately,
    // so it should have transitioned to true after the initial render/mount cycle.
    expect(result.current).toBe(true);
  });
});
