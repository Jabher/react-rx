import * as R from "ramda";
import Rx from "rxjs/Rx";
import React from "react";

export const rxConnected = (component) => class RxConnection extends BaseRxConnection {
  static Component = component;
};

export class BaseRxConnection extends React.PureComponent {
  static Component = null;
  propsStream = new Rx.BehaviorSubject(null);

  componentWillMount() {
    const pipe = this.propsStream
      .distinctUntilChanged(R.equals)
      .filter(value => value !== null)
      .map(R.pipe(
        R.toPairs,
        R.flatten,
        R.map(val => val instanceof Rx.Observable ? val : Rx.Observable.of(val)),
        observables => Rx.Observable
          .combineLatest(...observables)
          .map(R.pipe(R.splitEvery(2), R.fromPairs))
      ))
      .switch()
      .distinctUntilChanged(R.equals);

    this.subscription = pipe.subscribe(props => {
      this.computedProps = props;
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  render() {
    process.nextTick(() => this.propsStream.next(this.props));

    if (!this.computedProps)
      return null;

    return <this.constructor.Component {...this.computedProps}/>
  }
}
