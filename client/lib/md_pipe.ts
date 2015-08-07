///<reference path="../../typings/typings.d.ts"/>

import {Pipe, WrappedValue, PipeFactory, BasePipe, ChangeDetectorRef} from 'angular2/src/change_detection/change_detection';
import {Directive, LifecycleEvent} from 'angular2/annotations';

import {ObservableWrapper} from 'angular2/src/facade/async';

export class MDPipe extends BasePipe implements PipeFactory {
  _cdRef: ChangeDetectorRef;

  _docs: Array<any>;

  constructor(cdRef: ChangeDetectorRef) {
    super();
    this._cdRef = cdRef;
    this._subscription = null;
  }

  transform(docObs: any, args: List<any> = null): any {
    if (!this._subscription) {
      var self = this;
      this._subscription = ObservableWrapper.subscribe(docObs, value => {
        self._updateLatestValue(value);
      });
      return null;
    }

    if (!this._isUpdated) {
      return this._latestReturnedValue;
    }

    this._isUpdated = false;
    this._latestReturnedValue = this._latestValue;
    return WrappedValue.wrap(this._latestValue);
  }

  _updateLatestValue(value: Object) {
    console.log('_updateLatestValue');
    this._isUpdated = true;
    this._latestValue = value;
    this._cdRef.requestCheck();
  }

  create(cdRef: ChangeDetectorRef): Pipe {
    return new MDPipe(cdRef);
  }
}

@Directive({
  selector: '[md]',
  lifecycle: [LifecycleEvent.onCheck],
  properties: ['md']
})
export class MD {
  constructor() {}

  onCheck() {}
}
