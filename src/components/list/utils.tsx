import React from "react";
import { v4 as uuid } from "uuid";

export default class StableListUtils {
  private _data: any[];
  private component: React.ClassType<any, any, any>;
  private propProvider: GenericFunction<Record<string, any>>;
  // private regExp: RegExp;
  private _id: string;
  constructor(
    {
      component,
      propProvider,
      data,
    }: {
      component: React.ClassType<any, any, any>;
      propProvider: GenericFunction<Record<string, any>>;
      data: any[];
    },
    componentID: string
  ) {
    this._data = data;
    this.component = component;
    this.propProvider = propProvider;
    // this.regExp = new RegExp("(?:history-item-)(d+)");
    this._id = componentID;
  }

  set data(data: any[]) {
    this._data = data;
  }

  computeBatches = ({ itemCount, threshold = 20 }: { itemCount: number; threshold?: number }) => {
    let batches = [];
    let start = 0;
    let end = itemCount < threshold ? itemCount : threshold;
    const numBatches = Math.floor(itemCount / threshold);

    if (numBatches == 0) return [{ start, end }];

    for (let i = 0; i < numBatches; ++i, start = end, end += threshold) {
      batches.push({ start, end });
    }

    batches[numBatches - 1].end = itemCount;

    return batches;
  };

  makeComponent = (index: number, isFresh?: boolean, isFirstRender?: boolean) => {
    return (
      <this.component
        className={`history-item component-${this._id} history-item-${index}`}
        {...this.propProvider(uuid(), index, isFresh, isFirstRender, this._data[index])}
      />
    );
  };

  makeComponents = (start: number, end: number) => {
    let components = [];
    for (let i = start; i < end; ++i) {
      components.push(this.makeComponent(i, true, true));
    }

    return components;
  };

  makeComponentBatch = (batches: { start: number; end: number }[], batch: number) => {
    let components = [];
    const { start, end } = batches[batch];
    for (let i = start; i < end; ++i) {
      components.push(this.makeComponent(i));
    }

    return components;
  };

  addComponents = (
    prevComponents: JSX.Element[],
    newComponents: JSX.Element[],
    prepend: boolean
  ) => {
    if (prepend) return newComponents.concat(prevComponents);

    return prevComponents.concat(newComponents);
  };

  updateComponents = (
    prevComponents: JSX.Element[],
    newComponents: JSX.Element[],
    willDelete: boolean,
    deleteStart: number,
    deleteCount: number,
    prepend: boolean
  ) => {
    let tmpComponents = prevComponents;
    if (willDelete) {
      tmpComponents.splice(deleteStart, deleteCount);
    }
    tmpComponents = this.addComponents(tmpComponents, newComponents, prepend);
    return tmpComponents;
  };

  updateBatchOfIndex = (
    batches: { start: number; end: number }[],
    targetBatch: number,
    threshold: number,
    components: any[],
    currBatch: number
  ) => {
    let updatedComponents = ([] as JSX.Element[]).concat(components);
    const { start, end } = batches[targetBatch];
    const replaceStart = this.getElementIndex(start);
    const replaceEnd = this.getElementIndex(end - 1);
    const newComponents = this.makeComponentBatch(batches, targetBatch);

    for (
      let i = replaceStart, newCompInd = 0, numReplace = end - start;
      i <= replaceEnd && newCompInd < numReplace;
      ++i, ++newCompInd
    ) {
      updatedComponents[i] = newComponents[newCompInd];
    }

    return updatedComponents;
  };

  isScrolledToBottom = (isHorizSrcolling: boolean, scrollingElem: HTMLDivElement) => {
    if (isHorizSrcolling) {
      return scrollingElem.scrollWidth - scrollingElem.scrollLeft - scrollingElem.clientWidth <= 1;
    }

    return scrollingElem.scrollHeight - scrollingElem.scrollTop - scrollingElem.clientHeight < 1;
  };

  isScrolledToTop = (isHorizSrcolling: boolean, scrollingElem: HTMLDivElement) => {
    if (isHorizSrcolling) {
      return scrollingElem.scrollLeft <= 1;
    }

    return scrollingElem.scrollTop <= 1;
  };

  // getElementIndexByClassStr = (classStr) => {
  //   const matches:RegExpExecArray = this.regExp.exec(classStr);
  //   return matches.length != 0 ? matches[1] * 1 : -1;
  // };

  getElementIndex = (index: number) => {
    // history-item component-${this._id} history-item-${index}
    const elements = document.querySelectorAll(`.history-item.component-${this._id}`);
    for (let ind = 0, len = elements.length; ind < len; ++ind) {
      if (elements[ind].classList.contains(`history-item-${index}`)) return ind;
    }

    return -1;
  };

  // getBatchFromClassName = (classStr: any, batches: { start: number; end: number }[]) => {
  //   const matches: RegExpExecArray = this.regExp.exec(classStr);
  //   if (matches.length == 0) return -1;

  //   const target = Number(matches[1]);

  //   return batches.findIndex(
  //     (indexSet: { start: number; end: number }) =>
  //       target >= indexSet.start && target <= indexSet.end
  //   );
  // };
}
