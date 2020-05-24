import React, { PureComponent, createRef } from "react";
import StableListUtils from "../../utils.js";
import propTypes from "prop-types";
import "../../styles/Styles.scss";

class List extends PureComponent {
  constructor(props) {
    super(props);
    this.util = new StableListUtils(this.props);
    this._currBatch = 0;
    this._deleteValue = 0;
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
    this._decrementVal = Math.floor(this.props.maxItems / this.props.threshold);
    this._itemRemainder = this.props.itemCount % this.props.threshold;
    this._containerElem = this._container.current;
    this._containerElem.addEventListener(
      "scroll",
      this.props.direction == this.directions.top ? this.handleScroll : this.handleScroll_inv
    );
    this._scrollingContainerElem = this._scrollingContainer.current;
    this.setState(
      { components: this.util.makeComponentBatch(this._batches, this._currBatch) },
      () => {
        if (this.props.direction == this.directions.bottom) {
          this._containerElem.scrollTop = this._containerElem.scrollHeight;
        }
      }
    );

    if (this.props.innerRef) this.props.innerRef.current = { updateAtIndex: this.updateAtIndex };
  }

  componentDidUpdate(prevProps) {
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
    this._decrementVal = Math.floor(this.props.maxItems / this.props.threshold);

    this._didScrollUp = false;

    this.setState({ components: this.util.makeComponentBatch(this._batches, this._currBatch) });
  };

  hanldeScrolledToTop = () => {
    if (this._currBatch >= this._decrementVal) {
      this._currDecBatch = this._currBatch - this._decrementVal;
      this._didScrollUp = true;
      --this._currBatch;

      this.setState((prevState) => ({
        components: this.util.updateComponents(
          prevState.components,
          this.util.makeComponentBatch(this._batches, this._currDecBatch),
          this.state.components.length >= this.props.maxItems,
          this.props.maxItems - this.props.threshold,
          this.state.components.length % this.props.threshold != 0
            ? this.props.threshold + this._itemRemainder
            : this.props.threshold,
          true
        )
      }));
    }
  };

  hanldeScrolledToBottom = () => {
    this._currBatch += 1;
    this.setState((prevState) => ({
      components: this.util.updateComponents(
        prevState.components,
        this.util.makeComponentBatch(this._batches, this._currBatch),
        this.state.components.length >= this.props.maxItems,
        0,
        this.props.threshold,
        false
      )
    }));
  };

  handleScroll = () => {
    const isTop = this._containerElem.scrollTop <= 1;
    const isBottom =
      this._containerElem.scrollHeight -
        this._containerElem.scrollTop -
        this._containerElem.clientHeight <
      1;

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
        this.state.components.length >= this.props.maxItems,
        this.props.maxItems - this.props.threshold,
        this.state.components.length % this.props.threshold != 0
          ? this.props.threshold + this._itemRemainder
          : this.props.threshold,
        true
      )
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
          this.state.components.length >= this.props.maxItems,
          0,
          this.props.threshold,
          false
        )
      }));
    }
  };

  handleScroll_inv = () => {
    const isTop = this._containerElem.scrollTop <= 1;
    const isBottom =
      this._containerElem.scrollHeight -
        this._containerElem.scrollTop -
        this._containerElem.clientHeight <
      1;

    if (isTop && this._currBatch - 1 >= 0) this.hanldeScrolledToTop_inv();
    else if (isBottom) this.hanldeScrolledToBottom_inv();
  };

  handleItemCountChange = (diff) => {
    const topCon =
      this.props.direction == this.directions.top && this._currBatch == this._batches.length - 1;

    const bottomCon =
      this.props.direction == this.directions.bottom &&
      this._currBatch >= this._batches.length - this._decrementVal;

    const newItemsStart = this.props.itemCount - diff;
    this._compQueue = this.util.makeComponents(newItemsStart, this.props.itemCount);
    this._itemRemainder = this.props.itemCount % this.props.threshold;

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
            this.state.components.length >= this.props.maxItems,
            0,
            diff,
            false
          )
        }),
        () => {
          this._compQueue = [];
        }
      );
    }
  };

  updateAtIndex = (index) => {
    const minBatch =
      this.props.direction == this.directions.top
        ? this._currBatch - (this._decrementVal - 1)
        : this._currBatch;

    if (index >= this._batches[minBatch].start) {
      let tmpComponents = [].concat(this.state.components);
      const targetIndex = this.util.getElementIndex(index);
      if (targetIndex != -1) tmpComponents[targetIndex] = this.util.makeComponent(index);
      this.setState({ components: tmpComponents });
    }
  };

  render() {
    return (
      <div className={"list-root"} ref={this._container}>
        <div className={"scrolling-container"} ref={this._scrollingContainer}>
          {this.state.components}
        </div>
      </div>
    );
  }

  static propTypes = {
    ref: propTypes.func,
    data: propTypes.array.isRequired,
    dataKey: propTypes.any.isRequired,
    maxItems: propTypes.number.isRequired,
    itemCount: propTypes.number.isRequired,
    threshold: propTypes.number.isRequired,
    component: propTypes.elementType.isRequired,
    propProvider: propTypes.func.isRequired,
    followNewItems: propTypes.bool,
    direction: propTypes.oneOf(["top", "bottom"])
  };

  static defaultProps = {
    direction: "top",
    threshold: 20,
    maxItems: 60
  };
}

const StableList = React.forwardRef((props, ref) => {
  return <List {...props} innerRef={ref} />;
});

export default StableList;
