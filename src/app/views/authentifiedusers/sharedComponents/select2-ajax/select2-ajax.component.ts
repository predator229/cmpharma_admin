import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';

import * as $ from 'jquery';
import 'select2';
import {Country} from "../../../../models/Country.class";
import {Category} from "../../../../models/Category.class";

@Component({
  selector: 'app-select2-ajax',
  templateUrl: './select2-ajax.component.html',
  styleUrls: ['./select2-ajax.component.scss']
})
export class Select2AjaxComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('selectElem', { static: true }) selectElem!: ElementRef<HTMLSelectElement>;

  @Input() apiUrl!: string;
  @Input() country!: string;
  @Input() type!: string;
  @Input() countriesListArray: { [id: string]: Country | Category } | null;
  @Input() value?: string;
  @Input() placeholder = 'Sélectionner une option';

  @Output() selected = new EventEmitter<string>();

  private $el!: JQuery;
  private isSelect2Initialized = false;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initSelect2();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.isSelect2Initialized) {
      this.updateSelectedValue();
    }
  }

  private initSelect2(): void {
    this.$el = $(this.selectElem.nativeElement);
    const modalParent = this.$el.closest('.modal');

    this.$el.select2({
      placeholder: this.placeholder,
      width: '100%',
      dropdownParent: modalParent.length ? modalParent : $('body'),
      minimumInputLength: 2,
      ajax: {
        url: this.apiUrl,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        delay: 250,
        cache: true,
        data: (params: any) => JSON.stringify({
          country: this.countriesListArray?.[this.country]?.name ?? this.country,
          search: params.term
        }),
        processResults: (data: any, params: any) => {
          return this.processResults(data, params);
        }
      }
    });

    this.$el.on('change', () => {
      this.selected.emit(this.$el.val() as string);
    });

    this.isSelect2Initialized = true;

    if (this.value) {
      this.updateSelectedValue();
    }
  }
  private updateSelectedValue(): void {
    if (!this.$el || !this.isSelect2Initialized) return;

    this.$el.empty();

    if (this.value) {
      let optionText = this.value;

      if (this.type === 'country' && this.countriesListArray?.[this.value] && this.countriesListArray[this.value] instanceof Country) {
        const country = this.countriesListArray[this.value] as Country;
        optionText = `${country.emoji ?? ''} ${country.name} (${country.code})`;
      }

      if (this.type === 'category' && this.countriesListArray?.[this.value] && this.countriesListArray[this.value] instanceof Category) {
        const country = this.countriesListArray[this.value] as Category;
        optionText = `${country.name} (${country.slug})`;
      }

      const option = new Option(optionText, this.value, true, true);
      this.$el.append(option).trigger('change');
    }
  }

  private processResults(data: any, params: any): any {
    if (this.type === 'city') {
      const firstResult = { id: '', text: '' };
      const list: string[] = data?.data ?? [];
      const filtered = params.term
        ? list.filter((c) => c.toLowerCase().includes(params.term.toLowerCase()))
        : list;
      return {
        results: [firstResult, ...filtered.slice(0, 50).map((city: string) => ({
          id: city,
          text: city
        }))],
        pagination: { more: filtered.length > 50 }
      };
    } else if (this.type === 'country' && typeof data?.countriesIdText !== 'undefined') {
      const list: any[] = data?.countriesIdText ?? [];
      const filtered = params.term
        ? list.filter((c) => c.text.toLowerCase().includes(params.term.toLowerCase()))
        : list;
      return {
        results: filtered.slice(0, 50),
        pagination: { more: filtered.length > 50 }
      };
    }
    return { results: [] };
  }

  ngOnDestroy(): void {
    if (this.$el) {
      this.$el.select2('destroy');
    }
  }
}
