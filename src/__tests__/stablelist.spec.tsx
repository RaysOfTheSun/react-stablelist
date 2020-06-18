import React, { useRef } from "react";
import TestRenderer from "react-test-renderer";

import Test from "../components/Test/Test";
import StableList from "../components/list/StableList";

describe("<StableList/>", () => {
  test("Render a React-StableList component", () => {
    const listRef = useRef(null);
    const data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const propProvider = (
      key: string,
      index: number,
      isFresh: boolean,
      isFirstRender: boolean,
      testComponentContent: string | number
    ) => ({
      content: testComponentContent,
    });

    const list = TestRenderer.create(
      <StableList
        ref={listRef}
        data={data}
        dataKey={Math.random()}
        component={Test}
        itemCount={data.length}
        propProvider={propProvider}
      />
    );

    const listInstance = list.root;

    expect(listInstance.findByType(StableList).props.itemCount).toBe(10);

    let tree = list.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
