declare module 'lenis' {
  export default class Lenis {
    constructor(options?: {
      duration?: number;
      easing?: (t: number) => number;
      orientation?: 'vertical' | 'horizontal';
      gestureOrientation?: 'vertical' | 'horizontal';
      smoothWheel?: boolean;
      wheelMultiplier?: number;
      smoothTouch?: boolean;
      touchMultiplier?: number;
      infinite?: boolean;
    });

    raf(time: number): void;
    destroy(): void;
    start(): void;
    stop(): void;
    scrollTo(target: any, options?: any): void;
    on(event: string, callback: (args: any) => void): void;
  }
}
