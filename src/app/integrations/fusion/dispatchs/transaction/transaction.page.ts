import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { FloatLabel } from "primeng/floatlabel";
import { Select } from "primeng/select";
import { Toast } from 'primeng/toast';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { Button } from "primeng/button";
import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { AlertsService } from "../../../../services/alerts.service";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { PrimeTemplate } from "primeng/api";
import { ProgressBar } from "primeng/progressbar";
import { Slider } from "primeng/slider";
import { TableModule } from "primeng/table";
import { Tag } from "primeng/tag";
import { DialogModule } from 'primeng/dialog';

import { ApiService } from "../../../../services/api.service";
import { EndpointsService } from "../../../../services/endpoints.service";
import { Platform } from "@ionic/angular";
import { HeightTable, RowsPerPageProduction } from "../../../../models/tables.prime";
import { Round, Truncate } from "../../../../models/math.operations";
import {
  cloudUploadOutline, menuOutline
} from 'ionicons/icons';
import { addIcons } from "ionicons";
import { ToggleMenu } from 'src/app/models/design';
import {DatePicker} from "primeng/datepicker";

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FloatLabel, IonButtons, IonMenuButton,
    Select, IonGrid, IonRow, IonCol, IonIcon, IonButton, InputText, Button, IconField, InputIcon,
    IonCard, PrimeTemplate, TableModule, Tag, Dialog, DialogModule, IonSegment, IonSegmentButton, IonLabel, IonSegmentView, IonSegmentContent, DatePicker]
})
export class TransactionPage implements OnInit {
  private resizeTimeout: any;
  modalSize: string = '';

  segmentSelected: string = 'general';

  scrollHeight: string = '550px';
  rowsPerPage: number = 10;
  rowsPerPageOptions: number[] = [5, 10, 20];
  userData: any = {};
  organizationSelected: string | any = '';
  searchValueWO: string = '';

  isModaldispatchOpen: boolean = false;

  workOrdersToDispatch: any = { items: [] };

  workOrdersToDispachByShift: any = { items: [] }

  selectedWorkOrder: any = {
    WorkOrderNumber: '',
    Operations: { items: [] },
    Materials: { items: [] },
    Resources: { items: [] },
    Outputs: { items: [] }
  };
  fusionOriginalData: any = {};

  completeGlobal: number = 0;
  scrapGlobal: number = 0;
  rejectGlobal: number = 0;

  totalGlobal: number = 0;

  // IDs internos de la OT seleccionada (de la fila de pendientes, no de Fusion)
  // y las ejecuciones que componen el pendiente despachado.
  private internalWorkOrderId: number | null = null;
  private dispatchExecutionIds: number[] = [];
  private selectedType: 'P' | 'D' = 'P';

  // ──── Historial de despachos (replicado de MOVIL) ─────────────────────────────
  @ViewChild('dtHistoryGeneral') dtHistoryGeneral: any;
  @ViewChild('dtHistoryShift') dtHistoryShift: any;

  dispatchHistory: any[] = [];
  searchValueHistory: string = '';

  readonly intervalOptions = [
    { label: 'Hoy', value: 'today' },
    { label: 'Últimos 7 días', value: '7days' },
    { label: 'Esta semana', value: 'week' },
    { label: 'Últimos 30 días', value: '30days' },
    { label: 'Este mes', value: 'month' },
    { label: 'Rango personalizado', value: 'custom' }
  ];
  historyInterval: string = 'today';
  historyStartDate: Date | undefined;
  historyEndDate: Date | undefined;
  showDatePickers: boolean = false;

  // ──── Modal de detalle del historial ─────────────────────────────────────────
  isDetailOpen: boolean = false;
  detailDispatch: any = null;
  detailPayload: any = null;

  private dataTransformers: { [key: string]: (data: any) => any } = {
    'P': (data: any) => ({
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      WorkDefinitionId: data.WorkDefinitionId,
      ItemId: data.PrimaryProductId,
      ItemNumber: data.ItemNumber,
      Description: data.Description,
      UoM: data.PrimaryProductUOMCode,
      PlannedQuantity: data.PrimaryProductQuantity,
      CompletedQuantity: data.CompletedQuantity,
      Scrap: data.ScrappedQuantity,
      Reject: data.RejectedQuantity,
      StartDate: data.PlannedStartDate,
      CompletionDate: data.PlannedCompletionDate,
      StatusCode: data.WorkOrderSystemStatusCode,
      Operations: data.Operation,
      Materials: data.ProcessWorkOrderMaterial,
      Resources: data.ProcessWorkOrderResource,
      Outputs: data.ProcessWorkOrderOutput
    }),

    'D': (data: any) => ({
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      WorkDefinitionId: data.WorkDefinitionId,
      ItemId: data.InventoryItemId,
      ItemNumber: data.ItemNumber,
      Description: data.Description,
      UoM: data.UOMCode,
      PlannedQuantity: data.PlannedStartQuantity,
      CompletedQuantity: data.CompletedQuantity,
      Scrap: data.ScrappedQuantity,
      Reject: data.RejectedQuantity,
      StartDate: data.PlannedStartDate,
      CompletionDate: data.PlannedCompletionDate,
      StatusCode: data.WorkOrderSystemStatusCode,
      Operations: data.WorkOrderOperation,
      Materials: data.WorkOrderMaterial,
      Resources: data.WorkOrderResource
    })
  };

  //Variables para OnHand
  private materialOnHandCache: Map<string, any> = new Map();
  private loadingMaterials: Set<string> = new Set();
  // Propiedad para controlar si hay stock insuficiente
  hasInsufficientStock: boolean = false;

  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private platform: Platform,
    private cdr: ChangeDetectorRef,) {
    addIcons({ menuOutline, cloudUploadOutline });
  }

  ngOnInit() {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    if (this.userData && this.userData.Company && this.userData.Company.Organizations) {

      const organizations = this.userData.Company.Organizations;

      // Validar si hay organizaciones
      if (organizations && Array.isArray(organizations) && organizations.length > 0) {
        const sortedOrganizations = organizations.sort((a, b) => a.OrganizationId - b.OrganizationId);
        this.organizationSelected = sortedOrganizations[0];
        this.GetWorkOrders();
        this.LoadHistory();
      } else {
        this.alerts.Warning("No se encontraron organizaciones");
      }
    }

    this.RowsPerPage();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.UpdateScrollHeight();

    if (this.isModaldispatchOpen) {
      // Esperar 200ms después del último resize para imprimir
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.logModalSize();
      }, 200);
    }
  }

  private UpdateScrollHeight() {
    this.scrollHeight = HeightTable(this.platform.height());
    this.RowsPerPage();
  }

  private RowsPerPage() {
    this.rowsPerPage = RowsPerPageProduction(window.innerHeight);
    this.rowsPerPageOptions = [
      Math.max(5, Math.floor(this.rowsPerPage / 2)),
      this.rowsPerPage,
      Math.min(50, this.rowsPerPage * 2)
    ];
    if (this.dtHistoryGeneral) { this.dtHistoryGeneral.rows = this.rowsPerPage; }
    if (this.dtHistoryShift) { this.dtHistoryShift.rows = this.rowsPerPage; }
    this.cdr.detectChanges();
  }

  onSegmentChange(event: any) {
    this.segmentSelected = event.detail.value;
    this.GetWorkOrders();
    this.LoadHistory();
  }

  GetWorkOrders() {
    if(!this.organizationSelected)
    {
      this.alerts.Warning("Seleccione una organización");
      return;
    }

    if(this.segmentSelected === 'general') {
      this.workOrdersToDispatch = { items: [] };
      this.apiService.GetRequestRender(`dispatchPending/${this.organizationSelected.OrganizationId}`).then((response: any) => {
        if (response.items && Array.isArray(response.items)) {
          this.workOrdersToDispatch = response;
          //console.log(this.workOrdersToDispatch);
        }
      }).catch(error => {
        console.error('Error al obtener OTs:', error);
      });
    }else if(this.segmentSelected === 'shift') {
      this.workOrdersToDispachByShift = { items: [] };

      this.apiService.GetRequestRender(`dispatchByShiftPending/${this.organizationSelected.OrganizationId}`).then((response: any) => {
        if (response.items && Array.isArray(response.items)) {
          this.workOrdersToDispachByShift = response;
          //console.log(this.workOrdersToDispachByShift);
        }
      }).catch(error => {
        console.error('Error al obtener OTs:', error);
      });
    }

  }

  OpenDispatch(WOSelected: any) {
    this.GetWorkOrderFusion(WOSelected);

    this.logModalSize();
  }

  private logModalSize() {
    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }
  }

  GetWorkOrderFusion(WOSelectedData: any) {
    this.completeGlobal = parseFloat(WOSelectedData.DispatchPending) || 0;
    this.scrapGlobal = parseFloat(WOSelectedData.ScrapPending) || 0;
    this.rejectGlobal = parseFloat(WOSelectedData.RejectPending) || 0;

    this.totalGlobal = this.completeGlobal + this.scrapGlobal + this.rejectGlobal;

    // IDs internos (de mes_*) que vienen en la fila de pendientes; el transformer
    // Fusion sobrescribe WorkOrderId con el de Fusion, así que se preservan aquí.
    this.internalWorkOrderId = WOSelectedData.WorkOrderId ?? null;
    this.dispatchExecutionIds = Array.isArray(WOSelectedData.WorkExecutionIds)
      ? WOSelectedData.WorkExecutionIds : [];
    this.selectedType = WOSelectedData.Type === 'D' ? 'D' : 'P';

    // Limpiar cache al abrir nuevo WO
    this.materialOnHandCache.clear();
    this.loadingMaterials.clear();

    const path = WOSelectedData.Type === 'P' ? 'wo_process_dispatch' : 'wo_discrete_dispatch';
    this.apiService.GetRequestFusion(this.endPoints.Path(path, this.organizationSelected.Code, WOSelectedData.WorkOrderNumber)).then(async (response: any) => {
      const data = JSON.parse(response);
      this.fusionOriginalData = JSON.parse(JSON.stringify(data)); // Guardar estructura original

      //Para manufactura por PROCESOS O DISCRETA
      const transformer = this.dataTransformers[WOSelectedData.Type];
      if (!transformer) {
        this.alerts.Warning('Tipo de manufactura no identificada');
        return;
      }

      // Transformar y asignar datos
      const restructuredData = data.items.map((item: any) => transformer(item));

      this.selectedWorkOrder = restructuredData[0] || {};
      console.log(this.selectedWorkOrder);

      this.isModaldispatchOpen = true;

      // Cargar cantidades on-hand DESPUÉS de que el modal esté visible
      await this.LoadAllMaterialsOnHand();
    });
  }

  OnSaveDispatch() {
    this.ConfirmDispatch();
  }

  // ──── Backflush a Oracle Fusion + snapshot en backend IoT ────────────────────
  // Flujo: 1) operaciones secuencial → 2) materiales + salidas → 3) recursos → 4) IoT

  async ConfirmDispatch() {
    if (!this.selectedWorkOrder || !this.completeGlobal || this.completeGlobal <= 0) {
      this.alerts.Warning('No hay cantidad válida a despachar'); return;
    }
    if (this.hasInsufficientStock) {
      this.alerts.Warning('Sin stock suficiente en algunos materiales'); return;
    }

    const allOps = [...(this.selectedWorkOrder.Operations?.items || [])]
      .sort((a: any, b: any) => a.OperationSequenceNumber - b.OperationSequenceNumber);
    if (!allOps.length) { this.alerts.Warning('La orden de trabajo no tiene operaciones'); return; }

    if (!this.internalWorkOrderId) {
      this.alerts.Warning('No se pudo resolver el ID interno de la OT.'); return;
    }

    const orgCode  = this.organizationSelected.Code;
    const woNumber = this.selectedWorkOrder.WorkOrderNumber;
    const ratio    = this.completeGlobal / (this.selectedWorkOrder.PlannedQuantity || 1);

    await this.alerts.ShowLoading();
    try {
      // ── PASO 1: Operaciones secuencialmente ─────────────────────────────────
      const { snapshotOps, opErrorsCount, anyOpFailed } =
        await this.PostOperationsSequentially(allOps, orgCode, woNumber);

      // ── PASO 2: Materiales + Salidas (todas las operaciones) ────────────────
      const matItems = this.BuildAllMaterialItems(orgCode, woNumber, ratio);
      const outItems = this.BuildAllOutputItems(allOps, orgCode, woNumber, ratio);
      const { snapshotMaterials, snapshotOutputs, materialErrorsCount, outputErrorsCount } =
        await this.PostMaterialsAndOutputs(matItems, outItems, anyOpFailed);

      // ── PASO 3: Recursos (todas las operaciones) ────────────────────────────
      const resItems = this.BuildAllResourceItems(orgCode, woNumber, ratio);
      const { snapshotResources, resourceErrorsCount } =
        await this.PostResources(resItems, anyOpFailed);

      // ── PASO 4: Snapshot en backend IoT (cierra mes_work_execution) ─────────
      const errorsCount = opErrorsCount + materialErrorsCount + outputErrorsCount + resourceErrorsCount;
      const errorsByPayload = {
        Operations: opErrorsCount,
        Materials:  materialErrorsCount,
        Outputs:    outputErrorsCount,
        Resources:  resourceErrorsCount
      };

      await this.apiService.PostRequestRender('workDispatch/batch', {
        WorkOrderId:      this.internalWorkOrderId,
        WorkOrderNumber:  woNumber,
        OrganizationId:   this.organizationSelected.OrganizationId,
        OrganizationCode: orgCode,
        CreatedBy:        this.userData?.UserId ?? null,
        ErrorsCount:      errorsCount,
        // Solo se cierran las ejecuciones si no hubo errores en operaciones
        WorkExecutionIds: anyOpFailed ? [] : this.dispatchExecutionIds,
        ErrorsByPayload:  errorsByPayload,
        Operations:       snapshotOps,
        Outputs:          snapshotOutputs,
        Materials:        snapshotMaterials,
        Resources:        snapshotResources
      }, false);

      if (errorsCount > 0) {
        const failedSections = Object.entries(errorsByPayload)
          .filter(([, n]) => n > 0).map(([s]) => s).join(', ');
        this.alerts.Warning(`Despacho parcial — errores en: ${failedSections}. Revise el historial.`);
      } else {
        await this.alerts.Success(`Despacho de la OT ${woNumber} registrado correctamente`);
        this.isModaldispatchOpen = false;
      }

      this.GetWorkOrders();
      await this.LoadHistory();
    } finally {
      await this.alerts.HideLoading();
    }
  }

  // ── Paso 1: operaciones secuenciales ────────────────────────────────────────

  private async PostOperationsSequentially(
    allOps: any[], orgCode: string, woNumber: string
  ): Promise<{ snapshotOps: any[]; opErrorsCount: number; anyOpFailed: boolean }> {
    const snapshotOps: any[] = [];
    let opErrorsCount = 0;
    let anyOpFailed   = false;
    const lastSeq = allOps[allOps.length - 1].OperationSequenceNumber;

    for (const op of allOps) {
      const opSeq  = op.OperationSequenceNumber;
      const isLast = opSeq === lastSeq;
      const uom    = op.UnitOfMeasure || this.selectedWorkOrder.UoM;
      const opItems = this.BuildOpItems(opSeq, uom, orgCode, woNumber, isLast);

      if (anyOpFailed) {
        opItems.forEach((item: any) => {
          snapshotOps.push({
            ...this.OpItemToSnapshot(item), TransactionSuccessfulFlag: false,
            Error: { ErrorMessages: 'Operación anterior falló — no enviada', ErrorMessageNames: '' }
          });
          opErrorsCount++;
        });
        continue;
      }

      const raw  = await this.apiService.PostRequestFusion('operationTransactions', {
        SourceSystemCode: 'FUSION_MOBILE', SourceSystemType: 'EXTERNAL',
        OperationTransactionDetail: opItems
      }, false);
      const resp = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;

      const respItems: any[] = resp?.OperationTransactionDetail?.items ??
        (Array.isArray(resp?.OperationTransactionDetail) ? resp.OperationTransactionDetail : []);

      const hasErrors = resp?.ErrorsExistFlag === 'true' || respItems.some((d: any) => d.ErrorMessages);
      if (hasErrors) anyOpFailed = true;

      const errMap = new Map(
        respItems.filter((d: any) => d.ErrorMessages).map((d: any) => [d.ToDispatchState, d])
      );

      opItems.forEach((sent: any) => {
        const err    = errMap.get(sent.ToDispatchState);
        const failed = !!(err || (hasErrors && !errMap.size));
        if (failed) opErrorsCount++;
        snapshotOps.push({
          ...this.OpItemToSnapshot(sent),
          ...(err ? { Error: { ErrorMessages: err.ErrorMessages, ErrorMessageNames: err.ErrorMessageNames } }
               : failed ? { TransactionSuccessfulFlag: false, Error: { ErrorMessages: 'Error en operación', ErrorMessageNames: '' } } : {})
        });
      });
    }

    return { snapshotOps, opErrorsCount, anyOpFailed };
  }

  private BuildOpItems(opSeq: number, uom: string, orgCode: string, woNumber: string, isLast: boolean): any[] {
    const base = {
      SourceSystemCode: 'FUSION_MOBILE', OrganizationCode: orgCode,
      TransactionUnitOfMeasure: uom, WoOperationSequenceNumber: opSeq,
      WorkOrderNumber: woNumber, FromDispatchState: 'READY'
    };
    const items: any[] = [{ ...base, TransactionQuantity: this.completeGlobal, ToDispatchState: 'COMPLETE' }];
    if (isLast && this.scrapGlobal  > 0)
      items.push({ ...base, TransactionQuantity: this.scrapGlobal,  ToDispatchState: 'SCRAP'  });
    if (isLast && this.rejectGlobal > 0)
      items.push({ ...base, TransactionQuantity: this.rejectGlobal, ToDispatchState: 'REJECT' });
    return items;
  }

  private OpItemToSnapshot(sent: any): any {
    return {
      WoOperationSequenceNumber: sent.WoOperationSequenceNumber,
      TransactionQuantity:       sent.TransactionQuantity,
      TransactionUnitOfMeasure:  sent.TransactionUnitOfMeasure,
      FromDispatchState:         sent.FromDispatchState,
      ToDispatchState:           sent.ToDispatchState
    };
  }

  // ── Paso 2: materiales + salidas ────────────────────────────────────────────

  private BuildAllMaterialItems(orgCode: string, woNumber: string, ratio: number): any[] {
    return (this.selectedWorkOrder.Materials?.items || []).map((m: any) => ({
      OrganizationCode: orgCode, WorkOrderNumber: woNumber,
      WoOperationSequenceNumber: m.OperationSequenceNumber,
      TransactionTypeCode: 'MATERIAL_ISSUE',
      InventoryItemNumber: m.ItemNumber,
      TransactionQuantity: Round((m.Quantity || 0) * ratio),
      TransactionUnitOfMeasure: m.UOMCode,
      SubinventoryCode: m.SupplySubinventory,
      TransactionLot: m.LotNumber
        ? [{ LotNumber: m.LotNumber, TransactionQuantity: Round((m.Quantity || 0) * ratio) }] : []
    }));
  }

  private BuildAllOutputItems(allOps: any[], orgCode: string, woNumber: string, ratio: number): any[] {
    if (this.selectedWorkOrder.Outputs?.items?.length) {
      return (this.selectedWorkOrder.Outputs.items as any[]).map((out: any) => ({
        OrganizationCode: orgCode, WorkOrderNumber: woNumber,
        WoOperationSequenceNumber: out.OperationSequenceNumber,
        TransactionTypeCode: 'PRODUCT_COMPLETION',
        InventoryItemNumber: out.ItemNumber,
        TransactionQuantity: Round((out.OutputQuantity || 0) * ratio),
        TransactionUnitOfMeasure: out.UOMCode,
        SubinventoryCode: out.ComplSubinventoryCode || '',
        TransactionLot: []
      }));
    }
    const lastOp = allOps[allOps.length - 1];
    return lastOp ? [{
      OrganizationCode: orgCode, WorkOrderNumber: woNumber,
      WoOperationSequenceNumber: lastOp.OperationSequenceNumber,
      TransactionTypeCode: 'PRODUCT_COMPLETION',
      InventoryItemNumber: this.selectedWorkOrder.ItemNumber,
      TransactionQuantity: this.completeGlobal,
      TransactionUnitOfMeasure: this.selectedWorkOrder.UoM,
      SubinventoryCode: '', TransactionLot: []
    }] : [];
  }

  private async PostMaterialsAndOutputs(
    matItems: any[], outItems: any[], skipFusion: boolean
  ): Promise<{ snapshotMaterials: any[]; snapshotOutputs: any[]; materialErrorsCount: number; outputErrorsCount: number }> {
    let materialErrorsCount = 0;
    let outputErrorsCount   = 0;

    if (skipFusion) {
      const markFailed = (items: any[]) => items.map(s => ({
        ...s, TransactionSuccessfulFlag: false,
        Error: { ErrorMessages: 'Operación anterior falló — no enviada', ErrorMessageNames: '' }
      }));
      materialErrorsCount = matItems.length;
      outputErrorsCount   = outItems.length;
      return { snapshotMaterials: markFailed(matItems), snapshotOutputs: markFailed(outItems),
               materialErrorsCount, outputErrorsCount };
    }

    if (!matItems.length && !outItems.length) {
      return { snapshotMaterials: [], snapshotOutputs: [], materialErrorsCount: 0, outputErrorsCount: 0 };
    }

    const raw  = await this.apiService.PostRequestFusion('materialTransactions', {
      SourceSystemCode: 'FUSION_MOBILE', SourceSystemType: 'EXTERNAL',
      MaterialTransactionDetail: [...matItems, ...outItems]
    }, false);
    const resp = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;

    const respItems: any[] = resp?.MaterialTransactionDetail?.items ??
      (Array.isArray(resp?.MaterialTransactionDetail) ? resp.MaterialTransactionDetail : []);
    const globalError = resp?.ErrorsExistFlag === 'true' && !respItems.some((d: any) => d.ErrorMessages);
    const errMap = new Map(respItems.filter((d: any) => d.ErrorMessages).map((d: any) => [d.InventoryItemNumber, d]));

    const mapItem = (sent: any, isOutput: boolean) => {
      const err    = errMap.get(sent.InventoryItemNumber);
      const failed = !!(err || globalError);
      if (failed) isOutput ? outputErrorsCount++ : materialErrorsCount++;
      const item: any = {
        WoOperationSequenceNumber: sent.WoOperationSequenceNumber,
        InventoryItemNumber:       sent.InventoryItemNumber,
        SubinventoryCode:          sent.SubinventoryCode,
        TransactionQuantity:       sent.TransactionQuantity,
        TransactionUnitOfMeasure:  sent.TransactionUnitOfMeasure,
        TransactionTypeCode:       sent.TransactionTypeCode,
        TransactionLot:            sent.TransactionLot ?? []
      };
      if (err) {
        item.Error = { ErrorMessages: err.ErrorMessages, ErrorMessageNames: err.ErrorMessageNames };
      } else if (globalError) {
        item.TransactionSuccessfulFlag = false;
        item.Error = { ErrorMessages: isOutput ? 'Error en salida' : 'Error en material', ErrorMessageNames: '' };
      }
      return item;
    };

    return {
      snapshotMaterials: matItems.map(s => mapItem(s, false)),
      snapshotOutputs:   outItems.map(s => mapItem(s, true)),
      materialErrorsCount, outputErrorsCount
    };
  }

  // ── Paso 3: recursos ────────────────────────────────────────────────────────

  private BuildAllResourceItems(orgCode: string, woNumber: string, ratio: number): any[] {
    return (this.selectedWorkOrder.Resources?.items || []).map((r: any) => ({
      ResourceCode:             r.ResourceCode,
      TransactionUnitOfMeasure: r.UOMCode,
      OperationSequenceNumber:  r.OperationSequenceNumber,
      OrganizationCode:         orgCode,
      TransactionTypeCode:      'RESOURCE_CHARGE',
      TransactionQuantity:      Round((r.RequiredUsage || 0) * ratio),
      WorkOrderNumber:          woNumber,
      ResourceSequenceNumber:   r.ResourceSequenceNumber
    }));
  }

  private async PostResources(
    resItems: any[], skipFusion: boolean
  ): Promise<{ snapshotResources: any[]; resourceErrorsCount: number }> {
    if (!resItems.length) return { snapshotResources: [], resourceErrorsCount: 0 };

    if (skipFusion) {
      return {
        snapshotResources: resItems.map(s => ({
          ...s, TransactionSuccessfulFlag: false,
          Error: { ErrorMessages: 'Operación anterior falló — no enviada', ErrorMessageNames: '' }
        })),
        resourceErrorsCount: resItems.length
      };
    }

    const raw  = await this.apiService.PostRequestFusion('resourceTransactions', {
      SourceSystemCode: 'FUSION_MOBILE', SourceSystemType: 'EXTERNAL',
      ResourceTransactionDetail: resItems
    }, false);
    const resp = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;

    const respItems: any[] = resp?.ResourceTransactionDetail?.items ??
      (Array.isArray(resp?.ResourceTransactionDetail) ? resp.ResourceTransactionDetail : []);
    const globalError = resp?.ErrorsExistFlag === 'true' && !respItems.some((d: any) => d.ErrorMessages);
    const errMap = new Map(respItems.filter((d: any) => d.ErrorMessages).map((d: any) => [d.ResourceCode, d]));

    let resourceErrorsCount = 0;
    const snapshotResources = resItems.map((sent: any) => {
      const err    = errMap.get(sent.ResourceCode);
      const failed = !!(err || globalError);
      if (failed) resourceErrorsCount++;
      const item: any = {
        OperationSequenceNumber:  sent.OperationSequenceNumber,
        ResourceCode:             sent.ResourceCode,
        TransactionQuantity:      sent.TransactionQuantity,
        TransactionUnitOfMeasure: sent.TransactionUnitOfMeasure,
        TransactionTypeCode:      sent.TransactionTypeCode
      };
      if (err) {
        item.Error = { ErrorMessages: err.ErrorMessages, ErrorMessageNames: err.ErrorMessageNames };
      } else if (globalError) {
        item.TransactionSuccessfulFlag = false;
        item.Error = { ErrorMessages: 'Error en recurso', ErrorMessageNames: '' };
      }
      return item;
    });

    return { snapshotResources, resourceErrorsCount };
  }

  // ──── Historial de despachos ──────────────────────────────────────────────────

  async LoadHistory() {
    if (!this.organizationSelected?.OrganizationId) return;
    const orgId = this.organizationSelected.OrganizationId;
    const tz = new Date().getTimezoneOffset();

    let endpoint: string;
    if (this.historyInterval === 'custom') {
      if (!this.historyStartDate || !this.historyEndDate) return;
      const start = this.FormatDateParam(this.historyStartDate);
      const end = this.FormatDateParam(this.historyEndDate);
      endpoint = `workDispatch/history/${orgId}/between/${start}/${end}`;
    } else {
      endpoint = `workDispatch/history/${orgId}/interval/${this.historyInterval}?tzOffset=${tz}`;
    }

    const response: any = await this.apiService.GetRequestRender(endpoint, false);
    this.dispatchHistory = response?.items || [];
  }

  OnIntervalChange() {
    this.showDatePickers = this.historyInterval === 'custom';
    if (this.historyInterval !== 'custom') {
      this.LoadHistory();
    }
  }

  OnDateRangeChange() {
    if (this.historyStartDate && this.historyEndDate) {
      this.LoadHistory();
    }
  }

  OnOrganizationChange() {
    this.GetWorkOrders();
    this.LoadHistory();
  }

  async OpenDispatchDetail(dispatch: any) {
    await this.alerts.ShowLoading();
    try {
      const response: any = await this.apiService.GetRequestRender(
        `workDispatch/${dispatch.WorkDispatchId}`, false
      );
      const data = response?.items?.[0];
      this.detailDispatch = dispatch;
      this.detailPayload = data?.RequestPayload ?? null;
      this.isDetailOpen = true;
    } finally {
      await this.alerts.HideLoading();
    }
  }

  StatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    if (status === 'SUCCESS') return 'success';
    if (status === 'PARTIAL_ERROR') return 'warn';
    if (status === 'ERROR') return 'danger';
    return 'secondary';
  }

  SectionHasError(section: 'Operations' | 'Resources' | 'Materials' | 'Outputs'): boolean {
    return (this.detailDispatch?.ErrorsByPayload?.[section] ?? 0) > 0;
  }

  ErroredSections(): string[] {
    const byPayload = this.detailDispatch?.ErrorsByPayload;
    if (!byPayload) return [];
    return Object.entries(byPayload)
      .filter(([, count]) => (count as number) > 0)
      .map(([section]) => section);
  }

  ClearHistoryFilter(table: any) {
    table.clear();
    this.searchValueHistory = '';
  }

  private FormatDateParam(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── Helpers del diálogo de detalle (agrupación por operación) ────────────────

  DetailSequences(): number[] {
    if (!this.detailPayload) return [];
    const seqs = new Set<number>();
    (this.detailPayload.Operations || []).forEach((o: any) => seqs.add(o.WoOperationSequenceNumber));
    (this.detailPayload.Resources  || []).forEach((r: any) => seqs.add(r.OperationSequenceNumber));
    (this.detailPayload.Materials  || []).forEach((m: any) => seqs.add(m.WoOperationSequenceNumber));
    (this.detailPayload.Outputs    || []).forEach((o: any) => seqs.add(o.WoOperationSequenceNumber));
    return Array.from(seqs).sort((a, b) => a - b);
  }

  DetailOpsForSeq(seq: number): any[] {
    return (this.detailPayload?.Operations || []).filter((o: any) => o.WoOperationSequenceNumber === seq);
  }

  DetailOutputsForSeq(seq: number): any[] {
    return (this.detailPayload?.Outputs || []).filter((o: any) => o.WoOperationSequenceNumber === seq);
  }

  DetailMaterialsForSeq(seq: number): any[] {
    return (this.detailPayload?.Materials || []).filter((m: any) => m.WoOperationSequenceNumber === seq);
  }

  DetailResourcesForSeq(seq: number): any[] {
    return (this.detailPayload?.Resources || []).filter((r: any) => r.OperationSequenceNumber === seq);
  }

  DispatchLabel(toDispatchState: string): string {
    if (toDispatchState === 'COMPLETE') return 'COMPLETO';
    if (toDispatchState === 'SCRAP')    return 'DESPERDICIO';
    if (toDispatchState === 'REJECT')   return 'RECHAZO';
    return toDispatchState;
  }

  LotLabel(transactionLot: any[]): string {
    if (!transactionLot?.length) return '';
    return transactionLot.map((l: any) => l.LotNumber).join(', ');
  }

  trackByDispatch = (_: number, d: any) => d.WorkDispatchId;

  Operations() {
    return this.selectedWorkOrder?.Operations?.items || [];
  }

  //Metodo helper para obtener PlannedQuantity de forma segura
  private getPlannedQuantity(): number {
    return this.selectedWorkOrder?.PlannedQuantity || 1;
  }

  OutputsForOperation(operationSequence: number) {
    const outputs = this.selectedWorkOrder?.Outputs?.items || [];
    const filtered = outputs.filter((output: any) => output.OperationSequenceNumber === operationSequence);
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada output
    filtered.forEach((output: any) => {
      output.Standard = (output.OutputQuantity || 0) / plannedQuantity;
      output.StandardReal = (output.Standard || 0) * (this.totalGlobal || 0);
    });

    return filtered;
  }

  MaterialsForOperation(operationSequence: number) {
    const materials = this.selectedWorkOrder?.Materials?.items || [];
    const filtered = materials.filter((material: any) => material.OperationSequenceNumber === operationSequence);
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada material
    filtered.forEach((material: any) => {
      material.Standard = (material.Quantity || 0) / plannedQuantity;
      material.StandardReal = (material.Standard || 0) * (this.totalGlobal || 0);

      // Usar cache si existe
      const cacheKey = `${material.ItemNumber}_${material.SupplySubinventory}`;
      const cached = this.materialOnHandCache.get(cacheKey);

      if (cached) {
        material.QuantityOnhand = cached.QuantityOnhand;
        material.AvailableToTransact = cached.AvailableToTransact;
        material.OnHandMessage = cached.OnHandMessage;
      } else {
        material.QuantityOnhand = material.QuantityOnhand ?? 0;
        material.AvailableToTransact = material.AvailableToTransact ?? 0;
        material.OnHandMessage = material.OnHandMessage ?? 'Pendiente...';
      }
    });

    return filtered;
  }

  //Función para cargar todos los materiales de una vez
  private async LoadAllMaterialsOnHand() {
    const materials = this.selectedWorkOrder?.Materials?.items || [];

    if (!materials.length) return;

    const promises = materials.map(async (material: any) => {
      const cacheKey = `${material.ItemNumber}_${material.SupplySubinventory}`;

      // Evitar llamadas duplicadas
      if (this.materialOnHandCache.has(cacheKey) || this.loadingMaterials.has(cacheKey)) {
        return;
      }

      this.loadingMaterials.add(cacheKey);

      const payload = {
        OrganizationCode: this.organizationSelected.Code,
        ItemNumber: material.ItemNumber,
        Subinventory: material.SupplySubinventory
      };


      try {
        const response: any = await this.apiService.PostRequestFusion('availableQuantityDetails', payload, false);

        // Parsear si viene como string
        const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;

        const result = {
          QuantityOnhand: parsedResponse.QuantityOnhand || 0,
          AvailableToTransact: parsedResponse.AvailableToTransact || 0,
          OnHandMessage: parsedResponse.ReturnStatus
        };


        this.materialOnHandCache.set(cacheKey, result);

        // Actualizar el material original
        material.QuantityOnhand = result.QuantityOnhand;
        material.AvailableToTransact = result.AvailableToTransact;
        material.OnHandMessage = result.OnHandMessage;

      } catch (error: any) {
        const result = {
          QuantityOnhand: 0,
          AvailableToTransact: 0,
          OnHandMessage: `Error: ${error.message || error}`
        };
        this.materialOnHandCache.set(cacheKey, result);
      } finally {
        this.loadingMaterials.delete(cacheKey);
      }
    });

    await Promise.all(promises);
    // Validar stock después de cargar todos los materiales
    this.validateMaterialStock();
  }

  //Metodo para validar stock
  private validateMaterialStock() {
    const materials = this.selectedWorkOrder?.Materials?.items || [];
    this.hasInsufficientStock = materials.some((material: any) => {
      const cacheKey = `${material.ItemNumber}_${material.SupplySubinventory}`;
      const cached = this.materialOnHandCache.get(cacheKey);
      return cached && cached.AvailableToTransact <= 0;
    });
  }

  EquipmentResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    const filtered = resources.filter((resource: any) =>
      resource.OperationSequenceNumber === operationSequence && resource.ResourceType === "EQUIPMENT"
    );
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada equipment
    filtered.forEach((equipment: any) => {
      equipment.Standard = (equipment.RequiredUsage || 0) / plannedQuantity;
      equipment.StandardReal = (equipment.Standard || 0) * (this.totalGlobal || 0);
    });

    return filtered;
  }

  LaborResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    const filtered = resources.filter((resource: any) =>
      resource.OperationSequenceNumber === operationSequence && resource.ResourceType === "LABOR"
    );
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada labor
    filtered.forEach((labor: any) => {
      labor.Standard = (labor.RequiredUsage || 0) / plannedQuantity;
      labor.StandardReal = (labor.Standard || 0) * (this.totalGlobal || 0);
    });

    return filtered;
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearWorkOrders(table: any) {
    table.clear();
    this.searchValueWO = '';
  }

  protected readonly Truncate = Truncate;
  protected readonly ToggleMenu = ToggleMenu;
}
