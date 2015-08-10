import {ChangeDetectorRef} from 'angular2/src/change_detection/change_detection';
import {DefaultIterableDiffer, DefaultIterableDifferFactory} from 'angular2/src/change_detection/differs/default_iterable_differ';
import {CONST} from 'angular2/src/facade/lang';

@CONST()
export class MongoCollectionDifferFactory extends DefaultIterableDifferFactory {
  supports(obj: Object): boolean { return obj instanceof Mongo.Cursor; }
  create(cdRef: ChangeDetectorRef): any { return new MongoCollectionDiffer(cdRef); }
}

class MongoCollectionDiffer extends DefaultIterableDiffer {
  private _cdRef: ChangeDetectorRef = null;
  private _cursor: Mongo.Cursor<any> = null;
  private _observer: Meteor.LiveQueryHandle = null;
  private _docs: Array<any> = [];

  constructor(cdRef: ChangeDetectorRef) {
    super();
    this._cdRef = cdRef;
  }

  diff(cursor: Mongo.Cursor<any>) {
    if (!this._cursor) {
      this._cursor = cursor;
      setTimeout(() => this._startAutoRequestCheck(cursor));
      this._observer = this._startObserver(cursor);
      return super.prototype.diff.call(this, this._docs);
    }

    if (this._isUpdated) {
      this._isUpdated = false;
      return super.prototype.diff.call(this, this._docs);;
    }

    return this;
  }

  _startAutoRequestCheck(cursor: Mongo.Cursor<any>) {
      var self = this;
      Tracker.autorun(zone.bind(() => {
          console.log('_startAutoRequestCheck');
          cursor.fetch();
          self._cdRef.requestCheck();
          self._isUpdated = true;
      }));
  }

  _startObserver(cursor: Mongo.Cursor<any>) {
    var self = this;
    return cursor.observe({
      addedAt: function(doc, index) {
        self._addAt(doc, index);
      },

      changedAt: function(doc1, doc2, index) {
        self._docs[index] = doc1;
      },

      movedTo: function(doc, fromIndex, toIndex) {
        self._moveTo(doc, fromIndex, toIndex);
      },

      removedAt: function(doc, atIndex) {
        self._removeAt(atIndex);
      }
    });
  }

  _addAt(doc, index) {
    this._docs.splice(index, 0, doc);
  }

  _moveTo(doc, fromIndex, toIndex) {
    this._docs.splice(fromIndex, 1);
    this._docs.splice(toIndex, 0, doc);
  }

  _removeAt(index) {
    this._docs.splice(index, 1);
  }
}
