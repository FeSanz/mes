import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadyPage } from './ready.page';

describe('ReadyPage', () => {
  let component: ReadyPage;
  let fixture: ComponentFixture<ReadyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
