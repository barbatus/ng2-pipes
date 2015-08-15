import {ChangeDetectorRef} from 'angular2/src/change_detection/change_detection';
import {DefaultIterableDiffer, DefaultIterableDifferFactory, CollectionChangeRecord} from 'angular2/src/change_detection/differs/default_iterable_differ';
import {CONST} from 'angular2/src/facade/lang';
import {ObservableDoc} from 'client/lib/mc_pipe';
import {MongoCollectionObserver, AddChange, MoveChange, RemoveChange} from 'client/lib/mongo_collection_observer';
import {ObservableWrapper} from 'angular2/src/facade/async';

@CONST()
export class MongoCollectionDifferFactory extends DefaultIterableDifferFactory {
  supports(obj: Object): boolean { return obj instanceof MongoCollectionObserver; }
  create(cdRef: ChangeDetectorRef): any { return new MongoCollectionDiffer(cdRef); }
}

class MongoCollectionDiffer {
  private _inserted: Array<CollectionChangeRecord> = [];
  private _removed: Array<CollectionChangeRecord> = [];
  private _moved: Array<CollectionChangeRecord> = [];
  private _observer = null;
  private _lastChanges: Array<AddChange|MoveChange|RemoveChange> = [];

  constructor(private cdRef: ChangeDetectorRef) {}

  forEachAddedItem(fn: Function) {
    for (var i = 0; i < this._inserted.length; i++) {
      fn(this._inserted[i]);
    }
  }

  forEachMovedItem(fn: Function) {
    for (var i = 0; i < this._moved.length; i++) {
      fn(this._moved[i]);
    }
  }

  forEachRemovedItem(fn: Function) {
    for (var i = 0; i < this._removed.length; i++) {
      fn(this._removed[i]);
    }
  }

  diff(observer: MongoCollectionObserver) {
    this._reset();

    if (this._observer !== observer) {
      var self = this;
      if (this._subscription) {
        ObservableWrapper.dispose(this._subscription);
      }
      this._subscription = ObservableWrapper.subscribe(observer,
        changes => {
          self._updateLatestValue(changes);
        });
      this._observer = observer;
    }

    if (this._lastChanges) {
      this._applyChanges(this._lastChanges);
      this._lastChanges = null;
      return this;
    }

    return null;
  }

  _updateLatestValue(changes) {
    this._lastChanges = changes;
  }

  _reset() {
    this._inserted.length = 0;
    this._moved.length = 0;
    this._removed.length = 0;
  }

  _applyChanges(changes) {
    for (var i = 0; i < changes.length; i++) {
      if (changes[i] instanceof AddChange) {
        this._inserted.push(this._createChangeRecord(
          changes[i].index, null, changes[i].item));
      }
      if (changes[i] instanceof MoveChange) {
        this._moved.push(this._createChangeRecord(
          changes[i].toIndex, changes[i].fromIndex, changes[i].item));
      }
      if (changes[i] instanceof RemoveChange) {
        this._removed.push(this._createChangeRecord(
          null, changes[i].index, changes[i].item));
      }
    }
  }

  _createChangeRecord(currentIndex, prevIndex, item) {
    var record = new CollectionChangeRecord(item);
    record.currentIndex = currentIndex;
    record.previousIndex = prevIndex;
    return record;
  }
}
