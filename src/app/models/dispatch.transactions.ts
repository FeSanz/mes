// Payloads para el backflush hacia Oracle Fusion.
// El orden de envío es crítico: operaciones → recursos → materiales.

/******************* operationTransactions *******************/
export interface OperationTransactionDetail {
  SourceSystemCode: string;
  OrganizationCode: string;
  TransactionQuantity: number;
  TransactionUnitOfMeasure: string;
  WoOperationSequenceNumber: number;
  WorkOrderNumber: string;
  FromDispatchState: string;
  ToDispatchState: string;
}

export interface OperationTransactionPayload {
  SourceSystemCode: string;
  SourceSystemType: string;
  OperationTransactionDetail: OperationTransactionDetail[];
}

/******************* resourceTransactions *******************/
export interface ResourceTransactionDetail {
  ResourceCode: string;
  TransactionUnitOfMeasure: string;
  OperationSequenceNumber: number;
  OrganizationCode: string;
  TransactionTypeCode: string;
  TransactionQuantity: number;
  WorkOrderNumber: string;
  ResourceSequenceNumber: number;
}

export interface ResourceTransactionPayload {
  SourceSystemCode: string;
  SourceSystemType: string;
  ResourceTransactionDetail: ResourceTransactionDetail[];
}

/******************* materialTransactions *******************/
export interface TransactionLot {
  LotNumber: string;
  TransactionQuantity?: number;
}

export interface MaterialTransactionDetail {
  OrganizationCode: string;
  WorkOrderNumber: string;
  WoOperationSequenceNumber: number;
  TransactionTypeCode: string;
  InventoryItemNumber: string;
  TransactionQuantity: number;
  TransactionUnitOfMeasure: string;
  SubinventoryCode?: string;   // no aplica en PRODUCT_COMPLETION
  TransactionLot?: TransactionLot[];  // requerido solo si el ítem es controlado por lote
}

export interface MaterialTransactionPayload {
  SourceSystemCode: string;
  SourceSystemType: string;
  MaterialTransactionDetail: MaterialTransactionDetail[];
}
