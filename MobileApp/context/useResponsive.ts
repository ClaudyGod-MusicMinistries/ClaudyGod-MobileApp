import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import responsive, { ScreenSize } from '../util/responsive';

const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    orientation: responsive.orientation,
    screenSize: responsive.screenSize
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Update the responsive singleton
      responsive.updateDimensions({ window });
      setDimensions({
        width: window.width,
        height: window.height,
        orientation: responsive.orientation,
        screenSize: responsive.screenSize
      });
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...responsive,
    ...dimensions,
    isPortrait: dimensions.orientation === 'portrait',
    isLandscape: dimensions.orientation === 'landscape',
  };
};

export default useResponsive;
export { ScreenSize };