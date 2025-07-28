declare module '@faker-js/faker' {
  export const faker: any;
}

declare module 'react-native-chart-kit' {
  export const PieChart: any;
  export const LineChart: any;
  export const BarChart: any;
}

declare module 'dayjs' {
  const dayjs: any;
  export default dayjs;
}

declare module 'dayjs/locale/fr' {}

// Pour les assets
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}
