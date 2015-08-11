///<reference path="../../typings/typings.d.ts"/>

import {Component, View, NgFor, NgIf} from 'angular2/angular2';
import {Pipes, defaultPipes} from 'angular2/src/change_detection/change_detection';
import {bind} from 'angular2/di'
import {routerDirectives} from 'angular2/router';
import {IterableDiffers} from 'angular2/src/change_detection/differs/iterable_differs';

import {PartyForm} from 'client/party-form/party-form';
import {MCPipe} from 'client/lib/mc_pipe'
import {MongoCollectionDifferFactory} from 'client/lib/mongo_collection_diff';
import {MongoCollectionObserver} from 'client/lib/mongo_collection_observer';

@Component({
  selector: 'parties',
  viewInjector: [
    bind(Pipes).toValue(new Pipes(Object.assign({}, defaultPipes.config, {
        mcp: [new MCPipe()]
    }))
  ],
  viewBindings: [
    IterableDiffers.extend([new MongoCollectionDifferFactory()])
  ]
})
@View({
  templateUrl: 'client/parties/parties.ng.html',
  directives: [NgFor, routerDirectives, PartyForm]
})
export class PartiesCmp {
  parties: IParty[];
  user: Object;

  constructor() {
    this.parties = new MongoCollectionObserver(function() {
        return Parties.find({name: this.get('name')});
    });
    this.parties.name = 'Party1';
  }

  loadParty() {
    this.parties.name = 'Party2';
  }
}
