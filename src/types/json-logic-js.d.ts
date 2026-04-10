declare module "json-logic-js" {
  interface Logic {
    apply(logic: any, data?: any): any;
    add_operation(name: string, operation: (...args: any[]) => any): void;
    rm_operation(name: string): void;
  }

  const logic: Logic;
  export default logic;
}
