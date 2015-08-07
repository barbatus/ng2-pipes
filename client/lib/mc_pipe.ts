///<reference path="../../typings/typings.d.ts"/>

import {Pipe, WrappedValue, PipeFactory, BasePipe, ChangeDetectorRef} from 'angular2/src/change_detection/change_detection';

import {EventEmitter} from 'angular2/src/facade/async';

export class MCPipe extends BasePipe implements PipeFactory {
  _cdRef: ChangeDetectorRef;

  _docs: Array<any>;

  constructor(cdRef: ChangeDetectorRef) {
    super();
    this._cdRef = cdRef;
    this._docs = [];
    this._observer = null;
    this._isUpdated = false;
  }

  transform(collection: any, args: List<any> = null): Array<any> {
    if (!this._observe) {
        setTimeout(() => this._startAutoRequestCheck(collection));
        this._observe = this._startObserver(collection);
    }

    if (!this._isUpdated) {
      return this._docs;
    }

    this._isUpdated = false;
    return WrappedValue.wrap(this._docs);
  }

  _startAutoRequestCheck(collection) {
    var self = this;
    Tracker.autorun(zone.bind(() => {
      console.log('_startAutoRequestCheck');
      collection.fetch();
      self._cdRef.requestCheck();
    }));
  }

  _startObserver(collection) {
    var self = this;
    return collection.observe({
      addedAt: function(doc, index) {
        self._addAt(doc, index);
        this._isUpdated = true;
      },

      changedAt: function(doc1, doc2, index) {
        self._docs[index].next(doc1);
        this._isUpdated = true;
      },

      movedTo: function(doc, fromIndex, toIndex) {
        self._moveTo(doc, fromIndex, toIndex);
        this._isUpdated = true;
      },

      removedAt: function(doc, atIndex) {
        self._removeAt(atIndex);
        this._isUpdated = true;
      }
    });
  }

  _addAt(doc, index) {
    this._docs.splice(index, 0, this._createObsDoc(doc));
  }

  _moveTo(doc, fromIndex, toIndex) {
    this._docs.splice(fromIndex, 1);
    this._docs.splice(toIndex, 0, this._createObsDoc(doc));
  }

  _removeAt(index) {
    this._docs.splice(index, 1);
  }

  _createObsDoc(doc) {
    return new ObservableDoc(doc);
  }

  create(cdRef: ChangeDetectorRef): Pipe {
    return new MCPipe(cdRef);
  }
}

export class ObservableDoc extends EventEmitter {
  constructor(doc) {
    super();
    this._doc = doc;
  }

  get doc(): any {
    return this._doc;
  }

  next(doc) {
    super.prototype.next.call(this, doc);
    this._doc = doc;
  }
}
