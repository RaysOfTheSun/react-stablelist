declare type GenericFunction<T> = (...args: Array<any>) => T;
declare interface StableListState {
  components: JSX.Element[];
}
declare interface StableListProps extends React.Props {
  ref?: React.MutableRefObject;
  style?: any;
  horizontalScrolling?: boolean;
  data: any[];
  dataKey: string | number;
  maxItems?: number | 60;
  itemCount: number;
  innerRef?: React.MutableRefObject;
  threshold?: number | 20;
  component: React.ClassType;
  propProvider: GenericFunction<Record<string, any>>;
  followNewItems?: boolean;
  direction?: string;
  className?: string;
}
declare interface StableListRef {
  current: {
    updateAtIndex: (index: number) => void;
    updateBatchOfIndex: (index: number) => void;
  };
}

declare module "react-stablelist" {
  import React from "react";
  declare const StableList: React.ForwardRefExoticComponent<
    Pick<
      StableListProps,
      | "component"
      | "propProvider"
      | "data"
      | "itemCount"
      | "threshold"
      | "style"
      | "horizontalScrolling"
      | "dataKey"
      | "maxItems"
      | "innerRef"
      | "followNewItems"
      | "direction"
      | "className"
    > &
      React.RefAttributes<unknown>
  >;
  export default StableList;
}
