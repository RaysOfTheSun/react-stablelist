import clsx from "clsx";
import propTypes from "prop-types";
import { v4 as uuid } from "uuid";
import React, { PureComponent, createRef, CSSProperties } from "react";

import "styles/Styles.scss";
import StableListUtils from "./utils";

class List extends PureComponent<StableListProps, StableListState> {
  private util: StableListUtils;
  private _currBatch: number;
  private _decrementVal: number;
  private _currDecBatch: number;
  private _itemRemainder: number;
  private _addedItem: boolean;
  private _didScrollUp: boolean;
  private directions: { top: "top"; bottom: "bottom" };
  private _batches: { start: number; end: number }[];
  private _compQueue: JSX.Element[];
  private _container: React.RefObject<HTMLDivElement>;
  private _scrollingContainer: React.RefObject<HTMLDivElement>;
  private _containerElem!: HTMLDivElement;
  private _scrollingContainerElem!: HTMLDivElement;
  private _id: string;

  constructor(props: StableListProps) {
    super(props);
    this._id = uuid();
    this.util = new StableListUtils(this.props, this._id);
    this._currBatch = 0;
    this._decrementVal = 0;
    this._currDecBatch = 0;
    this._itemRemainder = 0;

    this._addedItem = false;
    this._didScrollUp = false;

    this._batches = [];
    this._compQueue = [];
    this._container = createRef();
    this._scrollingContainer = createRef();

    this.state = { components: [] };
    this.directions = { top: "top", bottom: "bottom" };
  }

  componentDidMount() {
    this._batches = this.util.computeBatches(this.props);
    this._currBatch = this.props.direction == this.directions.top ? 0 : this._batches.length - 1;
    this._decrementVal = Math.floor(this.props.maxItems!! / this.props.threshold!!);
    this._itemRemainder = this.props.itemCount % this.props.threshold!;
    this._containerElem = this._container.current!;

    if (this._containerElem) {
      this._containerElem.addEventListener(
        "scroll",
        this.props.direction == this.directions.top
          ? this.directions.top && this.handleScroll
          : this.directions.bottom && this.handleScroll_inv
      );
    }

    this._scrollingContainerElem = this._scrollingContainer.current!;
    this.setState(
      {
        components: this.util.makeComponentBatch(this._batches, this._currBatch),
      },
      () => {
        if (this.props.direction == this.directions.bottom) {
          this._containerElem.scrollTop = this._containerElem.scrollHeight;
        }
      }
    );

    if (this.props.innerRef)
      this.props.innerRef.current = {
        updateAtIndex: this.updateAtIndex,
        updateBatchOfIndex: this.updateBatchOfIndex,
      };
  }

  componentDidUpdate(prevProps: StableListProps) {
    if (prevProps.dataKey != this.props.dataKey) {
      this._reconstruct();
    } else if (this.props.itemCount != prevProps.itemCount) {
      this.handleItemCountChange(this.props.itemCount - prevProps.itemCount);
    } else if (this._didScrollUp) {
      this._didScrollUp = false;
      this._containerElem.scrollTop = this._scrollingContainerElem.scrollHeight * 0.2;
    } else if (this._addedItem && this.props.followNewItems) {
      this._addedItem = false;
      this._containerElem.scrollTo(0, this._scrollingContainerElem.scrollHeight);
    }
  }

  _reconstruct = () => {
    this._compQueue = [];
    this._batches = this.util.computeBatches(this.props);
    this.util.data = this.props.data;

    this._currBatch = this.props.direction == this.directions.top ? 0 : this._batches.length - 1;
    this._currDecBatch = 0;
    this._decrementVal = Math.floor(this.props.maxItems! / this.props.threshold!);

    this._didScrollUp = false;

    this.setState({
      components: this.util.makeComponentBatch(this._batches, this._currBatch),
    });
  };

  hanldeScrolledToTop = () => {
    if (this._currBatch >= this._decrementVal) {
      this._currDecBatch = this._currBatch - this._decrementVal;
      this._didScrollUp = true;
      --this._currBatch;

      this.setState((prevState: StableListState) => ({
        components: this.util.updateComponents(
          prevState.components,
          this.util.makeComponentBatch(this._batches, this._currDecBatch),
          this.state.components.length >= this.props.maxItems!,
          this.props.maxItems! - this.props.threshold!,
          this.state.components.length % this.props.threshold! != 0
            ? this.props.threshold! + this._itemRemainder
            : this.props.threshold!,
          true
        ),
      }));
    }
  };

  hanldeScrolledToBottom = () => {
    this._currBatch += 1;
    this.setState((prevState) => ({
      components: this.util.updateComponents(
        prevState.components,
        this.util.makeComponentBatch(this._batches, this._currBatch),
        this.state.components.length >= this.props.maxItems!,
        0,
        this.props.threshold!,
        false
      ),
    }));
  };

  handleScroll = () => {
    // const isTop = this.props.horizontalScrolling
    //   ? this._containerElem.scrollLeft <= 1
    //   : this._containerElem.scrollTop <= 1;
    // const isBottom = this.props.horizontalScrolling
    //   ? this._containerElem.scrollWidth -
    //       this._containerElem.scrollLeft -
    //       this._containerElem.clientWidth <=
    //     1
    //   : this._containerElem.scrollHeight -
    //       this._containerElem.scrollTop -
    //       this._containerElem.clientHeight <
    //     1;

    const isTop = this.util.isScrolledToTop(this.props.horizontalScrolling!, this._containerElem);
    const isBottom = this.util.isScrolledToBottom(
      this.props.horizontalScrolling!,
      this._containerElem
    );

    if (isTop && this._currBatch != 0) this.hanldeScrolledToTop();
    else if (isBottom && this._currBatch + 1 < this._batches.length) this.hanldeScrolledToBottom();
  };

  hanldeScrolledToTop_inv = () => {
    --this._currBatch;
    this._didScrollUp = true;
    this.setState((prevState) => ({
      components: this.util.updateComponents(
        prevState.components,
        this.util.makeComponentBatch(this._batches, this._currBatch),
        this.state.components.length >= this.props.maxItems!,
        this.props.maxItems! - this.props.threshold!,
        this.state.components.length % this.props.threshold! != 0
          ? this.props.threshold! + this._itemRemainder
          : this.props.threshold!,
        true
      ),
    }));
  };

  hanldeScrolledToBottom_inv = () => {
    if (this._currBatch + this._decrementVal <= this._batches.length - 1) {
      this._currDecBatch = this._currBatch + this._decrementVal;
      ++this._currBatch;
      this.setState((prevState) => ({
        components: this.util.updateComponents(
          prevState.components,
          this.util.makeComponentBatch(this._batches, this._currDecBatch),
          this.state.components.length >= this.props.maxItems!,
          0,
          this.props.threshold!,
          false
        ),
      }));
    }
  };

  handleScroll_inv = () => {
    const isTop = this.util.isScrolledToTop(this.props.horizontalScrolling!, this._containerElem);
    const isBottom = this.util.isScrolledToBottom(
      this.props.horizontalScrolling!,
      this._containerElem
    );

    if (isTop && this._currBatch - 1 >= 0) this.hanldeScrolledToTop_inv();
    else if (isBottom) this.hanldeScrolledToBottom_inv();
  };

  handleItemCountChange = (diff: number) => {
    const topCon =
      this.props.direction == this.directions.top && this._currBatch == this._batches.length - 1;

    const bottomCon =
      this.props.direction == this.directions.bottom &&
      this._currBatch >= this._batches.length - this._decrementVal;

    const newItemsStart = this.props.itemCount - diff;
    this._compQueue = this.util.makeComponents(newItemsStart, this.props.itemCount);
    this._itemRemainder = this.props.itemCount % this.props.threshold!;

    if (topCon || bottomCon) {
      this._addedItem = true;
      this._batches = this.util.computeBatches(this.props);
      this._currBatch = this._batches.length - 1;
      this.util.data = this.props.data;

      this.setState(
        (prevState) => ({
          components: this.util.updateComponents(
            prevState.components,
            this._compQueue,
            this.state.components.length >= this.props.maxItems!,
            0,
            diff,
            false
          ),
        }),
        () => {
          this._compQueue = [];
        }
      );
    }
  };

  updateAtIndex = (index: number) => {
    if (index < 0) return;

    const targetIndex = this.util.getElementIndex(index);
    let components = ([] as JSX.Element[]).concat(this.state.components);
    components[targetIndex] = this.util.makeComponent(index);
    this.setState({ components });
  };

  updateBatchOfIndex = (index: number) => {
    if (index < 0) return;

    const targetBatch = this._batches.findIndex(
      (indexSet) => index >= indexSet.start && index <= indexSet.end
    );
    this.setState((prevState) => ({
      components: this.util.updateBatchOfIndex(
        this._batches,
        targetBatch,
        this.props.threshold!,
        prevState.components,
        this._currBatch
      ),
    }));
  };

  // refresh = () => {
  //   const renderedElements = document.querySelectorAll(`.history-item.component-${this._id}`);
  //   const componentIntersect = Math.floor(renderedElements.length / 2);

  //   const renderedBatches = new Set([
  //     this.util.getBatchFromClassName(renderedElements[0].classList, this._batches),
  //     this.util.getBatchFromClassName(
  //       renderedElements[componentIntersect].classList,
  //       this._batches
  //     ),
  //     this.util.getBatchFromClassName(
  //       renderedElements[renderedElements.length - 1].classList,
  //       this._batches
  //     ),
  //   ]).entries();
  // };

  render() {
    return (
      <div
        className={clsx(this.props.className, "list-root", {
          "horizontal-scroll": this.props.horizontalScrolling,
        })}
        ref={this._container}
        style={this.props.style as CSSProperties}>
        <div className={"scrolling-container"} ref={this._scrollingContainer}>
          {this.state.components}
        </div>
      </div>
    );
  }

  static propTypes = {
    ref: propTypes.func,
    data: propTypes.array.isRequired,
    style: propTypes.oneOfType([propTypes.object, propTypes.array]),
    dataKey: propTypes.any.isRequired,
    innerRef: propTypes.shape({ current: propTypes.any }),
    maxItems: propTypes.number.isRequired,
    className: propTypes.string,
    itemCount: propTypes.number.isRequired,
    threshold: propTypes.number.isRequired,
    component: propTypes.elementType.isRequired,
    propProvider: propTypes.func.isRequired,
    followNewItems: propTypes.bool,
    horizontalScrolling: propTypes.bool,
    direction: propTypes.oneOf(["top", "bottom"]),
  };

  static defaultProps = {
    direction: "top",
    threshold: 20,
    maxItems: 60,
  };
}

const StableList = React.forwardRef((props: StableListProps, ref) => {
  return <List {...props} innerRef={ref} />;
});

export default StableList;
