// UNIVERSAL MOCK - Returns mocks for EVERYTHING
const handler = {
  get(target, prop) {
    // Return a function that returns itself for chaining
    const mock = () => mock;
    
    // Add all possible properties
    Object.setPrototypeOf(mock, {
      then: () => mock,
      catch: () => mock,
      finally: () => mock,
      subscribe: () => mock,
      unsubscribe: () => mock,
      on: () => mock,
      off: () => mock,
      emit: () => mock,
      addEventListener: () => mock,
      removeEventListener: () => mock,
      appendChild: () => mock,
      removeChild: () => mock,
      set: () => mock,
      get: () => mock,
      delete: () => mock,
      clear: () => mock,
      forEach: () => mock,
      map: () => mock,
      filter: () => mock,
      reduce: () => mock,
      find: () => mock,
      includes: () => false,
      indexOf: () => -1,
      push: () => mock,
      pop: () => mock,
      shift: () => mock,
      unshift: () => mock,
      slice: () => mock,
      splice: () => mock,
      concat: () => mock,
      join: () => '',
      toString: () => '',
      valueOf: () => 0,
      toJSON: () => ({}),
      length: 0,
      size: 0,
      [Symbol.iterator]: function* () {},
      // Math functions for mathjs
      add: () => 0,
      subtract: () => 0,
      multiply: () => 0,
      divide: () => 0,
      pow: () => 0,
      sqrt: () => 0,
      sin: () => 0,
      cos: () => 0,
      tan: () => 0,
      log: () => 0,
      exp: () => 0,
      abs: () => 0,
      round: () => 0,
      floor: () => 0,
      ceil: () => 0,
      min: () => 0,
      max: () => 0,
      random: () => 0,
      // React component properties
      render: () => null,
      componentDidMount: () => {},
      componentWillUnmount: () => {},
      setState: () => {},
      forceUpdate: () => {},
      props: {},
      state: {},
      context: {},
      refs: {},
      // Motion properties for framer-motion
      animate: {},
      initial: {},
      exit: {},
      transition: {},
      variants: {},
      whileHover: {},
      whileTap: {},
      whileDrag: {},
      drag: false,
      dragConstraints: {},
      dragElastic: 0,
      // DOM properties
      style: {},
      className: '',
      id: '',
      innerHTML: '',
      textContent: '',
      value: '',
      checked: false,
      disabled: false,
      // Factory/utils properties
      create: () => mock,
      factory: () => mock,
      getInstance: () => mock,
      default: mock,
      // All possible exports
      ...Array(100).fill(null).reduce((acc, _, i) => {
        acc[`export${i}`] = mock;
        acc[`method${i}`] = mock;
        acc[`property${i}`] = mock;
        return acc;
      }, {})
    });
    
    // Make it callable and constructable
    mock.prototype = mock;
    mock.constructor = mock;
    
    return mock;
  },
  
  has() {
    return true;
  },
  
  set() {
    return true;
  },
  
  deleteProperty() {
    return true;
  },
  
  ownKeys() {
    return ['default', 'motion', 'AnimatePresence', 'useAnimation', 'useMotionValue', 
            'useTransform', 'useSpring', 'useScroll', 'animate', 'all', 'create',
            'add', 'subtract', 'multiply', 'divide', 'sqrt', 'pow', 'abs',
            'sin', 'cos', 'tan', 'log', 'exp', 'min', 'max', 'round', 'floor', 'ceil'];
  },
  
  getOwnPropertyDescriptor() {
    return {
      enumerable: true,
      configurable: true,
      value: new Proxy({}, handler)
    };
  }
};

// Create the universal mock
const universalMock = new Proxy({}, handler);

// Export everything possible
module.exports = universalMock;
module.exports.default = universalMock;
module.exports.__esModule = true;

// Also assign everything to exports directly
Object.assign(module.exports, {
  motion: universalMock,
  AnimatePresence: universalMock,
  useAnimation: universalMock,
  useMotionValue: universalMock,
  useTransform: universalMock,
  useSpring: universalMock,
  useScroll: universalMock,
  useViewportScroll: universalMock,
  animate: universalMock,
  AnimateSharedLayout: universalMock,
  LayoutGroup: universalMock,
  LazyMotion: universalMock,
  domAnimation: universalMock,
  domMax: universalMock,
  m: universalMock,
  // Math exports
  all: universalMock,
  create: universalMock,
  factory: universalMock,
  add: universalMock,
  subtract: universalMock,
  multiply: universalMock,
  divide: universalMock,
  pow: universalMock,
  sqrt: universalMock,
  sin: universalMock,
  cos: universalMock,
  tan: universalMock,
  log: universalMock,
  exp: universalMock,
  abs: universalMock,
  round: universalMock,
  floor: universalMock,
  ceil: universalMock,
  min: universalMock,
  max: universalMock,
  random: universalMock,
  matrix: universalMock,
  zeros: universalMock,
  ones: universalMock,
  identity: universalMock,
  transpose: universalMock,
  inv: universalMock,
  det: universalMock,
  // Utils exports
  noop: universalMock,
  identity: universalMock,
  constant: universalMock,
  stubTrue: universalMock,
  stubFalse: universalMock,
  // Add 1000 more potential exports
  ...Array(1000).fill(null).reduce((acc, _, i) => {
    acc[`export${i}`] = universalMock;
    return acc;
  }, {})
});