import { simulateDelay } from './api';

export interface IDnowSession {
  transactionId: string;
  redirectUrl: string;
}

export type VerificationResult = 'success' | 'failed' | 'pending';

export const identityService = {
  async startIDnowSession(userId: string): Promise<IDnowSession> {
    await simulateDelay(1500);
    return {
      transactionId: 'idnow_txn_' + Date.now(),
      redirectUrl: 'https://go.idnow.de/parkplatz/identifications/' + Date.now(),
    };
  },

  async checkVerificationStatus(transactionId: string): Promise<VerificationResult> {
    await simulateDelay(800);
    return 'success';
  },

  async uploadDocument(
    type: 'id_front' | 'id_back' | 'land_register' | 'rental_agreement' | 'management_confirmation',
    fileUri: string,
    fileName: string
  ): Promise<{ success: boolean; documentId: string }> {
    await simulateDelay(2000);
    return {
      success: true,
      documentId: 'doc_' + type + '_' + Date.now(),
    };
  },
};
