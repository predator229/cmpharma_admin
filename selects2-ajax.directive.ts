import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';

import * as $ from 'jquery';
import 'select2';

@Directive({
  selector: '[select2Ajax]'
})
export class Select2AjaxDirective implements OnInit, OnDestroy {
  @Input() apiUrl!: string;
  @Input() country!: string;
  @Output() selected = new EventEmitter<string>();

  private $el!: JQuery<HTMLElement>;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    setTimeout(() => this.initSelect2(), 0);
  }

  private initSelect2(): void {
    this.$el = $(this.el.nativeElement);

    this.$el.select2({
      placeholder: 'Sélectionner une ville',
      width: '100%',
      dropdownParent: $('body'),
      minimumInputLength: 2,
      ajax: {
        url: this.apiUrl,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        delay: 250,
        cache: true,
        data: (params: { term: string }) => {
          return JSON.stringify({
            country: this.country,
            search: params.term
          });
        },
        processResults: (data: any, params: any) => {
          const list: string[] = data?.data ?? [];

          const filtered = params.term
            ? list.filter((c: string) =>
              c.toLowerCase().includes(params.term.toLowerCase())
            )
            : list;

          return {
            results: filtered.slice(0, 50).map((city: string) => ({
              id: city,
              text: city
            })),
            pagination: { more: filtered.length > 50 }
          };
        }
      }
    });

    this.$el.on('change', () => {
      const selectedValue = this.$el.val();
      if (typeof selectedValue === 'string') {
        this.selected.emit(selectedValue);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.$el) {
      this.$el.select2('destroy');
    }
  }
}
