import React from "react";
import { v4 as uuid } from "uuid";

export default class StableListUtils {
  constructor({ component, propProvider, data }) {
    this._data = data;
    this.component = component;
    this.propProvider = propProvider;
  }

  set data(data) {
    this._data = data;
  }

  computeBatches = ({ itemCount, threshold }) => {
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

  makeComponent = (index, isFresh, isFirstRender) => {
    return (
      <this.component
        className={`history-item history-item-${index}`}
        {...this.propProvider(uuid(), index, isFresh, isFirstRender, this._data[index])}
      />
    );
  };

  makeComponents = (start, end) => {
    let components = [];
    for (let i = start; i < end; ++i) {
      components.push(this.makeComponent(i, true, true));
    }

    return components;
  };

  makeComponentBatch = (batches, batch) => {
    let components = [];
    const { start, end } = batches[batch];

    for (let i = start; i < end; ++i) {
      components.push(this.makeComponent(i));
    }

    return components;
  };

  addComponents = (prevComponents, newComponents, prepend) => {
    if (prepend) return newComponents.concat(prevComponents);

    return prevComponents.concat(newComponents);
  };

  updateComponents = (
    prevComponents,
    newComponents,
    willDelete,
    deleteStart,
    deleteCount,
    prepend
  ) => {
    let tmpComponents = prevComponents;
    if (willDelete) {
      tmpComponents.splice(deleteStart, deleteCount);
    }
    tmpComponents = this.addComponents(tmpComponents, newComponents, prepend);
    return tmpComponents;
  };

  getElementIndex = (index) => {
    const elements = document.getElementsByClassName("history-item");
    for (let ind = 0, len = elements.length; ind < len; ++ind) {
      if (elements[ind].classList.contains(`history-item-${index}`)) return ind;
    }

    return -1;
  };
}
