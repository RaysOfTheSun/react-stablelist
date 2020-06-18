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
