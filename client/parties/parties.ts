///<reference path="../../typings/typings.d.ts"/>

import {Component, View, NgFor, NgIf} from 'angular2/angular2';
import {Pipes, defaultPipes, CHECK_ALWAYS} from 'angular2/src/change_detection/change_detection';
import {bind} from 'angular2/di'
import {routerDirectives} from 'angular2/router';

import {PartyForm} from 'client/party-form/party-form';
import {MCPipe} from 'client/lib/mc_pipe'

@Component({
  selector: 'parties',
  viewInjector: [
      bind(Pipes).toValue(new Pipes(Object.assign({}, defaultPipes.config, {
          mcp: [new MCPipe()]
      }))
  ],
  changeDetection: CHECK_ALWAYS
})
@View({
  templateUrl: 'client/parties/parties.ng.html',
  directives: [NgFor, routerDirectives, PartyForm]
})
export class PartiesCmp {
  parties: IParty[];
  user: Object;

  constructor() {
    this.parties = Parties.find();
  }
}
