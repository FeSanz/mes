import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FailuresPage } from './failures.page';

describe('FailuresPage', () => {
  let component: FailuresPage;
  let fixture: ComponentFixture<FailuresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FailuresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
