import {Renderer} from 'angular2/src/render/api';
import {Directive} from 'angular2/annotations';
import {ElementRef} from 'angular2/src/core/compiler/element_ref';
import {DefaultValueAccessor} from 'angular2/src/forms/directives';
import {NgControl} from 'angular2/forms';
import {setProperty} from 'angular2/src/forms/directives/shared';
import {Self} from 'angular2/src/di/decorators';
import {DOM} from 'angular2/src/dom/dom_adapter';

@Directive({
  selector: 'input[type=radio][ng-model]',
})
export class RadioControlValueAccessor extends DefaultValueAccessor {
  constructor(private cd: NgControl, private renderer: Renderer, private elementRef: ElementRef) {
    super(cd, renderer, elementRef);
  }

  writeValue(value: any) {
    if (DOM.getAttribute(this.elementRef.nativeElement, 'value') == value) {
      setProperty(this.renderer, this.elementRef, 'checked', value);
    }
  }
}
