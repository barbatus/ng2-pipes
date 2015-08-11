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
  private _cdRef: ChangeDetectorRef = null;
  private _inserted: Array<CollectionChangeRecord> = [];
  private _removed: Array<CollectionChangeRecord> = [];
  private _moved: Array<CollectionChangeRecord> = [];
  private _subscription = false;

  constructor(cdRef: ChangeDetectorRef) {
    this._cdRef = cdRef;
  }

  forEachAddedItem(fn: Function) {
    for (var i = 0; i < this._inserted.length; i++) {
      fn(this._inserted[i]);
    }
    this._inserted.length = 0;
  }

  forEachMovedItem(fn: Function) {
    for (var i = 0; i < this._moved.length; i++) {
      fn(this._moved[i]);
    }
    this._moved.length = 0;
  }

  forEachRemovedItem(fn: Function) {
    for (var i = 0; i < this._removed.length; i++) {
      fn(this._removed[i]);
    }
    this._removed.length = 0;
  }

  diff(observer: MongoCollectionObserver) {
    console.log('diff');
    if (!this._subscription) {
      var self = this;
      this._subscription = ObservableWrapper.subscribe(observer,
        changes => {
          self._updateLatestValue(changes);
        });
      self._applyChanges(observer.lastChanges);
    }

    return this;
  }

  _updateLatestValue(changes) {
    console.log('_updateLatestValue');
    this._applyChanges(changes);
    this._isUpdated = true;
    this._cdRef.requestCheck();
  }

  _applyChanges(changes) {
    this._inserted.length = 0;
    this._moved.length = 0;
    this._removed.length = 0;

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
