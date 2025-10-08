import React from 'react';
import CountUp from 'react-countup';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  separator?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  separator = ','
}) => {
  return (
    <CountUp
      end={value}
      duration={duration}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      separator={separator}
      preserveValue={true}
      className={className}
    />
  );
};

export default AnimatedNumber;
