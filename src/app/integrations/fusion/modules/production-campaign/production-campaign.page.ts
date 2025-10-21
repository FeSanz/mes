import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonToggle, IonModal, IonItem, IonInput, IonDatetime, IonMenuButton, IonDatetimeButton, IonSelect, IonSelectOption, IonTextarea,
  IonBreadcrumb, IonBreadcrumbs, IonCol, IonButtons, IonButton, IonPopover, IonList, IonRippleEffect
} from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

import { PrimeTemplate } from "primeng/api";
import { Table, TableModule } from "primeng/table";
import { Select } from "primeng/select";
import { FloatLabel } from "primeng/floatlabel";
import { pencilOutline, trashOutline, eyeOutline, reorderThreeOutline, addOutline, checkmark, moveOutline, checkmarkCircle, checkmarkOutline, unlinkOutline, backspaceOutline, menuOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Tag } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { InputText } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleMenu } from 'src/app/models/design';
import { DialogModule } from 'primeng/dialog';
import { Dialog } from "primeng/dialog";
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-production-campaign',
  templateUrl: './production-campaign.page.html',
  styleUrls: ['./production-campaign.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PrimeTemplate, TableModule, IonToggle, IonModal,
    IonItem, IonInput, IonDatetime, IonMenuButton, IonDatetimeButton, IonSelect, IonSelectOption, IonTextarea, Select, FloatLabel, IonBreadcrumb, IonBreadcrumbs, Tag, IonCol,
    ButtonModule, IonButtons, IonButton, InputText, IonPopover, IonList, IonRippleEffect, IconFieldModule, InputIconModule, DialogModule, Dialog, DatePicker, ReactiveFormsModule]
})
export class ProductionCampaignPage {
  campaignsArray: any = []
  workOrdersArray: any = []
  freeWorkOrdersArray: any = []
  userData: any = {};
  isModalOpen = false
  isModalFreeOrdersOpen = false
  rowsPerPage: number = 19;
  rowsPerPageOptions: number[] = [5, 10, 20];
  scrollHeight: string = '90%';
  searchValueAl: string = '';
  searchOrders: string = '';
  currentCampaign: any = {
    campaign_id: "",
    name: "",
    code: ""
  }
  currentWO: any = {
    id: "",
    work_order_number: ""
  }
  showCampaign = false
  isModalNewCampaign = false
  isModalNewWO = false
  campaignObj: any = {
    isNew: true,
    code: '',
    name: '',
    description: '',
    status_telegram: 'Unschedule',
    enabled_flag: 'Y'
  }
  todayDate: any = {}
  woObj: any = {}
  organizationSelected: string | any = '';
  workCenter: any = {}
  workCenters: any = []
  selectedOrders: any[] = [];
  selectedFreeOrders: any[] = [];
  selectedCampaigns: any[] = []
  isDragging: boolean = false;
  draggedItems: any[] = [];
  dropIndicatorVisible: boolean = false;
  statusGeneral = 0;

  /*lots = [
    { id: 1, name: 'Lote A', available: 120 },
    { id: 2, name: 'Lote B', available: 50 },
    { id: 3, name: 'Lote C', available: 0 }
  ];*/
  date: Date | undefined;

  minDate: Date | undefined;

  maxDate: Date | undefined
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.organizationSelected = this.userData.Company.Organizations[1];
    addIcons({ menuOutline, trashOutline, pencilOutline, eyeOutline, checkmark, backspaceOutline, checkmarkOutline, checkmarkCircle, addOutline, moveOutline, reorderThreeOutline });
  }

  formatLocalISO(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  ionViewDidEnter() {
    this.SetDate()
    this.GetWorkCenters()
  }
  GetWorkCenters() {
    this.apiService.GetRequestRender('workCenters/' + this.organizationSelected.OrganizationId).then((response: any) => {
      if (!response.items) {
        this.alerts.Info(response.message);
      } else {
        this.workCenters = response.items
        this.workCenter = response.items[0]
        this.GetCampaigns()
      }
    })
  }
  GetCampaigns() {
    this.apiService.GetRequestRender(`campaigns/${this.workCenter.WorkCenterId}`).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.showCampaign = false
        this.currentCampaign = {}
        this.selectedOrders = []
        this.selectedCampaigns = []
        this.campaignsArray = response.items
        this.campaignObj = {
          campaign_id: 0,
          isNew: true,
          code: '',
          name: '',
          description: '',
          status_telegram: 'Unschedule',
          enabled_flag: 'Y',
        }
        this.SetDate()
      }
    })
  }
  SetDate() {
    let today = new Date();

    this.minDate = new Date();
    this.minDate.setHours(12, 0, 0, 0);

    // maxDate: dentro de 7 días a las 12 PM
    this.maxDate = new Date();
    this.maxDate.setDate(today.getDate() + 7);
    this.maxDate.setHours(12, 0, 0, 0);
  }
  ClearCampaigns(table: any) {
    table.clear();
    this.searchValueAl = '';
  }
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }
  EditCampaign(wo: any) {
    this.campaignObj = wo
    this.campaignObj.isNew = false
    this.campaignObj.visualization = false
    this.isModalNewCampaign = true
    this.changeDetector.detectChanges()
  }
  OnlyCloseCampaignModal() {
    this.campaignObj = {
      campaign_id: 0,
      isNew: true,
      visualization: false,
      code: '',
      name: '',
      description: '',
      status_telegram: 'Unschedule',
      enabled_flag: 'Y',
    }
    this.isModalNewCampaign = false
    this.isModalFreeOrdersOpen = false
    this.changeDetector.detectChanges()
  }
  ShowCampaign(wo: any) {
    this.campaignObj = wo
    this.campaignObj.visu = true
    this.campaignObj.visualization = true
    this.isModalNewCampaign = true
    this.changeDetector.detectChanges()
  }
  async DeleteCampaign(cmp: any) {
    if (await this.alerts.ShowAlert("¿Deseas eliminar esta campaña?", "Alerta", "Atrás", "Eliminar")) {
      this.apiService.DeleteRequestRender('campaigns/' + cmp.campaign_id).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.alerts.Success("Campaña eliminada");
          this.GetCampaigns()
        } else {
          this.alerts.Info(response.error);
        }
      })
    }
  }
  getCampaignsStatus() {
    const statuses = new Set(this.selectedCampaigns.map(c => c.status_telegram));
    if (statuses.size === 1) {
      // Solo un estado
      return statuses.has("Published to MES")
        ? "1"
        : statuses.has("Published to L2")
          ? "2"
          : statuses.has("Unschedule")
            ? "0"
            : Array.from(statuses)[0];
    }

    return "3"; // más de un estado
  }
  async PublishToMES() {
    if (await this.alerts.ShowAlert("¿Deseas publicar esta" + (this.selectedCampaigns.length > 1 ? "s" : "") + " campaña" + (this.selectedCampaigns.length > 1 ? "s" : "") + " hacia MES?", "Alerta", "Atrás", "Publicar")) {

    }
  }
  async PublishToL2() {
    if (await this.alerts.ShowAlert("¿Deseas publicar esta" + (this.selectedCampaigns.length > 1 ? "s" : "") + " campaña" + (this.selectedCampaigns.length > 1 ? "s" : "") + " a Nivel 2?", "Alerta", "Atrás", "Publicar")) {

    }
  }
  async RecoveryToMES() {
    if (await this.alerts.ShowAlert("¿Deseas recuperar esta" + (this.selectedCampaigns.length > 1 ? "s" : "") + " campaña" + (this.selectedCampaigns.length > 1 ? "s" : "") + " hacia MES?", "Alerta", "Atrás", "Recuperar")) {

    }
  }
  async DeleteOrder(wo: any) {
    if (await this.alerts.ShowAlert("¿Deseas desasociar esta orden?", "Alerta", "Atrás", "Eliminar")) {
      this.apiService.DeleteRequestRender('work-orders/unassign/' + wo.work_order_id).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.alerts.Success("Orden eliminada");
          this.freeWorkOrdersArray.push(wo)
          this.currentCampaign.work_orders = this.currentCampaign.work_orders.filter((w: any) => w.work_order_id != wo.work_order_id);
        } else {
          this.alerts.Info(response.error);
        }
      })
    }
  }
  async DeleteOrders() {
    const orgsIds = this.selectedOrders.map((wo: any) => wo.work_order_id).join(',');//IDs separados por coma (,)
    if (await this.alerts.ShowAlert("¿Deseas desasociar las órdenes seleccionadas?", "Alerta", "Atrás", "Eliminar")) {
      this.apiService.DeleteRequestRender('work-orders/unassign/' + orgsIds).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.alerts.Success("Orden(es) eliminada(s)");
          this.currentCampaign.work_orders = this.currentCampaign.work_orders.filter(
            (w: any) => !this.selectedOrders.some(s => s.work_order_id === w.work_order_id)
          );
          this.freeWorkOrdersArray = [
            ...(this.freeWorkOrdersArray || []),
            ...this.selectedOrders
          ];
          this.selectedOrders = [];
          this.changeDetector.detectChanges()
        } else {
          this.alerts.Info(response.error);
        }
      })
    }
  }
  ViewOrder(wo: any) {

  }
  SaveSelectedFreeOrdersToCampaign() {
    const payload = this.buildAssignPayload(
      this.currentCampaign.campaign_id,
      this.currentCampaign,
      this.selectedFreeOrders
    );
    this.apiService.PutRequestRender('work-orders/assign-campaign', payload).then(async (response: any) => {
      if (response.errorsExistFlag) {
        //this.alerts.Info(response.message);
      } else {
        this.alerts.Success("Orden(s) de trabajo agregada(s)");

        let payload: any = { parts: [] }
        this.selectedFreeOrders.forEach((item: any, index: any) => {
          payload.parts.push({
            id: "part" + (index + 1),
            path: "/inventoryOnhandBalances?limit=500&totalResults=true&onlyData=true&links=canonical&fields=ItemNumber;lots:LotNumber,&q=OrganizationCode='" + this.organizationSelected.Code + "' and ItemNumber='" + item.item_number + "'",
            operation: "get"
          })
        });
        this.apiService.PostRequestBatchFusion('', payload).then((response: any) => {
          const data = JSON.parse(response)
          const lotsMap = new Map<string, Set<string>>();
          // Procesar cada parte del response
          if (data.parts) {
            data.parts.forEach((part: any) => {
              // Procesar los items dentro del payload de cada parte
              if (part.payload && part.payload.items) {
                part.payload.items.forEach((lotItem: any) => {
                  const itemNumber = lotItem.ItemNumber;
                  if (!lotsMap.has(itemNumber)) {
                    lotsMap.set(itemNumber, new Set<string>());
                  }
                  // Agregar cada lote al Set (automáticamente evita duplicados)
                  if (lotItem.lots && lotItem.lots.items) {
                    lotItem.lots.items.forEach((lot: any) => {
                      lotsMap.get(itemNumber)!.add(lot.LotNumber);
                    });
                  }
                });
              }
            });
          }
          // Combinar con work_orders
          if (this.selectedFreeOrders) {
            this.selectedFreeOrders.forEach((workOrder: any) => {
              const itemNumber = workOrder.item_number;
              if (lotsMap.has(itemNumber) && lotsMap.get(itemNumber)!.size > 0) {
                const lotsSet = lotsMap.get(itemNumber)!;
                workOrder.lots = Array.from(lotsSet).map(lotName => ({
                  name: lotName
                }));
              } else {
                // Si no hay lotes para este item, agregar "Sin lote"
                workOrder.lots = [{ name: "Sin lote" }];
              }
            });
          }
          this.isModalFreeOrdersOpen = false
          this.freeWorkOrdersArray = this.freeWorkOrdersArray.filter(
            (w: any) => !this.selectedFreeOrders.some(s => s.work_order_id === w.work_order_id)
          );
          this.currentCampaign.work_orders = [
            ...(this.currentCampaign.work_orders || []),
            ...this.selectedFreeOrders
          ];
          this.selectedFreeOrders = [];
        })
        this.changeDetector.detectChanges()
      }
    });
    /*this.freeWorkOrdersArray = this.freeWorkOrdersArray.filter((w: any) => w.work_order_id != wo.work_order_id);*/
  }
  buildAssignPayload(campaign_id: number, currentCampaign: any, selectedFreeOrders: any[]) {
    // Última secuencia de la campaña actual
    let lastSequence = 0;
    if (currentCampaign.work_orders?.length) {
      // Busca el máximo valor de secuencia existente en la campaña
      lastSequence = Math.max(...currentCampaign.work_orders.map((wo: any) => wo.sequence || 0));
    }
    // Empieza a sumar desde el último + 10
    let sequenceCounter = lastSequence + 10;
    // Construir payload
    const work_orders = selectedFreeOrders.map((wo: any) => {
      const payloadItem = {
        work_order_id: parseInt(wo.work_order_id, 10),
        sequence: sequenceCounter
      };
      wo.sequence = sequenceCounter
      sequenceCounter += 10; // incrementar de 10 en 10
      return payloadItem;
    });
    return {
      campaign_id,
      work_orders
    };
  }
  SaveCampaign() {
    //this.alerts.PDAlertShow('Por favor espere...', 'contrast');
    //this.alerts.PDLoading(true); // Activar loading
    const payload = {
      organization_id: this.organizationSelected.OrganizationId,
      code: this.campaignObj.code,
      name: this.campaignObj.name,
      description: this.campaignObj.description,
      start_date: this.maxDate,
      end_date: this.minDate,
      status_telegram: "Unschedule",//this.campaignObj.status_telegram,
      enabled_flag: this.campaignObj.enabled_flag,
      work_center_id: this.workCenter.WorkCenterId
    }
    this.apiService.PostRequestRender('campaigns', payload, false).then(async (response: any) => {
      //this.alerts.PDAlertHide();
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);
        this.isModalNewCampaign = false
        this.GetCampaigns()
      }
    });
  }
  SaveCampaignChanges() {
    //this.alerts.PDAlertShow('Por favor espere...', 'contrast');
    //this.alerts.PDLoading(true); // Activar loading
    const payload = {
      code: this.campaignObj.code,
      name: this.campaignObj.name,
      description: this.campaignObj.description,
      start_date: this.maxDate,
      end_date: this.minDate
    }
    this.apiService.PutRequestRender('campaigns/' + this.campaignObj.campaign_id, payload, false).then(async (response: any) => {
      //this.alerts.PDAlertHide();
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);
        this.isModalNewCampaign = false
        this.GetCampaigns()
      }
    });
  }
  ClearOrders(table: any) {
    table.clear();
    this.searchValueAl = '';
  }
  GetCurrentCampaign(campaign: any) {
    this.currentCampaign = campaign
    this.apiService.GetRequestRender(`campaign/${campaign.campaign_id}`).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.currentCampaign = response
        if (this.currentCampaign.work_orders?.length > 0) {
          let payload: any = { parts: [] }
          this.currentCampaign.work_orders.forEach((item: any, index: any) => {
            payload.parts.push({
              id: "part" + (index + 1),
              path: "/inventoryOnhandBalances?limit=500&totalResults=true&onlyData=true&links=canonical&fields=ItemNumber;lots:LotNumber,&q=OrganizationCode='" + this.organizationSelected.Code + "' and ItemNumber='" + item.item_number + "'",
              operation: "get"
            })
          });
          this.apiService.PostRequestBatchFusion('', payload).then((response: any) => {
            const data = JSON.parse(response)
            const lotsMap = new Map<string, Set<string>>();
            // Procesar cada parte del response
            if (data.parts) {
              data.parts.forEach((part: any) => {
                // Procesar los items dentro del payload de cada parte
                if (part.payload && part.payload.items) {
                  part.payload.items.forEach((lotItem: any) => {
                    const itemNumber = lotItem.ItemNumber;
                    if (!lotsMap.has(itemNumber)) {
                      lotsMap.set(itemNumber, new Set<string>());
                    }
                    // Agregar cada lote al Set (automáticamente evita duplicados)
                    if (lotItem.lots && lotItem.lots.items) {
                      lotItem.lots.items.forEach((lot: any) => {
                        lotsMap.get(itemNumber)!.add(lot.LotNumber);
                      });
                    }
                  });
                }
              });
            }
            // Combinar con work_orders
            if (this.currentCampaign.work_orders) {
              this.currentCampaign.work_orders.forEach((workOrder: any) => {
                const itemNumber = workOrder.item_number;
                if (lotsMap.has(itemNumber) && lotsMap.get(itemNumber)!.size > 0) {
                  const lotsSet = lotsMap.get(itemNumber)!;
                  workOrder.lots = Array.from(lotsSet).map(lotName => ({
                    name: lotName
                  }));
                } else {
                  // Si no hay lotes para este item, agregar "Sin lote"
                  workOrder.lots = [{ name: "Sin lote" }];
                }
              });
            }
          })
        }
      }
    })
    this.apiService.GetRequestRender(`work-orders/without-campaign/${this.organizationSelected.OrganizationId}/${this.workCenter.WorkCenterId}`, false).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        //this.workOrdersArray = response.items
        this.freeWorkOrdersArray = response.items
      }
    })
    this.showCampaign = true
  }
  SaveLotOnWO(selectedLot: any, item: any) {
    if (selectedLot != item.selectedlot) {
      this.apiService.PutRequestRender(`work-orders/update-lot/${Number(item.work_order_id)}`, { lot_number: selectedLot }).then(async (response: any) => {
        if (response.errorsExistFlag) {
          //this.alerts.Info(response.message);
        } else {
          this.alerts.Success("Lote actualizado");
          item.selectedlot = selectedLot
          this.changeDetector.detectChanges()
        }
      });
    }
  }
  ShowNewWO() {
    this.isModalNewWO = true
  }
  ShowNewCampaign() {
    this.isModalNewCampaign = true
    this.campaignObj = {
      campaign_id: 0,
      code: this.campaignsArray.length != 0 ? (Number(this.campaignsArray[this.campaignsArray.length - 1].code) + 1) : 2150,
      isNew: true,
      visualization: false,
      name: '',
      description: '',
      status_telegram: 'Unschedule',
      enabled_flag: 'Y',
    }
    this.SetDate()
  }
  ////////****************///////////*************////////************/////********** */ */ */ */
  onDragStart(event: DragEvent, item: any) {
    if (!this.isSelected(item)) {
      event.preventDefault();
      return;
    }
    this.isDragging = true;
    this.draggedItems = [...this.selectedOrders];
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify(this.draggedItems));
    }
    // Agregar clase visual durante el drag
    setTimeout(() => {
      document.body.classList.add('dragging-active');
    }, 0);
  }
  // Función para manejar drag over
  onDragOver(event: DragEvent, rowIndex: number) {
    if (!this.isDragging) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.showDropIndicator(event, rowIndex);
  }
  // Función para manejar el drop
  onDrop(event: DragEvent, dropIndex: number) {
    if (!this.isDragging) return;
    event.preventDefault();
    const targetItem = this.currentCampaign.work_orders[dropIndex];
    // No permitir drop sobre items seleccionados
    if (this.isSelected(targetItem)) {
      this.onDragEnd(event);
      return;
    }
    this.moveSelectedRowsToPosition(dropIndex);
    this.onDragEnd(event);
  }
  // Función para finalizar el arrastre
  onDragEnd(event: DragEvent) {
    this.isDragging = false;
    this.draggedItems = [];
    this.dropIndicatorVisible = false;

    // Remover clase visual
    document.body.classList.remove('dragging-active');

    // Limpiar indicadores visuales
    const indicators = document.querySelectorAll('.drop-indicator-temp');
    indicators.forEach(indicator => indicator.remove());
  }
  // Mostrar indicador de drop
  showDropIndicator(event: DragEvent, rowIndex: number) {
    const targetItem = this.currentCampaign.work_orders[rowIndex];

    // 🚫 Si el target está seleccionado, no muestres la línea
    if (this.isSelected(targetItem)) {
      this.removeDropIndicator();
      return;
    }

    // Limpiar indicador previo
    this.removeDropIndicator();

    const targetRow = event.currentTarget as HTMLElement;
    const rect = targetRow.getBoundingClientRect();
    const mouseY = event.clientY;
    const rowMiddle = rect.top + rect.height / 2;

    // Determinar si insertar antes o después
    const insertAfter = mouseY > rowMiddle;

    // Crear línea indicadora
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator-temp';
    indicator.style.position = 'absolute';
    indicator.style.height = '2px';
    indicator.style.background = 'red';
    indicator.style.left = rect.left + 'px';
    indicator.style.width = rect.width + 'px';
    indicator.style.top = insertAfter ? rect.bottom + 'px' : rect.top + 'px';
    indicator.style.zIndex = '9999';
    indicator.style.pointerEvents = 'none';

    document.body.appendChild(indicator);
  }
  // 👇 función auxiliar para limpiar
  removeDropIndicator() {
    const old = document.querySelector('.drop-indicator-temp');
    if (old) old.remove();
  }
  // Mover filas seleccionadas a nueva posición
  moveSelectedRowsToPosition(targetIndex: number) {
    const workOrders = [...this.currentCampaign.work_orders];
    const selectedIndices = this.selectedOrders.map(order =>
      workOrders.findIndex(wo => wo.work_order_number === order.work_order_number)
    ).sort((a, b) => a - b);

    // Extraer elementos seleccionados
    const selectedItems = selectedIndices.map(index => workOrders[index]);

    // Crear array sin los elementos seleccionados
    const filteredArray = workOrders.filter((_, index) =>
      !selectedIndices.includes(index)
    );

    // Calcular nueva posición considerando elementos removidos
    let adjustedTargetIndex = targetIndex;
    /*for (const selectedIndex of selectedIndices) {
      if (selectedIndex < targetIndex) {
        adjustedTargetIndex--;
        console.log(selectedIndex);

      }
    }*/

    // Insertar elementos en la nueva posición
    filteredArray.splice(adjustedTargetIndex, 0, ...selectedItems);

    this.currentCampaign.work_orders = filteredArray;

    // Actualizar secuencia con incrementos de 10
    this.updateRowSequence();
  }
  // Actualizar secuencia con incrementos de 10 (10, 20, 30, etc.)
  updateRowSequence() {
    this.currentCampaign.work_orders.forEach((order: any, index: any) => {
      order.sequence = (index + 1) * 10;
    });

    // Guardar en el backend
    this.saveOrderSequence();

    /*console.log('Secuencias actualizadas:', this.currentCampaign.work_orders.map((o: any) => ({
      work_order_number: o.work_order_number,
      sequence: o.sequence
    })));*/
  }
  // Función para rastrear filas (mejora el performance)
  rowTrackBy(index: number, item: any) {
    return item.work_order_number;
  }
  // Verificar si una fila está seleccionada
  isSelected(item: any): boolean {
    return this.selectedOrders.some(selected =>
      selected.work_order_number === item.work_order_number
    );
  }
  // Seleccionar todas las filas
  selectAll() {
    this.selectedOrders = [...this.currentCampaign.work_orders];
  }
  // Limpiar selección
  clearSelection() {
    this.selectedOrders = [];
  }
  // Guardar el nuevo orden en el backend
  saveOrderSequence() {
    // Construir payload con secuencia basada en el orden actual
    const payload = {
      workOrders: this.currentCampaign.work_orders.map((order: any) => ({
        work_order_id: order.work_order_id,
        sequence: order.sequence
      }))
    };
    this.apiService.PutRequestRender('work-orders/update-sequence', payload).then(async (response: any) => {
      if (response.errorsExistFlag) {
        //this.alerts.Info(response.message);
      } else {
        this.alerts.Success("Secuencia actualizada");
        this.changeDetector.detectChanges()
      }
    });
    // Ejemplo de implementación:
    // const sequenceData = this.currentCampaign.work_orders.map(order => ({
    //   work_order_number: order.work_order_number,
    //   sequence: order.sequence
    // }));
    //
    // this.orderService.updateOrderSequence(sequenceData)
    //   .subscribe(response => {
    //     console.log('Secuencia guardada exitosamente');
    //   });
  }
  protected readonly ToggleMenu = ToggleMenu;
}
