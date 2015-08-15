import {EventEmitter} from 'angular2/src/facade/async';
import {ObservableDoc} from 'client/lib/mc_pipe';

class CursorHandle {
  private _cursor: Mongo.Cursor<any>;
  private _hAutoNotify;
  private _hCurObserver;

  constructor(cursor, hAutoNotify, hCurObserver) {
    this._cursor = cursor;
    this._hAutoNotify = hAutoNotify;
    this._hCurObserver = hCurObserver;
  }

  stop() {
    this._hAutoNotify.stop();
    this._hCurObserver.stop();
  }
}

export class AddChange {
  constructor(public index: number, public item: any) {}
}

export class MoveChange {
  constructor(public fromIndex: number, public toIndex: Number) {}
}

export class RemoveChange {
  constructor(public index: number) {}
}

export class MongoCollectionObserver extends EventEmitter {
  private _docs: Array<any> = [];
  private _changes: Array<any> = [];
  private _lastChanges: Array<any> = [];
  private _cursorDefFunc;
  private _hCursor;
  private _propMap = {};

  constructor(cursorDefFunc) {
    super();
    this._cursorDefFunc = cursorDefFunc;
    this._defineGets(cursorDefFunc);
    this._startAutoCursorUpdate(cursorDefFunc); 
  }

  _defineGets(cursorDefFunc) {
    cursorDefFunc.call(this);
  }

  get(propName): any {
    if (!this._propMap[propName]) {
      var depVar = new Tracker.Dependency();
      this._propMap[propName] = {
        depVar: depVar,
        value: this[propName]
      };
      var self = this;
      Object.defineProperty(this, propName, {
          get: function() {
            return self._propMap[propName].value;
          },
          set: function(value) {
            self._propMap[propName].value = value;
            self._propMap[propName].depVar.changed();
          },
          enumerable: true,
          configurable: true
      });
    }
    this._propMap[propName].depVar.depend();
    return this[propName];
  }

  _startAutoCursorUpdate(cursorDefFunc) {
    var self = this;
    Tracker.autorun(zone.bind(() => {
      if (self._hCursor) {
        self._stopCursor(self._hCursor);
        self._hCursor = null;
      }
      self._hCursor = self._startCursor(cursorDefFunc.call(self));
    }));
  }

  _stopCursor(cursorHandle: CursorHandle) {
    cursorHandle.stop();
    var len = this._docs.length;
    this._docs.length = 0;
    for (var i = 0; i < len; i++) {
      this._changes.push(new RemoveChange(i));
    }
  }

  _startCursor(cursor: Mongo.Cursor<any>) {
    var hCurObserver = this._startCursorObserver(cursor);
    var hAutoNotify = this._startAutoChangesNotify(cursor);
    return new CursorHandle(cursor, hAutoNotify, hCurObserver);
  }

  _startAutoChangesNotify(cursor: Mongo.Cursor<any>) {
    var self = this;
    return Tracker.autorun(zone.bind(() => {
      cursor.fetch();
      var lastChanges = self._changes.splice(0);
      if (lastChanges.length) {
        self.next(lastChanges);
      }
    }));
  }

  _startCursorObserver(cursor: Mongo.Cursor<any>) {
    var self = this;
    return cursor.observe({
      addedAt: function(doc, index) {
        self._addAt(doc, index);
      },

      changedAt: function(doc1, doc2, index) {
        self._docs[index].next(doc1);
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
    var obsDoc = new ObservableDoc(doc);
    this._docs.splice(index, 0, obsDoc);
    this._changes.push(new AddChange(index, obsDoc));
  }

  _moveTo(doc, fromIndex, toIndex) {
    var obsDoc = this._docs.splice(fromIndex, 1)[0];
    this._docs.splice(toIndex, 0, obsDoc);
    this._changes.push(new MoveChange(fromIndex, toIndex));
  }

  _removeAt(index) {
    this._docs.splice(index, 1);
    this._changes.push(new RemoveChange(index));
  }
}
