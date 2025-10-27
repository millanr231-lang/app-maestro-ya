"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  start?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 2000,
  start = 0,
}) => {
  const [count, setCount] = useState(start);
  const ref = useRef(start);
  const accumulator = (end - start) / (duration / 30);

  const updateCount = () => {
    if (ref.current < end) {
      ref.current = Math.min(ref.current + accumulator, end);
      setCount(Math.round(ref.current));
      requestAnimationFrame(updateCount);
    } else {
        setCount(end);
    }
  };

  useEffect(() => {
    const animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, start, duration]);

  return <span>{count}</span>;
};
