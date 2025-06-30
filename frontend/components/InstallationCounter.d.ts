import React from 'react';

interface InstallationCounterProps {
  textColor?: string;
  iconColor?: string;
  backgroundColor?: string;
  centered?: boolean;
}

declare const InstallationCounter: React.FC<InstallationCounterProps>;

export default InstallationCounter; 