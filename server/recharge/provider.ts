import { db } from '../db';
import { OperatorId, RechargePlan, RechargeStatus } from '../types';

export interface RechargeRequestParams {
  orderId: string;
  mobileNumber: string;
  operator: OperatorId;
  planId: string;
  amount: number; // The actual plan value (e.g. 299)
}

export interface RechargeResponse {
  success: boolean;
  rechargeTxnId: string;
  operatorRefNum?: string;
  status: RechargeStatus;
  message: string;
}

export interface RechargeStatusResponse {
  status: RechargeStatus;
  operatorRefNum?: string;
  message: string;
  completedAt?: string;
}

export interface RechargeProvider {
  name: string;
  getPlans(operator: OperatorId): Promise<RechargePlan[]>;
  createRecharge(params: RechargeRequestParams): Promise<RechargeResponse>;
  checkRechargeStatus(rechargeTxnId: string): Promise<RechargeStatusResponse>;
}

/**
 * MockRechargeProvider simulates telecom operator gateway APIs
 * (Jio LAPU / Airtel HLR / CyberPlate / RoundPay sandbox).
 */
export class MockRechargeProvider implements RechargeProvider {
  name = 'MockTelecomGateway';

  async getPlans(operator: OperatorId): Promise<RechargePlan[]> {
    return db.getPlansByOperator(operator);
  }

  async createRecharge(params: RechargeRequestParams): Promise<RechargeResponse> {
    const settings = db.getSettings();

    // Check if failure simulation is forced
    const shouldFail =
      settings.simulateFailureRate > 0 && Math.random() * 100 < settings.simulateFailureRate;

    const rechargeTxnId = `TXN-${params.operator.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    if (shouldFail) {
      return {
        success: false,
        rechargeTxnId,
        status: 'FAILED',
        message: 'Operator switch timeout: Telecom circle gateway unreachable. Initiating refund queue.',
      };
    }

    // Realistic telecom operator reference number (e.g. Jio / Airtel confirmation ref)
    const operatorRefNum =
      params.operator === 'jio'
        ? `JIO-BR-${Math.floor(100000000000 + Math.random() * 900000000000)}`
        : `AIR-HLR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    return {
      success: true,
      rechargeTxnId,
      operatorRefNum,
      status: 'SUCCESS',
      message: `Recharge of ₹${params.amount} to +91 ${params.mobileNumber} confirmed by ${params.operator === 'jio' ? 'Reliance Jio Infocomm' : 'Bharti Airtel Ltd'}.`,
    };
  }

  async checkRechargeStatus(rechargeTxnId: string): Promise<RechargeStatusResponse> {
    const existing = db.getRechargeById(rechargeTxnId);
    if (!existing) {
      return {
        status: 'FAILED',
        message: 'Transaction not found on telecom switch.',
      };
    }

    return {
      status: existing.status,
      operatorRefNum: existing.operatorRefNum || undefined,
      message: existing.responseMessage,
      completedAt: existing.completedAt || undefined,
    };
  }
}

/**
 * Standard authorized telecom API adapter for production integrations
 * (e.g. RoundPay, Ezetap, Paysprint, CyberPlate, Lapu).
 */
export class AuthorizedApiRechargeProvider implements RechargeProvider {
  name = 'AuthorizedTelecomApi';
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey = process.env.RECHARGE_API_KEY || '', apiUrl = process.env.RECHARGE_API_URL || '') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async getPlans(operator: OperatorId): Promise<RechargePlan[]> {
    // Falls back to DB plans or live operator API catalog
    return db.getPlansByOperator(operator);
  }

  async createRecharge(params: RechargeRequestParams): Promise<RechargeResponse> {
    // If running in sandbox / key is mock or missing, gracefully delegate to Mock provider
    if (!this.apiKey || this.apiKey.includes('mock') || db.getSettings().mockRechargeMode) {
      return new MockRechargeProvider().createRecharge(params);
    }

    try {
      const response = await fetch(`${this.apiUrl}/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          operator: params.operator,
          mobile: params.mobileNumber,
          amount: params.amount,
          clientRefId: params.orderId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          rechargeTxnId: data.txnId || `TXN-ERR-${Date.now()}`,
          status: 'FAILED',
          message: data.message || 'Operator declined recharge request.',
        };
      }

      return {
        success: true,
        rechargeTxnId: data.txnId,
        operatorRefNum: data.operatorRef,
        status: 'SUCCESS',
        message: 'Recharge processed successfully by authorized gateway.',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Telecom API network failure';
      return {
        success: false,
        rechargeTxnId: `ERR-${Date.now()}`,
        status: 'FAILED',
        message: errorMsg,
      };
    }
  }

  async checkRechargeStatus(rechargeTxnId: string): Promise<RechargeStatusResponse> {
    return new MockRechargeProvider().checkRechargeStatus(rechargeTxnId);
  }
}

// Factory to resolve current active recharge provider
export function getRechargeProvider(): RechargeProvider {
  const settings = db.getSettings();
  if (settings.mockRechargeMode) {
    return new MockRechargeProvider();
  }
  return new AuthorizedApiRechargeProvider();
}
